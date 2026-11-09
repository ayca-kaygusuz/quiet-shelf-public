# Windows app handover

## Current state

The standalone app is implemented in `desktop/main.mjs`, using the same
`src/index.html` and `src/catalog.mjs` as the browser app. The browser version
remains available. Version 0.12.0 adds the user-requested optional Google Drive
connection in the Windows app. Web sign-in is implemented alongside Windows. Public web deployment and native
Android/iOS apps remain deferred.

The desktop app loads `quiet-shelf://app/` through an in-process protocol handler;
it does not start the browser HTTP server. A temporary random-port loopback
listener exists only while a Google sign-in is pending. Its local profile is separate, in
`%APPDATA%\Quiet Shelf`. Account groups sign-in/out, sync, backups/restore and updates. Version-2 backups
include preferences; legacy library-only arrays still import.

Version 0.10.0 passed local Windows runtime checks in an isolated profile:
startup, adding a title, recording start and finish dates, rereads, theme
persistence, JSON backup/restore, and separate browser storage. Subsequent
Google Books API-key changes passed automated regression tests
and Windows build/startup checks. Paper Grove, clearer status colors, and chart
separators are included. Version 0.10.1 remembers an optional Google Books key
in a separate local setting for each app/browser profile, outside library
records and JSON backups. Clear the field to forget it.

Version 0.11.0 adds Nadir Kitap as a selectable direct catalog source, including
language/ISBN checks and conservative seller deduplication. It also adds GitHub
updates for the installed Windows app: startup/daily stable-release checks,
verified installer downloads, and a user-confirmed restart to install. Install
0.11.0 manually once to enable updates in older installations. The native Help
menu provides a manual check (press Alt to show it). Browser copies remain
independent and do not use the Windows updater.

Keep both `Quiet Shelf.exe` and the installer rebuilt on each Windows release.
The updater waits for the existing process to exit and reopens the installed
app without replacing its app-data profile. The Windows workflow checks a silent
installation/update/restart and preserved app-data sentinel before publishing.

Version 0.11.1 fixes mixed title/author queries and joined/spaced compound words.
The reported `italyanca dil bilgisi ela` / `italyanca dilbilgisi ela` searches
are covered by regression tests using public listing metadata, with Turkish and
Any language selected. Existing wrong-volume checks remain in place.

Version 0.11.2 adds a native-only Updates header button and a themed status card
for checking, download percentage/bytes, verification, ready/restart, and errors.
The card stays visible during scrolling and can be hidden/reopened. The app
protocol exposes only an updater status snapshot and guarded check/install
actions; no file paths, Google key, or library records are exposed. Node
integration remains disabled. The Windows UI check tests the real protocol
bridge and captures the indicator in both themes through a loopback debugger
port enabled only by the CI launch arguments. Production launches open no port.

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

Output: `work/windows/Quiet-Shelf-Setup-0.14.1-x64.exe` and `SHA256SUMS.txt`.
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

## Google Drive handover (0.12.0)

The Windows app uses system-browser OAuth with state and PKCE. The app uses its Desktop client ID and associated client value during code and
refresh exchanges. Version 0.12.0 omitted the latter; Google rejected it with
invalid_request / client_secret is missing. Version 0.12.1 supplies the pair from
release configuration, so end users only click Sign in with Google. The release workflow
reads QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID from a repository variable or its
optional googleDesktopClientId dispatch input. The build generates an ignored
application configuration file included in the package. The Desktop client
value comes from Actions secret QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET.
This is distributable installed-app identification under Google’s public-client
model. User access/refresh tokens and Google Books keys remain private. Never put actual client IDs,
tokens, personal account identity or library exports in tracked source.

The cloud integration could not create the GitHub variable (HTTP 403). The
approved release can pass the public ID as a dispatch input. A maintainer with
repository Settings access can set the variable for subsequent automatic builds.
See docs/google-drive.md. Google Drive API must be enabled and the Google account
must be an allowed test user while the OAuth project is in Testing.

The account controller keeps refresh tokens behind the native app protocol and
encrypts them with safeStorage. Renderer-local queues contain library/preferences
only and are keyed by Google subject ID; guest and account workspaces are separate.
Metered checks run in Windows PowerShell without collecting SSIDs/IP addresses.
Automated checks cover simulated Google token/identity/Drive exchanges through a
real temporary callback listener, encrypted-token restore, account binding,
concurrent merges and UI behavior. They do not prove that real Google consent
has succeeded. Verify real sign-in, restart, two independent app profiles,
offline conflicts and account switching on Windows before calling that verified.

