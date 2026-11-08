Quiet Shelf now has an installable Windows application alongside the browser version.

- Includes its own runtime: no Node.js or terminal window is needed.
- Same interface, reading history, series, wishlist and catalog search features.
- Independent local library and preferences. No syncing, pairing or account connection.
- Existing JSON Back up and Restore allow optional manual transfers.
- Installs for the current user, with Start menu and desktop shortcuts. Local reading data survives upgrades and uninstall.
- Paper Grove has clearer status colors and chart boundaries.
- Google Books accepts an optional personal API key, retries an existing search when the key changes, and distinguishes project quota from shared quota.

Download the x64 `.exe` installer for Windows 11 (Intel/AMD). `SHA256SUMS.txt` contains its checksum.

This build is unsigned, so Windows may show an unknown-publisher or reputation warning. The release workflow runs the automated checks, builds on Windows, and checks that the native window starts. Version 0.10.0 also passed local Windows runtime checks in an isolated profile: startup, adding a title, start/finish dates, rereads, theme persistence, JSON backup/restore, and independent browser storage. The Google Books fix has additional automated form and HTTP regression checks.
