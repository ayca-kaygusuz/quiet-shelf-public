Quiet Shelf 0.18.0 adds the native Linux app while keeping Windows, Android and browser releases on the same shared source and library format.

- Linux x64 downloads: an installable `.deb` for Ubuntu/Debian-based desktops and a portable `.tar.gz` for other compatible Linux desktops. Both bundle the runtime and retain the offline license/attribution notices; no separate Node.js or browser server is needed.
- Reuse the existing Desktop Google client. GNOME Secret Service/KDE KWallet remembers sign-in securely; without a usable keyring, sign-in is session-only and no plaintext refresh token is saved. Guest/account separation, first-sync choices and recovery remain shared.
- Use NetworkManager metered state when available, alongside the existing manual connection control. Sync and automatic update checks pause on metered/offline connections.
- Linux update checks honor the saved preference and manual button. Requested packages are SHA-256 verified, then Show downloaded package lets you install the `.deb` or replace the portable folder. The app does not launch privileged installation commands or force a restart.
- Rebuild Windows, Android and browser packages from the same current source. The library/backup/Drive format is unchanged from 0.17.0, including checklist/exclusion and view preferences. Existing published binaries remain immutable.

Linux's installed profile is ~/.config/Quiet Shelf (or XDG_CONFIG_HOME/Quiet Shelf). Upgrades/removing the application files preserve it; keep JSON backups. The portable build requires system Electron libraries and Chromium sandbox support; use the Debian package on Ubuntu hosts that restrict portable user namespaces.

Validation covers the shared regression suite, native Linux interface and profile restart, Linux OS-keyring encryption across process restarts, Debian/portable package contents and notices, Windows/browser runtime/install checks, and the Android emulator. Interactive Google consent and system file-picker checks still depend on the user's desktop/device.

Original project material remains Apache-2.0, credited to Alex (Ayca Kaygusuz). Third-party notices remain intact, including the pinned Android compatibility runtime source archive beside the APK.