No local thread handover is required to build the installer in GitHub Actions.
Use the local thread only for the real Windows/Google sign-in checks and follow
the D:\Repositories access restriction. Keep all private configuration local.

Version 0.12.1 corrects the Google Desktop token exchange and reports safe,
actionable OAuth failure categories. Release publishing first checks the
application credential pair against Google's real token endpoint using a
nonexistent refresh token (no user session). An invalid_grant response confirms
client authentication passed. Missing/invalid client settings block release.
The developer must configure Google Audience Production before general public
use and complete any Google-requested production/branding requirements.
Developer-only client-ID controls are hidden in packaged apps, and old local
ID overrides do not override a packaged release's app identity. Both browser and
native continue to share the same interface, data format and account logic.

## First-sync and web parity (0.13.1)

Sign-in no longer changes the visible library. New/unmigrated accounts preview
Drive with readOnly requests; backend adapters enforce an empty submitted state
and skip upload/compaction until approval. The shared Account page previews both
counts, then keeps/combines this shelf or opens Drive. A recovery set is saved
before switching, with a download in Backups & restore. Account caches store
setupComplete after the choice. Legacy empty-account views recover the guest
shelf before network access. Pending edits remain device-local until approval.

Local browser ZIPs now include installed-app configuration and all shared server
modules. A local browser server uses the Desktop client with a loopback callback;
a hosted server uses Web credentials and QUIET_SHELF_SESSION_KEY. HttpOnly
AES-GCM cookies hold remembered browser sessions; no user token reaches page
scripts. Browser profiles and hosted platform visitor identities are isolated.
The Web client secret comes from runtime settings, never source or browser ZIPs.

The release supplies quiet-shelf-pc.zip and quiet-shelf-update.zip beside the
installer. Windows CI launches the extracted browser package and Edge in an
isolated profile, then checks the first-sync UI in both browser and native app,
with both themes. Google client preflight can validate Desktop and Web pairs;
public hosting and real user consent/Drive round trips still require their
respective deployment/interactive checks.

## Visible sync status (0.13.1)

The shared header is sticky and shows a separate sync indicator beside Account.
It reports local-only, setup, syncing, queued edits, offline/metered/manual pauses,
failures, reconnection and conflicts. Synced includes when Drive last matched;
the relative time refreshes locally without polling Drive. Its disclosure offers
the exact last successful sync, manual sync and Account navigation. Opening it
does not start a network request or change data. Escape restores trigger focus.
The details sidebar stays below the measured header height. Both packaged native
and browser CI checks exercise the indicator/disclosure in both themes.

## Quiet update policy and aligned controls (0.14.0)

Shared App updates controls show available/ready status, the last successful
check and offline/metered/user-disabled reasons. `autoUpdateChecks` is a boolean
workspace preference in local settings, version-2 backups and the sync model.
A private native `updates/check.json` mirror stores only update policy, timestamp
and validated public release metadata. Automatic checks are silent and daily;
a minute timer refreshes network conditions, with failed-check backoff. Manual
checks bypass the automatic toggle and metered pause, but never start downloads.
Download is explicit; restart/install still requires confirmation. Changes to
policy abort an in-flight automatic metadata check. Browser checks use the same
trusted release parser and offer the current browser ZIP through the public
release page. Keep browser and native copies updated when syncing the new
preference; older clients reject unknown sync fields without changing the shelf.

Windows CI checks both themes, saved/restored update choices and inline pause
messages in the packaged app and extracted browser ZIP. Header controls now have
matching heights; the shared interface check measures them at runtime.

## Additional palettes (0.14.1)

The shared interface adds Midnight Tide, Rosewood, Porcelain and Apricot Hour,
with Dark/Light groups in the selector. IDs tide/rosewood/porcelain/apricot are
accepted by the sync validator, local preferences and backups. All six themes
have tested 4.5:1 contrast for text, muted labels, status labels and primary
actions on their relevant surfaces. Packaged Windows and browser checks switch
each new palette, verify real three-status chart counts and preference retention,
then capture library/account views. New theme choices require a current client;
older clients reject unknown preference values without replacing their shelf.
