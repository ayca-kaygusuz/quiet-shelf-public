// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import XCTest
import UIKit
import WebKit
@testable import QuietShelf

final class RuntimeTests: XCTestCase {
    @MainActor private func evaluate(_ script: String, in web: WKWebView) async throws -> Any? {
        try await web.evaluateJavaScript(script)
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
        let status = try await web.callAsyncJavaScript("return await (await fetch('/api/account/status')).json()", arguments: [:], in: nil, contentWorld: .page) as? [String: Any]
        XCTAssertEqual(status?["mode"] as? String, "ios")
        XCTAssertNotNil(status?["network"])
        _ = try await web.callAsyncJavaScript("await QuietShelfAccount.refresh()", arguments: [:], in: nil, contentWorld: .page)
        _ = try await evaluate("QuietShelfApp.apply({library:[{id:'ios-qa-title',title:'Tablet test title',author:'Test author',status:'Unread',history:[]}],preferences:{theme:'sage'}})", in: web)
        let actual3 = try await evaluate("QuietShelfApp.snapshot().library[0].title", in: web) as? String
        XCTAssertEqual(actual3, "Tablet test title")
        let actual4 = try await evaluate("document.documentElement.dataset.theme", in: web) as? String
        XCTAssertEqual(actual4, "sage")
        let dimensions = try await evaluate("({width:innerWidth,content:document.documentElement.scrollWidth,columns:getComputedStyle(document.querySelector('.layout')).gridTemplateColumns.split(' ').length,detail:getComputedStyle(document.querySelector('#detail')).display})", in: web) as? [String: Any]
        let width = dimensions?["width"] as? Int ?? 0
        XCTAssertLessThanOrEqual(dimensions?["content"] as? Int ?? 99999, width + 1)
        if width >= 720 { XCTAssertEqual(dimensions?["columns"] as? Int, 2); XCTAssertNotEqual(dimensions?["detail"] as? String, "none") }
        else { XCTAssertEqual(dimensions?["columns"] as? Int, 1) }
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
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "http://www.kitapyurdu.com/")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://www.googleapis.com/drive/v3/about")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://example.com/")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://www.googleapis.com:443/drive/v3/files")!, method: "GET"))
        XCTAssertFalse(NetworkPolicy.allowed(URL(string: "https://user@www.googleapis.com/drive/v3/files")!, method: "GET"))
        XCTAssertFalse(Assets.local(URL(string: "quiet-shelf-ios://evil/")))
        XCTAssertFalse(Assets.names.contains("../Info.plist"))
    }
}
