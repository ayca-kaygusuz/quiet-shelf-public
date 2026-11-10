# Google Drive connection

Version 0.19.0 connects Windows, Linux, Android, iPhone/iPad and the local browser app to Google Drive.
The hosted web OAuth adapter is implemented too; public hosting deployment remains deferred. Libraries and JSON import/export work
without an account. No web hosting is required for native sync.

## Google Cloud setup

1. Select the app's Google Cloud project and enable **Google Drive API**.
2. In **Google Auth Platform**, configure the app identity and an **External**
   audience. While it is in **Testing**, add the intended Google account under
   test users.
3. Declare basic identity (`openid`, `email`, `profile`) and the non-sensitive
   `https://www.googleapis.com/auth/drive.appdata` scope. Broader Drive scopes
   are not needed.
4. Create a **Desktop app** OAuth client. Keep future platform clients in this
   same Cloud project so they can use the same application's app-data space.
5. Supply the Desktop client ID and its associated `client_secret` at build
   time. Google requires this app credential for the Desktop client alongside
   PKCE. End users receive a configured app and only approve Google consent;
   they never create clients, copy keys or import credential JSON.
6. Before general public use, change **Audience** from **Testing** to
   **Production**, and complete any production/branding steps Google requests.
   Users outside the test list cannot use an app left in Testing. Hosted Web
   client setup is described below; iOS setup is described in ios/INSTALL.md; Android setup is described in android/README.md.

Google Testing projects can expire refresh tokens after seven days when Drive
access is requested. This is a Google test-mode limit, not a sync defect. Moving
to production requires Google's current configuration/policy steps; do not
promise that setting Production removes every verification or branding issue.

