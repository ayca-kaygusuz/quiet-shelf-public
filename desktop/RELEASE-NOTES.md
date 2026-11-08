Quiet Shelf 0.11.2 makes Windows update progress visible inside the app.

- An Updates button in the header and a small status card show download percentage and size, verification, and when the update is ready to install.
- The card stays visible while scrolling. Hide it without stopping the download; reopen it from Updates while the header keeps showing progress.
- Restart a downloaded, verified update from the card without downloading it again. The app still asks before restarting, so you can finish an unsaved title entry.
- The indicator follows Dark Ink and Paper Grove. Browser copies keep their existing interface; this indicator is for the standalone Windows app.

Use Alt → Help → Check for updates… in your current app to install this version. The new indicator is available after that restart, for subsequent checks and updates. Library records, reading history, preferences, and your saved Google Books key are preserved.

The installer includes the rebuilt `Quiet Shelf.exe`. `SHA256SUMS.txt` contains its checksum. It is unsigned, so Windows may show an unknown-publisher or reputation warning. Regression checks cover real download state, the protected app protocol, progress rendering/actions and unchanged local data. The Windows workflow checks native startup, captures both themes, and verifies installed update/restart behavior.
