// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import Foundation

// Same catalog/release boundaries as Android. No general-purpose authenticated proxy.
enum NetworkPolicy {
    static let limit = 12 * 1024 * 1024
    static let catalogHosts: Set<String> = ["www.thalia.de", "www.hugendubel.de", "blackwells.co.uk", "www.betterworldbooks.com", "www.kitapyurdu.com", "www.bkmkitap.com", "www.nadirkitap.com", "nadirkitap.com", "openlibrary.org"]
    static func secure(_ url: URL) -> Bool { url.scheme == "https" && url.port == nil && url.user == nil && url.password == nil && url.host != nil }
    static func drive(_ url: URL) -> Bool { url.host == "www.googleapis.com" && (url.path.hasPrefix("/drive/") || url.path.hasPrefix("/upload/drive/")) }
    static func allowed(_ url: URL, method: String) -> Bool {
        guard secure(url), let host = url.host else { return false }
        if drive(url) {
            let path = url.path
            return ["GET", "POST", "DELETE"].contains(method) && (path == "/drive/v3/files" || path.range(of: "^/drive/v3/files/[A-Za-z0-9_-]+$", options: .regularExpression) != nil || path == "/upload/drive/v3/files")
        }
        if host == "www.googleapis.com" { return method == "GET" && url.path.hasPrefix("/books/v1/volumes") }
        if host == "services.dnb.de" { return method == "GET" && url.path == "/sru/dnb" }
        if host == "sru.k10plus.de" { return method == "GET" && url.path == "/opac-de-627" }
        if catalogHosts.contains(host) { return method == "GET" }
        if host == "graphql.anilist.co" { return method == "POST" && ["", "/"].contains(url.path) }
        if host == "api.github.com" { return method == "GET" && url.path == "/repos/ayca-kaygusuz/quiet-shelf-public/releases/latest" }
        if host == "github.com" { return method == "GET" && url.path.range(of: "^/ayca-kaygusuz/quiet-shelf-public/releases/download/[^/]+/SHA256SUMS\\.txt$", options: .regularExpression) != nil }
        return method == "GET" && ["release-assets.githubusercontent.com", "objects.githubusercontent.com"].contains(host)
    }
    static func external(_ url: URL) -> Bool {
        guard secure(url), let host = url.host else { return false }
        return catalogHosts.contains(host) || ["books.google.com", "anilist.co", "d-nb.info", "opac.k10plus.de"].contains(host) || host == "github.com" && url.path.hasPrefix("/ayca-kaygusuz/quiet-shelf-public/releases/")
    }
}

// Bounded streaming, no cookies/cache, no implicit redirects or forwarded credentials.
final class BoundedRequest: NSObject, URLSessionDataDelegate, URLSessionTaskDelegate {
    private var session: URLSession!
    private var task: URLSessionDataTask!
    private var data = Data()
    private var response: HTTPURLResponse?
    private var completion: ((Result<[String: Any], Error>) -> Void)?
    init(request: URLRequest, completion: @escaping (Result<[String: Any], Error>) -> Void) {
        super.init()
        self.completion = completion
        let config = URLSessionConfiguration.ephemeral
        config.httpShouldSetCookies = false; config.httpCookieStorage = nil; config.urlCache = nil
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.timeoutIntervalForRequest = 45; config.timeoutIntervalForResource = 90
        session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
        task = session.dataTask(with: request); task.resume()
    }
    func cancel() { task.cancel() }
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        guard let http = response as? HTTPURLResponse, response.expectedContentLength <= Int64(NetworkPolicy.limit) else { completionHandler(.cancel); return }
        self.response = http; completionHandler(.allow)
    }
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive chunk: Data) {
        guard data.count + chunk.count <= NetworkPolicy.limit else { task.cancel(); return }
        data.append(chunk)
    }
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let result: Result<[String: Any], Error>
        if let error { result = .failure(error) }
        else if let response {
            var headers: [String: String] = [:]
            for name in ["Content-Type", "Location", "ETag", "Retry-After"] { if let value = response.value(forHTTPHeaderField: name) { headers[name] = value } }
            // Foundation converts the retailer's declared legacy encoding when needed.
            let encoding: String.Encoding = response.textEncodingName?.lowercased().contains("1254") == true ? .windowsCP1254 : .utf8
            let text = String(data: data, encoding: encoding) ?? String(decoding: data, as: UTF8.self)
            result = .success(["status": response.statusCode, "headers": headers, "body": text])
        } else { result = .failure(URLError(.badServerResponse)) }
        let done = completion; completion = nil; session.finishTasksAndInvalidate()
        DispatchQueue.main.async { done?(result) }
    }
}
