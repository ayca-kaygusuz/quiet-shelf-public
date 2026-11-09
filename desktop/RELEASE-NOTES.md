Quiet Shelf 0.14.0 makes update checks quiet and controllable, and aligns the header buttons.

- Account → App updates shows available/ready versions, last successful check time and failures beside the check button. Automatic discovery never opens a prompt or starts a download.
- Automatic checks pause while offline, on metered connections or when switched off. The card explains why. Check for updates works manually while automatic checks are off or the connection is metered.
- The automatic-check choice is saved with library preferences, included in JSON backups and optional Drive sync. Older backups default to on. Keep synced browser and native copies current for the new preference.
- Browser copies share the checks and settings, with a link to the newer browser package. Windows downloads only when requested and still asks before restarting to install.
- The sync indicator, Account and Add title controls now have matching heights and adjusted spacing. Both themes and narrow layouts are checked.

Update Windows through Account → App updates. The release includes quiet-shelf-pc.zip, quiet-shelf-update.zip and SHA256SUMS.txt. For the local browser app, preserve the private runtime folder and use the same browser/profile/address after replacing files and restarting pc/start-windows.bat. Hosted web deployment and native Android/iOS apps remain deferred.

Tests cover quiet metadata checks, metered/offline/disabled policies, manual checks, persisted/restored/synced preferences, trusted release assets, verified installer downloads, explicit restart consent and unchanged user data. Windows CI checks both packaged interfaces in both themes and installed upgrade/restart.
