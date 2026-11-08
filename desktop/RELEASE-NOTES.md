Quiet Shelf 0.12.0 adds optional Google Drive sync to the standalone Windows app.

- Account groups Google sign-in/out, sync settings, manual sync, backups/restore and app updates. Signing in is optional.
- Each Google account uses its own hidden Drive app-data folder and separate device workspace. The app connects directly to Google; no hosted website or always-on PC is needed to retain the cloud copy.
- Automatic sync defaults on and pauses on detected metered/roaming/data-limited connections. Sync now remains available. Offline changes stay queued on the device.
- Titles, series, reading start/finish dates and view preferences sync together. Concurrent field changes can be reviewed, and deletion markers prevent stale offline copies silently restoring deleted titles.
- Your original signed-out library stays separate. After the first sync, choose Copy local library to this account to add it explicitly; sample titles are excluded.
- JSON backups now include theme and view preferences. Older library-only backups still import. Google Books keys and sign-in credentials are excluded from backups and synced records.
- Google sign-in opens the system browser, uses state/PKCE and stores remembered refresh tokens through Windows-encrypted storage. No Web client secret is required for this Desktop flow.

Use Account → App updates, or Alt → Help → Check for updates…, to update. Existing library records, reading history, preferences and the saved Google Books key are preserved. The installer includes the rebuilt Quiet Shelf.exe; SHA256SUMS.txt contains its checksum.

The browser version remains available with local storage and manual backup/restore. Hosted browser sign-in and phone apps are deferred. Google Drive API must be enabled, and accounts must be permitted test users while the Google OAuth project is in Testing. Testing-mode Google authorization can expire after seven days.

Automated checks cover simulated Google/Drive exchanges, a real temporary callback listener, encrypted token restore, account separation, offline/concurrent changes and preference backups. Windows CI checks the actual packaged interface, account/update API routes, both themes, startup and a data-preserving installed update/restart. Real Google consent and cross-device account sync still require a sign-in check on the user's PC; they are not proven by the simulated tests.

The installer is unsigned, so Windows may display an unknown-publisher or reputation warning. Keep a manual JSON backup before first-time account migration.
