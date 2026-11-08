# Windows app handover

## Current state

The standalone app is implemented in `desktop/main.mjs`, using the same
`src/index.html` and `src/catalog.mjs` as the browser app. The browser version
remains available. This phase has **no syncing, pairing, accounts or shared
storage**. Do not add those features yet.

The desktop app loads `quiet-shelf://app/` through an in-process protocol handler;
it does not start the browser HTTP server. Its local profile is separate, in
`%APPDATA%\Quiet Shelf`. Back up / Restore use the existing JSON format.

Version 0.10.0 passed local Windows runtime checks in an isolated profile:
startup, adding a title, recording start and finish dates, rereads, theme
persistence, JSON backup/restore, and separate browser storage. Subsequent
Google Books API-key changes passed automated regression tests
and Windows build/startup checks. Paper Grove, clearer status colors, and chart
separators are included. Version 0.10.1 remembers an optional Google Books key
in a separate local setting for each app/browser profile, outside library
records and JSON backups. Clear the field to forget it.

## Local development and future Windows verification

Follow the user's filesystem restrictions. Use an existing fresh checkout of
the sanitized repository, or clone into their authorized repository folder.
Do not merge the pre-privacy-cleanup history. Use the neutral contributor
identity and keep both configured GitHub remotes synchronized, per `AGENTS.md`.
Keep npm caches and development downloads inside the authorized workspace when
required. Do not inspect unrelated personal files or browser profiles.

With Node.js 24 LTS available:

```powershell
npm ci
npm test
npm run build:windows
```

Output: `work/windows/Quiet-Shelf-Setup-0.10.1-x64.exe` and `SHA256SUMS.txt`.
The unpacked app is `work/windows/win-unpacked/Quiet Shelf.exe`.

Have the app launched on Windows and verify startup, adding a title, recording
start/finish dates and a reread, theme persistence across restart, and JSON
backup/restore. Verify the browser library remains independent. App startup
writes its own app-data profile; follow the user's permissions for local tests.
The unsigned installer may trigger an unknown-publisher/reputation warning.

The installer uses NSIS directly after electron-builder packages the app. The
build script handles Windows' native `makensis.exe` invocation, without shell
quoting. It prevents installation into unrelated non-empty directories, and
uninstall deletes only its own packaged files while preserving app data.

## Delivery and release status

Public Windows downloads live at
[the latest release](https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/latest).
The public release contains the x64 installer and `SHA256SUMS.txt`; the private
mirror's matching release can link to those same assets.

To publish an approved release, run the Windows workflow manually from main
with Publish enabled. It builds the installer, runs automated tests and native
startup checks, attaches the installer and checksum, then publishes. Keep the
release target and tag aligned with the tested source commit. Verify the actual
asset downloads and checksum before reporting delivery complete. Build artifacts
expire after one day; release assets provide the lasting download.

Bump the version before publishing changes to an already published installer.
Keep both source repositories and their release notes current. Do not commit
installers, credentials, personal profiles or library backups.
Cloud Sites publication can be handled separately; its private manifest is not
in the public repository and must not be recreated or committed here.

## Build notifications

The Windows workflow builds automatically for Windows-related changes on public
main. Manual runs require user approval. To publish, manually run the workflow
from main with Publish enabled. Automatic builds leave a temporary artifact for
one day. The private mirror skips build jobs. The local Windows build remains
available for troubleshooting and runtime verification.
