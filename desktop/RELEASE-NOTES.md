Quiet Shelf 0.15.0 introduces the Android app alongside Windows and the browser version.

- Android packages the shared library, reading dates/rereads, series, wishlist/archive, catalogs, insights, themes, backup format and Google Drive sync behavior.
- Native Google authorization keeps access tokens out of the web interface. The Android app uses its registered package/signing certificate and needs no client secret. First sync keeps the current shelf and offers the same explicit choices and recovery copies.
- The system document picker handles JSON backups without broad storage access. Phone details open in a dedicated panel; Android Back closes the current form, Account or details before exiting. System bars follow the theme.
- Offline and metered state comes from Android. Update checks use the saved preference and link to the signed APK when a newer version is available. Android does not need a running PC or local server.
- Windows/browser source remains aligned. Shared account status accepts native online state, and the release parser recognizes Android APKs. Existing Windows installer/update behavior is preserved.

Install Quiet-Shelf-Android-0.15.0.apk on Android 8+ with an updated System WebView. Google sign-in requires Google Play services. Install future updates over the existing app; uninstalling removes local data. The checksum manifest covers Android, Windows and browser packages. Windows updates remain under Account → App updates. Preserve the local browser private runtime folder when updating its files.

Checks include shared adapter/CSP/credential-isolation tests, Android lint, Android emulator library/history/theme/restart/native-bridge checks and screenshots, plus packaged Windows/browser and installed Windows upgrade/restart checks. Real Google consent and Android document-picker interactions require verification on a device. Public web hosting and native iOS remain deferred.
