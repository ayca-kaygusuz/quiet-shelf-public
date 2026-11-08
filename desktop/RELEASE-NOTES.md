Quiet Shelf 0.10.1 remembers your optional Google Books API key on this device.

- The key survives closing Add title and restarting the app.
- It stays in a separate local setting, outside application source, library records and JSON backups.
- The Windows app and each browser profile remember their own key independently. Clear the API-key field to forget it.
- A changed key retries the current search. Searches for other sources never receive the Google key.
- If local storage cannot be updated, the form reports it and you can still search with the current field value.

Download the Windows 11 x64 `.exe` installer and install it over the existing version. Your local library and reading history are preserved. `SHA256SUMS.txt` contains the installer checksum. This build is unsigned, so Windows may show an unknown-publisher or reputation warning.

The app and browser remain independent; syncing is not part of this release. Automated regression tests cover key persistence and clearing, separate app/browser storage, unavailable storage, Google-only requests, and backup exclusion. The release workflow builds on Windows and checks native startup. The original 0.10.0 app also passed local Windows interaction checks for adding titles, reading dates/rereads, theme persistence and JSON backup/restore.
