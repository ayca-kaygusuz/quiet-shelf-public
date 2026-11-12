# Hosted browser app

The hosted app uses the same `src/` interface, catalog adapters, library format,
first-sync/recovery choices, and merge engine as the local and native versions.
The GitHub Pages project website remains separate. No ChatGPT account is needed
for this Cloudflare deployment. A Google account is optional; guest libraries
and manual JSON backup/restore remain available.

Opening/reloading the hosted page needs an internet connection. An already open
tab can retain local edits while offline and sync after reconnecting. This target
does not yet install an offline service-worker cache. Clearing browser storage
can remove local/unsynced records; keep JSON backups.

## Build and checks

Use Node.js 24 LTS. No npm install, Python, native packages, database, or paid
Cloudflare service is required to build this target:

```sh
npm test
node web/build.mjs
```

`work/hosted/index.mjs` is the generated Worker. It contains the shared app,
script assets, icon and license notices, plus the hosted HTTP adapter. It does
not read runtime secrets or generated Desktop OAuth configuration, and does not
embed installers or browser ZIPs. Download routes use existing GitHub releases.
Keep generated output outside Git.

## One-time Cloudflare setup

1. Create a free Cloudflare account. Keep Workers on its free plan. This
   deployment never enables a subscription, buys a domain, or creates paid
   databases/storage. Free request/CPU limits still apply; free hosting is not
   unlimited availability.
2. An existing `workers.dev` account subdomain is preserved. If a new account
   has none, deployment registers a free `quiet-shelf-` address with a random
   suffix automatically. No domain is purchased. In the current dashboard,
   Workers is under Compute; Copy account ID is in the top-right account menu.
3. Create an API token with **Account → Workers Scripts → Edit** restricted to
   this account. Do not use a Global API key. The token needs to read Workers
   subdomain/settings and create/update the app Worker and its secret bindings.
4. In the **public** GitHub repository's Actions settings, save that token as
   `CLOUDFLARE_API_TOKEN` and the account ID as `CLOUDFLARE_ACCOUNT_ID`. The account
   ID can instead be a repository variable or the workflow input. Neither belongs
   in application source. Never paste the API token into chat or commit it.
5. Keep the existing `QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET` Actions secret.
   It accepts the raw Web client secret or downloaded **Web** OAuth JSON. Supply
   its matching public ID through `QUIET_SHELF_GOOGLE_WEB_CLIENT_ID` (variable),
   or the `googleWebClientId` workflow input. Web JSON can supply its own ID.
   Desktop, Android and iOS credentials are not used by this deployment.

## Deploy and update

Run **Hosted browser application** from public `main`, with the default Worker
name `quiet-shelf`. Source pushes alone do not deploy the web app. The private
mirror never runs a hosting job. Both source mirrors must contain the same
commit before a maintained deployment is reported complete.

The workflow runs all active checks, builds without credentials, validates the
Web OAuth application credential using a nonexistent refresh token, and uploads
through Cloudflare's official multipart Worker API. The Worker's public origin
is computed from the account's actual subdomain; it is never guessed. The
first upload creates a random session-encryption key as a Cloudflare secret.
Later uploads preserve that secret, so the encrypted browser cookies remain
usable. The Web secret is also supplied as a Cloudflare secret binding; it is
not written to a build artifact, source repository, or frontend asset.

Invocation logging/Logpush are disabled by this deployment. Do not enable
request-body/cookie or OAuth query-string logging to debug user libraries.
The app does not keep a central library database. A hosted server and Cloudflare
necessarily process the library data relayed between the browser and Google.

## Google Web client setup after the URL exists

The workflow summary shows the **actual** app URL and callback. In Google Auth
Platform → Clients → the existing **Web application** client, add:

- Authorized JavaScript origin: the exact HTTPS app origin from the summary.
- Authorized redirect URI: that origin plus `/api/account/callback`.

Keep the existing native clients, local-loopback settings, verified project
homepage and policy links. Add/verify an authorized app domain only if Google's
console requires it; do not replace working domains. A successful deploy cannot
change Google client configuration or prove real Google consent. Complete
Google's production/branding steps separately.

## Browser-side merge and free-tier limits

Cloudflare Free currently permits 100,000 dynamic requests/day and a small CPU
allowance per request. A 132-title synthetic library already exceeded that CPU
allowance when merged in Node, so hosting does **not** run the full merge inside
a Worker request. See [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/).

The hosted account status advertises `browser-v1`. Only then does shared
`account.js` select the hosted transport. `web/drive-client.js` uses the exact
shared `src/drive.mjs` reconciliation and `sync-core.js` validation in the
browser. The server authorizes bounded list/read/create/remove requests and
streams app-data snapshots without parsing/merging the full library. Google
tokens remain server-side in encrypted HttpOnly cookies; no access token is
sent to browser page scripts. Other platform adapters keep their existing
protocol and read/write the identical Drive checkpoint format.

Read-only preview never creates or removes a checkpoint. Writes create a new
checkpoint before cleaning up any observed predecessors. Invalid/oversized
snapshots, failed uploads, and an account change stop the operation while the
local library remains available. Cache entries are isolated by account.

Catalog parsing still uses the shared server adapters. Provider blocks, quotas,
CPU limits, and free-tier subrequest limits can affect availability. Deployment
smoke checks report each source separately; an HTTP 200 with no matches does
not prove catalog coverage. Do not claim every catalog works from Cloudflare
until real hosted queries have been checked. Do not enable a paid plan as a
workaround without the user's explicit agreement.

## Release verification

The workflow verifies static/script routes, version/source, anonymous status,
OAuth start/callback configuration, and each catalog without real user data.
The active hosted checks use simulated Google and Cloudflare services to test
encrypted sessions, origin/header/key isolation, browser/server round trips,
read-only preview, concurrent native checkpoints, failed uploads and key
preservation. They are not a substitute for Google consent on a real device.

After registering the callback, check real sign-in and restarting the browser,
first-sync options, a guest library, Drive → browser and browser → native edits,
offline changes, account switching/sign-out, JSON backup/restore, and the catalogs
you need. Use a separate test browser/profile until these pass.
