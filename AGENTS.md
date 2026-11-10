# Repository instructions

## Publishing source updates

For maintained project updates, push every source update to both `github`
(the private repository) and `public` (the public repository). Ensure both
remotes are configured before publishing. Push the same commit to each. Verify both branch heads before
reporting an update complete. If either push is blocked, report which copy is
pending and finish synchronizing it when access becomes available.

Use the checkout's neutral contributor identity for commits. Do not merge or
push commits from the history that existed before the privacy cleanup.

Both repositories contain public-safe application source. Keep deployment
identity, credentials, personal library exports and machine-specific setup
outside tracked files. Respect `.gitignore`; generated distribution files are
built locally instead of committed.

## Archived connector

Keep `archive/browser-connector/` and its tests preserved but inactive. Do not
reactivate, package or run the archived connector or its disabled tests unless
explicitly requested. Run the active checks with `npm test`.

## Interface

Preserve the approved rounded, flat design across Dark Ink, Paper Grove, Midnight
Tide, Rosewood, Porcelain and Apricot Hour.
Use solid color tokens, without gradients, bevels or shadows. Themes share the
same functions and charts. Keep appearance/chart-scope preferences separate
from book records; they are included in versioned backups and optional native Drive sync.
Never replace actual library counts or chart values with illustrative data.

## Windows app

Keep the browser version and standalone desktop version available, sharing
`src/` for interface and catalog behavior. The desktop app has a separate local
profile, with optional Google Drive sync now explicitly requested. Browser Google sign-in and first-sync choices share the Windows behavior. Public
web hosting deployment and the native iOS app remain deferred. Android is implemented
in `android/` using the same shared source and data format. Keep guest and Google-account workspaces
separate, credentials out of the renderer, and Google Books keys device-local.
Keep browser and Windows development aligned: implement common features,
preferences, backup migrations and sync data formats in shared code, and check
both platform adapters. Deferring public web hosting does not freeze web functionality or authorize
a separate feature fork. Future web and
phone clients must be able to use the current shared data format.
Keep Node integration disabled in the renderer and use the narrow app protocol
for catalog calls. Do not expose filesystem access to page scripts.
Build an installer and attach it to matching releases when shipping desktop
updates; keep generated binaries outside Git. Preserve local user data during
upgrades and uninstall. Report Windows-runtime testing limits accurately.
Every Windows release must rebuild the standalone `Quiet Shelf.exe` and its
versioned installer from the same current source. Keep the installed executable
current with new features; the browser launcher remains `pc/start-windows.bat`.
GitHub updates use stable public releases, verify the installer checksum before
execution, and ask before restarting. Preserve the in-app progress/status
indicator alongside taskbar progress, with all themes supported. Never include library records or saved
user access/refresh tokens or Google Books keys in update checks, installers or
release assets. The app’s distributable Desktop OAuth configuration is generated
from release settings and packaged with the native app; never track its values.

Windows Actions builds run automatically for Windows-related changes on public
main. Request explicit approval before manually dispatching a run or changing
the automatic triggers. Publishing requires an explicit manual run with Publish
enabled. The private mirror does not run build jobs.
For local Windows completion, read `desktop/HANDOVER.md`.

For Google Drive releases, supply the public Desktop OAuth client ID through
QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID (repository variable) or the approved
workflow’s googleDesktopClientId input, plus the Actions secret
QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET for the same Desktop client. Public
releases must pass scripts/check-google-release.mjs before packaging. End users
only sign in; never require them to import client credentials. Never hard-code an actual client ID,
client secret, user identity or refresh token in source. See docs/google-drive.md.

First sign-in keeps the visible device library until the user chooses how to
connect. Preview Drive read-only, then offer keeping/combining the current shelf
or using Drive. Save a downloadable local recovery set before switching. Never
upload a guest/other-account library before this explicit choice. Check web and
native first-sync UI together. The browser ZIP uses the distributable Desktop
client only on loopback; hosted web uses its server-side Web client configuration.
Never bundle a Web client secret or browser session-encryption key into a ZIP,
frontend, installer or Worker source. Runtime values stay on the hosted server.

## Android app