References: [Desktop OAuth](https://developers.google.com/identity/protocols/oauth2/native-app),
[app-data folder](https://developers.google.com/workspace/drive/api/guides/appdata),
[production readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).

## Release configuration without tracked credentials

The public Windows and Linux workflows read their shared Desktop client ID from Actions variable
`QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID` or the approved dispatch's
`googleDesktopClientId` input. The matching Desktop client value is stored as
Actions repository secret `QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET`. Set that
value once in GitHub's secure settings, using `installed.client_secret` from the
Desktop OAuth JSON. Never submit it in chat or use a Web client's secret here.

The release creates ignored `desktop/google-client.generated.json` and packages
it with the native app. Google treats installed apps as public clients whose
application credentials are distributable. The app relies on PKCE, Google
consent and scoped user tokens. User access/refresh tokens and Google Books
keys stay private and are never bundled or included in library backups. Web
client secrets belong only on their hosted server.

Before publication, `scripts/check-google-release.mjs` submits a nonexistent
refresh token to Google's real token endpoint with the app's configured pair.
The expected `invalid_grant` response confirms that client authentication
passed without using a real user's account or token. Incomplete or rejected app
credentials block publishing. Unit fixtures also enforce the Desktop parameter
on both authorization-code and refresh exchanges; they no longer assume it can
be omitted.

For development, set both environment variables before `npm run desktop`.
Developer-only client-ID overrides remain available in an unpackaged build.
Packaged apps use their release identity and hide those controls. Changing a
local developer ID does not borrow credentials from a different release client.

## First connection and recovery

Signing in keeps the current device shelf visible. The first check is read-only
on both backend adapters, even if a caller supplies a local snapshot. It uploads
no titles and does not compact/delete cloud checkpoints. Failed checks keep the
current shelf open. Metered detection pauses automatic checks; Check Drive works
manually. The user reviews counts across all three collections and chooses:

- **Start syncing this library**, when Drive contains no titles.
- **Combine libraries**, keeping local and Drive titles and all reading dates.
- **Use Drive library**, opening the saved Drive snapshot.

Samples are excluded from uploads. Shared record IDs merge histories; concurrent
same-field choices remain available for review. The current theme and view
preferences are retained when combining, while Use Drive loads Drive preferences.
Local edits made while deciding are included. If Drive changed since the preview,
the counts refresh and the user reviews the choice again before anything switches.

Before changing the workspace, the app must save a local recovery set. Find it
under Account → Backups & restore. Its downloadable snapshots use the existing
version-2 JSON backup format. The latest three sets stay on the device; user
credentials are excluded. A failed recovery write blocks the switch. Older empty
account views reopen the preserved local shelf before any network access.
An account's setupComplete marker records the approved choice, so it reopens
quietly later. Guest libraries and account queues remain separate.

## Local browser package

The release includes quiet-shelf-pc.zip and quiet-shelf-update.zip with the same
source as the Windows app, plus installed-app configuration for loopback use.
The local browser server uses the Desktop client with a callback at
`http://127.0.0.1:8765/api/account/callback`. Users only sign in and approve access.
Each browser profile has its own encrypted HttpOnly remembered-session cookie.
Its AES key is generated in ignored `private/browser-session.key`. Keep that
private folder when updating the same local browser installation.

The browser server is only required while using that local browser app. It is
not a shared sync host and does not need to stay on for other devices to use
Drive. Update the same folder and keep the same origin/browser profile to retain
library and sign-in storage. Library records remain local when signed out.

## Hosted web adapter

The generated Worker and the Node server share `src/web-account.mjs`. Configure
the hosted server once with these runtime values:

- `QUIET_SHELF_GOOGLE_WEB_CLIENT_ID`
- `QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET` (raw value or downloaded Web OAuth JSON)
- `QUIET_SHELF_SESSION_KEY` (base64-encoded 32 cryptographically random bytes)
- `QUIET_SHELF_PUBLIC_ORIGIN` (the exact HTTPS origin, recommended)

Register `<origin>/api/account/callback` on the Web OAuth client. Web credentials
are confidential server configuration and never bundled into frontend code,
local browser ZIPs, or installers. The existing GitHub Web secret can validate
that client pair in CI; actual hosting needs the same server-runtime values
configured on the chosen host. No public deployment is implied by storing a CI
secret. Preserve the host's existing access boundary; optional platform visitor
IDs bind the encrypted cookie to that visitor as well as the origin.

OAuth uses state and PKCE. Remembered refresh tokens stay inside AES-GCM encrypted
HttpOnly/SameSite cookies; production cookies are Secure. Browser scripts see
public account identity and library data only. POSTs require the exact Origin
and the app's custom header. Separate browser profiles, accounts and hosted
visitors cannot reuse each other's encrypted session. Sign-out clears the
browser connection and leaves Drive data intact.

## Data and security boundaries

Drive stores library records, start/finish history and whitelisted view settings.
Google Books keys, OAuth tokens and connection configuration are excluded.
Only the app's own hidden Drive folder is requested. This is not end-to-end
encryption: Google stores the app-data files, and the app's OS profile stores
local library copies. Windows refresh tokens use Electron safeStorage/DPAPI; browser refresh tokens use
server-encrypted HttpOnly cookies.
The renderer receives only public identity and library/sync responses.

Concurrent devices create immutable snapshots, merge causal field changes and
separate history events, and clean up only observed copies covered by a newly
saved snapshot. Deletion markers and unresolved field choices survive offline
devices returning. The Account page exposes conflicting values for review.
Automatic sync uploads library changes, not unfinished form drafts.

## Verification

`npm test` covers the merge model, failed uploads, stale devices, conflict
resolution, account/guest separation, preferences and backups, a real local
HTTP callback with simulated Google endpoints, encrypted token restore and the
guarded native API. Windows CI checks the actual packaged app's account/status
and script routes, both themes, updater UI, startup and data-preserving upgrade.

Real Google consent cannot be completed by a simulated endpoint. On Windows,
verify actual sign-in and restart, then two isolated installations/profiles
using the same Google account. Exercise offline edits, repeated readings,
deletions, a same-field conflict, metered/manual sync and a second Google
account. Do not call the real-account path verified until those checks pass.

Installers and source mirrors must be rebuilt/synchronized for every release.
Keep private files, local caches and downloaded credentials outside Git.

## Android native authorization

Android uses Google Play services AuthorizationClient with the registered
`com.quietshelf.android` package and release certificate. Register the Android
OAuth client in this same Cloud project. Android client secrets are not needed
and are never read. Native token renewal verifies Google's userinfo subject
against the expected account. Tokens remain native/in memory; only a non-secret
marker and public account ID cross the Android WebMessage interface.
The shared Drive model, read-only preview, explicit first connection and recovery
behavior remain the same. See [Android setup](../android/README.md).

## Native Linux

Google's Desktop app client covers Linux as well as Windows and macOS. Linux
uses the same release client configuration and PKCE/loopback flow; no Android
certificate registration, new OAuth client or user credential setup is needed.
GNOME Secret Service and KDE KWallet are accepted secure storage backends.
Missing, unknown or basic_text backends keep tokens in memory for the session
and do not write refresh-token files. No Web client secret is bundled.
NetworkManager supplies metered state when available; user controls and manual
sync work when the connection cost cannot be detected.

## iPhone and iPad Google connection

Create an **iOS** OAuth client in the same Google Cloud project using bundle ID
`com.quietshelf.ios`. Supply its public ID using the iOS workflow input or
`QUIET_SHELF_GOOGLE_IOS_CLIENT_ID` repository variable. Google supplies a plist
configuration download for iOS; there is no client secret to inject. For
compatibility with the existing Actions setup, builds can also extract only
`CLIENT_ID` from the plist stored under the earlier, misnamed
`QUIET_SHELF_GOOGLE_IOS_CLIENT_SECRET` entry. The plist, any optional API key and
all other fields are discarded; no real OAuth secret is used. Do not use
a Web/Desktop secret or an Apple signing credential. The build derives the
reversed-client-ID URL scheme and retains the native SDK licenses offline.

Authorization opens the native Google system-browser flow; access/refresh
credentials stay in the Google SDK/Keychain. The WebView receives public identity
only. Native Drive requests require the active account ID and app-data endpoint;
Books API keys cannot become Drive credentials. First connection uses the same
read-only preview and explicit library choice as Windows/browser/Android/Linux.

Free AltStore signing can rewrite the bundle identifier, so test Google consent
on the actual signed installation and report configuration errors without
switching to an empty workspace. Do not enable App Check/App Attest enforcement
for an unsigned/sideload distribution without first checking its compatibility.
See [installation and device checks](../ios/INSTALL.md).
