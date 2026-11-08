Quiet Shelf 0.11.0 adds Nadir Kitap search and Windows updates from GitHub.

- Choose Nadir Kitap in Add title to search titles/authors or ISBNs, or paste a book listing link. Results and edition details stay inside Quiet Shelf; no browser connector or API key is needed.
- Matching seller copies are combined when their ISBN and edition details agree. Distinct years, bindings, languages, and listings without an ISBN stay separate. Available year/binding details appear with suggestions.
- The Windows app checks newer stable GitHub releases on startup and daily. Press Alt → Help → Check for updates… for a manual check. Download an update, then choose Restart and update when ready.
- Installers are checked against their SHA-256 checksum before they can run. Library records, reading history, preferences and the separately saved Google Books key are preserved. No books or Google key are sent to GitHub.

Install this version once using the Windows 11 x64 `.exe` installer to enable the updater. Older versions cannot update themselves. The installer includes the rebuilt `Quiet Shelf.exe`; no Node.js or browser server is needed. Browser and Windows libraries remain separate, with no syncing in this release.

`SHA256SUMS.txt` contains the installer checksum. The installer is unsigned, so Windows may show an unknown-publisher or reputation warning. Automated checks cover catalog imports/deduplication and update validation; the Windows workflow also checks native startup and installed update/restart behavior with preserved app data.
