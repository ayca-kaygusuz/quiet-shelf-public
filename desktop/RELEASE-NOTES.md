Quiet Shelf 0.12.1 fixes Google sign-in after the browser returns to the Windows app.

- The release now supplies Quiet Shelf's Desktop application credential alongside PKCE for both sign-in and token refresh. Users only click Sign in with Google and approve access; no credential files or developer setup are required on their devices.
- OAuth configuration errors are distinguished from expired sign-ins, with safe messages that exclude credentials and token responses. Developer-only client controls are hidden in the installed app.
- Before publishing, the release checks the application's credential pair against Google's real token endpoint using a nonexistent refresh token. A release with missing or rejected configuration cannot publish.
- Library data, backups, view preferences, offline queues and the existing Google Books key are preserved. The browser and Windows apps continue to share interface and data-model development; hosted browser sign-in remains deferred.

The app's distributable Desktop OAuth configuration is generated from release settings and kept out of tracked source. User access/refresh tokens stay encrypted on the device; Google Books keys remain device-local. No hosted server is required for native Drive sync.

Update through Account → App updates or Alt → Help → Check for updates…. The installer includes the rebuilt Quiet Shelf.exe and SHA256SUMS.txt. It is unsigned, so Windows may display an unknown-publisher or reputation warning.

The developer must move the Google OAuth audience out of Testing before general public use and complete any Google-required production/branding setup. Real user consent and a Drive round trip still require an interactive sign-in check after updating; the release configuration probe does not grant user access.
