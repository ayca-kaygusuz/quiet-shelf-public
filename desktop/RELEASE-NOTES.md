Quiet Shelf 0.13.1 adds an always-visible sync status beside Account in the Windows and browser versions.

- See Synced with the age of the last successful check, Syncing, Changes waiting, Offline, Sync paused, Sync failed, or Local only without leaving the library.
- Click the indicator for an explanation, the exact last successful sync time, Sync now and Account access. Opening the details does not start a sync.
- Setup choices, sign-in expiry, conflicting changes and local save problems appear as their own states. Offline edits and edits made during an upload are never reported as Synced.
- The header stays visible while scrolling. Dark Ink and Paper Grove share the indicator; Windows installer-update progress remains separate.

Update Windows through Account → App updates. The release also includes quiet-shelf-pc.zip and quiet-shelf-update.zip for the browser version. Extract the browser package over the existing installation, preserve its private runtime folder, restart pc/start-windows.bat, and keep the same browser/profile/address. SHA256SUMS.txt covers all three downloads.

Automated checks cover state transitions, successful-check timestamps, manual retry, pending edits, offline/metered behavior and unchanged library/account data. Windows CI checks the actual packaged app and extracted browser package in both themes, plus installed upgrade/restart. Real Google consent still requires interactive verification. Hosted web deployment and native Android/iOS apps remain deferred.
