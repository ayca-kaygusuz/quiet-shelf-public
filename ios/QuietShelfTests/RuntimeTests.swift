// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import XCTest
import UIKit
import WebKit
@testable import QuietShelf

final class RuntimeTests: XCTestCase {
    @MainActor private func evaluate(_ script: String, in web: WKWebView) async throws -> Any? {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Any?, Error>) in
            web.evaluateJavaScript(script) { value, error in
                if let error { continuation.resume(throwing: error) }
                else { continuation.resume(returning: value) }
            }
        }
    }
    @MainActor private func asyncScript(_ script: String, in web: WKWebView) async throws -> Any? {
        // Use the same callback evaluator as the application. Some older Apple
        // simulator runtimes omit the separate Swift WebKit overlay library.
        let key = UUID().uuidString
        let launch = "globalThis.__quietShelfTestPromises ??= {}; (async()=>{\n" + script + "\n})().then(value=>globalThis.__quietShelfTestPromises['" + key + "']={value:value??null},error=>globalThis.__quietShelfTestPromises['" + key + "']={error:String(error.message||error)}); true"
        _ = try await evaluate(launch, in: web)
        for _ in 0..<100 {
            if let result = try await evaluate("globalThis.__quietShelfTestPromises['" + key + "']||null", in: web) as? [String: Any] {
                _ = try await evaluate("delete globalThis.__quietShelfTestPromises['" + key + "']", in: web)
                if let message = result["error"] as? String { throw NSError(domain: "JavaScript", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
                return result["value"]
            }
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        throw NSError(domain: "JavaScript", code: 2, userInfo: [NSLocalizedDescriptionKey: "Async test script did not finish"])
    }
    @MainActor private func ready() async throws -> WKWebView {
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.first as? UIWindowScene)
        let controller = try XCTUnwrap(scene.windows.first?.rootViewController as? ShelfController)
        let web = try XCTUnwrap(controller.view.subviews.first as? WKWebView)
        for _ in 0..<150 {
            if (try? await evaluate("!!globalThis.QuietShelfApp && !!globalThis.QuietShelfIOS && !!globalThis.QuietShelfAccount && document.documentElement.dataset.platform==='ios'", in: web)) as? Bool == true { return web }
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        throw NSError(domain: "Runtime", code: 1, userInfo: [NSLocalizedDescriptionKey: "Shared interface did not load in WKWebView"])
    }
    @MainActor func testSharedAppStorageCatalogAdapterAndTabletLayout() async throws {
        let web = try await ready()
        let actual1 = try await evaluate("location.protocol", in: web) as? String
        XCTAssertEqual(actual1, "quiet-shelf-ios:")
        let actual2 = try await evaluate("crypto.randomUUID().length", in: web) as? Int
        XCTAssertEqual(actual2, 36)
        let previous = try await evaluate("localStorage.getItem('ios.qa.persistence')", in: web) as? String
        XCTAssertTrue(previous == nil || previous == "kept")
        _ = try await evaluate("localStorage.setItem('ios.qa.persistence','kept')", in: web)
        let status = try await asyncScript("return await (await fetch('/api/account/status')).json()", in: web) as? [String: Any]
        XCTAssertEqual(status?["mode"] as? String, "ios")
        XCTAssertNotNil(status?["network"])
        let update = try await asyncScript("""
        const {latestUpdate}=await import('/releases.mjs');
        const base='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/download/v0.99.0/',name='Quiet-Shelf-iOS-0.99.0-unsigned.ipa',hash='a'.repeat(64);
        const update=await latestUpdate('0.19.0',{kind:'ios',fetcher:async url=>String(url).startsWith('https://api.github.com/')?Response.json({tag_name:'v0.99.0',assets:[{name,size:123,digest:'sha256:'+hash,browser_download_url:base+name},{name:'SHA256SUMS.txt',browser_download_url:base+'SHA256SUMS.txt'}]}):new Response(hash+'  '+name)});
        return update.version;
        """, in: web) as? String
        XCTAssertEqual(update, "0.99.0", "Update checks must work in actual WebKit without stream async iterators")
        _ = try await asyncScript("await QuietShelfAccount.refresh()", in: web)
        _ = try await evaluate("QuietShelfApp.apply({library:[{id:'ios-qa-title',title:'Tablet test title',author:'Test author',status:'Unread',history:[]}],preferences:{theme:'sage'}});QuietShelfApp.changed?.()", in: web)
        let actual3 = try await evaluate("QuietShelfApp.snapshot().library[0].title", in: web) as? String
        XCTAssertEqual(actual3, "Tablet test title")
        let actual4 = try await evaluate("document.documentElement.dataset.theme", in: web) as? String
        XCTAssertEqual(actual4, "sage")
        let dimensions = try await evaluate("({width:document.documentElement.clientWidth,visualWidth:innerWidth,content:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.layout')).gridTemplateColumns.split(' ').length,detail:getComputedStyle(document.querySelector('#detail')).display})", in: web) as? [String: Any]
        let width = dimensions?["width"] as? Int ?? 0
        XCTAssertLessThanOrEqual(dimensions?["content"] as? Int ?? 99999, width + 1)
        if width >= 720 { XCTAssertEqual(dimensions?["columns"] as? Int, 2); XCTAssertNotEqual(dimensions?["detail"] as? String, "none") }
        else { XCTAssertEqual(dimensions?["columns"] as? Int, 1) }
        // Resize the real WKWebView to window widths used by iPad multitasking.
        // This tests WebKit's layout; OS Split View gestures remain a device check.
        if UIDevice.current.userInterfaceIdiom == .pad, let parent = web.superview {
            let original = parent.constraints.filter { ($0.firstItem as? UIView) === web || ($0.secondItem as? UIView) === web }
            NSLayoutConstraint.deactivate(original)
            let widthConstraint = web.widthAnchor.constraint(equalToConstant: 834)
            let temporary = [web.leadingAnchor.constraint(equalTo: parent.leadingAnchor), web.topAnchor.constraint(equalTo: parent.safeAreaLayoutGuide.topAnchor), web.heightAnchor.constraint(equalToConstant: 900), widthConstraint]
            NSLayoutConstraint.activate(temporary)
            defer { NSLayoutConstraint.deactivate(temporary); NSLayoutConstraint.activate(original); parent.layoutIfNeeded() }
            for size in [834, 768, 720, 719, 600, 507, 375, 320, 834] {
                widthConstraint.constant = CGFloat(size); parent.layoutIfNeeded()
                // Native constraints and the WebKit content process resize asynchronously.
                for _ in 0..<50 {
                    let viewport = try await evaluate("innerWidth", in: web) as? Int
                    if viewport == size { break }
                    try await Task.sleep(nanoseconds: 100_000_000)
                }
                _ = try await evaluate("document.querySelector('#list .titlebutton').click()", in: web)
                let layout = try await evaluate("({width:document.documentElement.clientWidth,visualWidth:innerWidth,content:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.layout')).gridTemplateColumns.split(' ').length,detail:getComputedStyle(document.querySelector('#detail')).display})", in: web) as? [String: Any]
                // The native view must fill its window. WebKit may preserve a
                // separate CSS page scale while transitioning between sizes.
                XCTAssertEqual(web.bounds.width, CGFloat(size), accuracy: 0.5)
                let viewport = layout?["width"] as? Int ?? 0
                print("Resized native width", size, "layout viewport", viewport, "visual viewport", layout?["visualWidth"] ?? 0, "native zoom", web.scrollView.zoomScale)
                XCTAssertGreaterThan(viewport, 0)
                XCTAssertLessThanOrEqual(layout?["content"] as? Int ?? 99999, viewport + 1)
                XCTAssertEqual(layout?["columns"] as? Int, viewport >= 720 ? 2 : 1)
                XCTAssertEqual(layout?["detail"] as? String, "block")
            }
        }
        // Reload the actual custom scheme origin, not a substituted HTTP test page.
        web.reload(); try await Task.sleep(nanoseconds: 1_000_000_000)
        let reopened = try await ready()
        let actual5 = try await evaluate("localStorage.getItem('ios.qa.persistence')", in: reopened) as? String
        XCTAssertEqual(actual5, "kept")
        let actual6 = try await evaluate("QuietShelfApp.snapshot().library[0].title", in: reopened) as? String
        XCTAssertEqual(actual6, "Tablet test title")
        let actual7 = try await evaluate("document.documentElement.dataset.theme", in: reopened) as? String
        XCTAssertEqual(actual7, "sage")
    }
    func testNativeNetworkAndAssetBoundaries() {
        XCTAssertTrue(NetworkPolicy.allowed(URL(string: "https://www.kitapyurdu.com/index.php?route=product/search")!, method: "GET"))
        for address in ["https://www.lovelybooks.de/mapi/search/detail/books?q=Ende", "https://www.lovelybooks.de/mapi/books/byTitle/1759914184", "https://www.lovelybooks.de/mapi/books/1523237141/details", "https://services.dnb.de/sru/dnb?operation=searchRetrieve", "https://sru.k10plus.de/opac-de-627", "https://www.thalia.de/suche?sq=Ende", "https://www.hugendubel.de/de/search?q=Ende"] {
            XCTAssertTrue(NetworkPolicy.allowed(URL(string: address)!, method: "GET"))
            XCTAssertFalse(NetworkPolicy.allowed(URL(string: address)!, method: "POST"))
        }
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://www.lovelybooks.de/mapi/user/library")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://www.lovelybooks.de/mapi/auth/login")!, method: "POST"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://www.lovelybooks.de/profil/private/")!, method: "GET"))
        XCTAssertTrue(NetworkPolicy.external(URL(string: "https://www.lovelybooks.de/autor/Michael-Ende/Die-unendliche-Geschichte-1759914184-t/")!))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://services.dnb.de/private")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://sru.k10plus.de/private")!, method: "GET"))
        XCTAssertTrue(NetworkPolicy.external(URL(string: "https://d-nb.info/1168641489")!))
        XCTAssertTrue(NetworkPolicy.external(URL(string: "https://opac.k10plus.de/DB=2.299/PPNSET?PPN=1035237822")!))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "http://www.kitapyurdu.com/")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://www.googleapis.com/drive/v3/about")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://example.com/")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://www.googleapis.com:443/drive/v3/files")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://user@www.googleapis.com/drive/v3/files")!, method: "GET"))
        XCTAssertFalse(Assets.local(URL(string: "quiet-shelf-ios://evil/")))
        XCTAssertFalse(Assets.names.contains("../Info.plist"))
    }
}
