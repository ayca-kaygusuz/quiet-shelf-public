Quiet Shelf 0.13.0 keeps your shelf visible when you sign in and brings browser sync onto the same feature track as Windows.

- Google sign-in checks Drive before changing anything. An empty Drive account offers Start syncing this library; an existing Drive library shows both counts with Combine libraries and Use Drive library.
- Checking Drive uploads no local titles and does not compact cloud copies. Failed checks leave the current shelf open. Edits made while deciding are kept, and sample titles are excluded from uploads.
- A recovery set is saved before combining or switching. Download it under Account → Backups & restore. Older empty account views bring the preserved local shelf back into view before connecting.
- Web and Windows share the first-sync choices, library model, preferences and recovery behavior. The local browser ZIP now includes configured Google sign-in; users only approve Google access. Hosted Web OAuth is implemented with server-side configuration; public deployment remains separate.
- Remembered browser connections use encrypted HttpOnly cookies. Web client secrets and session keys stay on the server. User tokens and Google Books keys are excluded from release packages and backups.

Update Windows through Account → App updates. To update the local browser version, extract quiet-shelf-pc.zip over its existing folder and restart pc/start-windows.bat. Keep the same browser/profile/address and private runtime folder. SHA256SUMS.txt covers the installer and both browser ZIPs.

Automated checks cover both OAuth adapters, browser profile/visitor isolation, read-only Drive previews, account choices, recovery, offline/metered behavior, and existing library features. Windows CI checks the rebuilt native app and extracted browser package in both themes, plus installed upgrade/restart. Real Google consent and public hosted deployment still require their own interactive/deployment checks. Android/iOS native apps remain future work.

The Google project must be in Production, with any Google-required setup completed, for access beyond approved testers. The Windows installer remains unsigned and may trigger an unknown-publisher or reputation warning.
