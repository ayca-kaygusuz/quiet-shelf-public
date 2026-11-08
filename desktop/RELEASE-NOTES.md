Quiet Shelf 0.11.1 fixes searches that combine a title with an author name.

- Nadir Kitap now finds the reported Italian grammar book for both `italyanca dil bilgisi ela` and `italyanca dilbilgisi ela`, with Turkish or Any language selected.
- Ranking matches words across the title and author together, and recognizes adjacent alphabetic words written joined or spaced. Different known volume numbers are still excluded.
- The installed Windows app, browser source, and installer use the same corrected search code. Library records, reading history, preferences, and the saved Google Books key are preserved.

If you have 0.11.0, press Alt → Help → Check for updates…, then download and restart to install. Older versions need this Windows 11 x64 installer once to enable future GitHub updates. The installer includes the rebuilt `Quiet Shelf.exe`; no browser server or Node.js is needed.

`SHA256SUMS.txt` contains the installer checksum. The installer is unsigned, so Windows may show an unknown-publisher or reputation warning. Regression checks cover the reported listing and both spellings/language choices, alongside the existing catalog, reading-library and updater tests. The release workflow checks native Windows startup and installed update/restart behavior.
