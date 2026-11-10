// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import XCTest

final class TabletTests: XCTestCase {
    func testWindowPortraitLandscapeAndRestart() {
        let app = XCUIApplication(); app.launch()
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 25))
        let addButton = app.buttons["+ Add title"].firstMatch
        XCTAssertTrue(addButton.waitForExistence(timeout: 20))
        addButton.tap()
        XCTAssertTrue(app.staticTexts["Add a story"].firstMatch.waitForExistence(timeout: 5))
        app.buttons["Cancel"].firstMatch.tap()
        XCUIDevice.shared.orientation = .landscapeLeft
        sleep(2)
        XCTAssertTrue(addButton.isHittable)
        let landscape = XCTAttachment(screenshot: app.screenshot()); landscape.name = "Native landscape"; landscape.lifetime = .keepAlways; add(landscape)
        XCUIDevice.shared.orientation = .portrait
        sleep(2)
        XCTAssertTrue(addButton.isHittable)
        let portrait = XCTAttachment(screenshot: app.screenshot()); portrait.name = "Native portrait"; portrait.lifetime = .keepAlways; add(portrait)
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["+ Add title"].firstMatch.waitForExistence(timeout: 25))
    }
}
