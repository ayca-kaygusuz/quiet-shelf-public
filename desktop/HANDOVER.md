# Windows app handover

## Current state

The standalone app is implemented in `desktop/main.mjs`, using the same
`src/index.html` and `src/catalog.mjs` as the browser app. The browser version
remains available. This phase has **no syncing, pairing, accounts or shared
storage**. Do not add those features yet.

The desktop app loads `quiet-shelf://app/` through an in-process protocol handler;
it does not start the browser HTTP server. Its local profile is separate, in
`%APPDATA%\Quiet Shelf`. Back up / Restore use the existing JSON format.

The active tests pass in the cloud. A Windows x64 installer was cross-built and
its archive integrity, identity, checksum and packaged source were verified.
**It has not yet been verified by launching on a Windows PC.** The queued Paper
Grove rename, clearer status colors, and chart separators are included.

## Remaining work on Windows

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

Output: `work/windows/Quiet-Shelf-Setup-0.10.0-x64.exe` and `SHA256SUMS.txt`.
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

Both repositories have **unpublished draft releases** for `v0.10.0`. No installer
has been uploaded to them. The cloud GitHub connection can push code and manage
release metadata, but asset uploads to `uploads.github.com` failed authentication.
Direct build-tool downloads also timed out in cloud/runner attempts. Do not
claim that the installer is downloadable until an asset has actually been
attached and the release published.

A locally configured GitHub connection may be able to upload the installer and
checksum after Windows verification. Use its existing authorized authentication;
never paste or commit tokens. Alternatively, provide the locally built installer
to the user directly from their authorized workspace.

If publishing a release, set its target to the verified source commit, attach the
installer and checksum, then publish it. Keep the private release current too;
it can link to the public installer if duplicating assets is unnecessary.
Once a public installer exists, update the browser's Windows-app link to the
public latest-release page and update README's pending-verification notice.
Cloud Sites publication can be handled separately; its private manifest is not
in the public repository and must not be recreated or committed here.

## Build notifications

**Do not trigger GitHub Actions without asking the user first.** Repeated failed
verification runs caused unwanted notifications. The Windows workflow is now
manual-only (`workflow_dispatch`); do not restore push triggers. It is configured
to run only in the public repository and clean temporary build artifacts after
publishing. No private paid runners are needed. Prefer the local Windows build
for this handover.
