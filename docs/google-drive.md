# Google Drive connection

Version 0.12.1 connects the Windows app directly to Google Drive. Browser OAuth
and phone apps are deferred. Existing browser libraries and JSON import/export
continue to work without an account. No web hosting is required for native sync.

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
   Users outside the test list cannot use an app left in Testing. Web client
   credentials and Android client setup are deferred.

Google Testing projects can expire refresh tokens after seven days when Drive
access is requested. This is a Google test-mode limit, not a sync defect. Moving
to production requires Google's current configuration/policy steps; do not
promise that setting Production removes every verification or branding issue.

References: [Desktop OAuth](https://developers.google.com/identity/protocols/oauth2/native-app),
[app-data folder](https://developers.google.com/workspace/drive/api/guides/appdata),
[production readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).

## Release configuration without tracked credentials

The public Windows workflow reads its Desktop client ID from Actions variable
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
client secrets belong only on their server when browser OAuth is implemented.

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

The browser server does not read private Web OAuth JSON in this release. The
previously discussed `private/google-oauth.json` setup is deferred along with
hosted browser authorization. Retain any downloaded credential file privately;
it must not be tracked or attached to releases.

## First use

Open **Account → Sign in with Google**, finish Google's consent in the system
browser, then return to Quiet Shelf. The temporary loopback callback listener
closes when the response is claimed, cancelled or timed out. The app does not
run an always-on HTTP server.

An account starts in its own workspace and loads its Drive copy. Your previous
signed-out library remains separate. After the first successful sync, use
**Copy local library to this account** to add it explicitly. Sample titles are
excluded. An empty Drive account does not automatically receive guest data.

Automatic sync defaults on. Windows metered/roaming/data-limit detection pauses
it, with a device-local override. **Sync now** works even on a metered connection.
Offline work is queued locally. Closing the app stops sync; reopening it online
resumes. Signing out forgets this installation's token and returns to the local
library, while retaining any account-specific pending queue for later sign-in.

## Data and security boundaries

Drive stores library records, start/finish history and whitelisted view settings.
Google Books keys, OAuth tokens and connection configuration are excluded.
Only the app's own hidden Drive folder is requested. This is not end-to-end
encryption: Google stores the app-data files, and the app's OS profile stores
local library copies. Windows refresh tokens use Electron safeStorage/DPAPI.
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