Keep Android and Windows/browser features aligned through `src/`. Android uses
a restricted, origin-bound WebMessage bridge and local signed assets, without
a local HTTP server. Native HTTP is limited to the catalog/Drive/release hosts.
Google authorization uses Google Play services with the registered Android
package/signing certificate; access tokens remain native and in memory. Never
package Desktop/Web OAuth secrets or an APK signing key. The app requests
Internet/network state only; JSON backup/restore uses the system document picker.
Preserve guest/account separation and read-only first-sync behavior on Android.

Use `npm run build:android`; production builds require the private keystore
Actions secrets. Never rotate the release key to fix a build failure: updates
must preserve the original signing identity. Keep keys outside Git and public
artifacts. Provide one private plaintext file per secret when asking for setup,
containing only the value to paste; do not combine secret values in a JSON file.

Android CI runs only in the public mirror and tests a real emulator before APK
publication. A previously tested artifact may be promoted only from a successful
run of this exact workflow and source commit. Keep published APKs immutable;
merge their checksums into the matching Windows/browser release manifest.
Report real-device Google consent and file-picker checks separately from
mocked adapter tests and emulator checks.

## Read next

Keep generation and metadata refresh strictly on demand. Sync transfers the
latest atomic checklist and cached metadata; it never generates or advances a
list. Keep completed entries visible, derive checks from actual reading status,
and confirm replacement of an unfinished list. Do not add list history.
Use weighted randomness and ensure different membership when alternatives
exist. Suggest at most the next unread volume per series; never skip an
unfinished or missing earlier volume. Registration age is not ownership age.
Keep read-next.js in every platform's asset allowlist and package. Validate
structured metadata and checklist preferences before backups/Drive apply them.

## Licensing

Quiet Shelf's original project material is Apache-2.0, with Alex (Ayca Kaygusuz) as its public
creator credit. Preserve LICENSE, NOTICE, THIRD_PARTY_NOTICES.md, source SPDX
headers and upstream notices. Do not replace third-party licenses with the
project license. Keep the original Manrope OFL notice and runtime notices.
Ship the project license/attribution and applicable third-party notices in
every browser, Windows and Android distribution and in offline About. Never
add extra attribution restrictions to the standard Apache license.
Git commits still use the neutral contributor identity; publish no personal
email, legal identity, credential or user library as part of attribution.

The Android desugar_jdk_libs runtime is GPLv2 with Classpath Exception, not
Apache-2.0. Preserve its upstream license/exception texts and publish its
verified, pinned upstream source archive alongside each Android APK. Never
apply project copyright/SPDX headers to those upstream files.

Alphabetical library sorting must order series by their names and their
members by title. Display filters and Plain list are view preferences, never
book/series data edits; retain grouped expansion/filter choices when switching.
Use catalog study metadata before recommendation ranking. A title or language
alone is never proof of a textbook. Generation may look up missing information
only on explicit demand; retain cached offline generation and label unknown types.

Manual read-next exclusions apply to individual books or canonical series,
including later volumes. Optional inclusive end dates expire locally without
mutating a checklist or generating a replacement. Preserve indefinite legacy
book exclusions, keep every rule reversible, validate new backup/sync fields and
keep guest/account rules separate. A skipped volume never authorizes suggesting
its later volumes out of order.

## Linux app

Linux shares desktop/ and src/ with Windows. Ship a rebuilt x64 Debian package
and portable tar archive with every maintained native update, with the same
version/source as Windows, Android and browser. Keep the standard Electron
sandbox enabled; no production no-sandbox fallback. Preserve profiles across
package upgrades/removal and portable-folder replacement. Retain all license
and runtime notices in both package formats and offline About.
Use the existing Desktop OAuth release configuration. Accept known Linux
keyring backends only; never persist refresh tokens via basic_text or unknown
storage. Missing keyrings allow session-only sign-in with clear account status.
NetworkManager cost detection is optional and must never request network secrets.
Linux downloads are verified before explicit manual package installation;
never auto-run privileged installers, execute downloaded shell commands or
silently replace a running installation. Test native startup/UI/profile restart
and real keyring encryption on the public Linux CI runner before publication.
