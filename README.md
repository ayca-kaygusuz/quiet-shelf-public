# Quiet Shelf

A personal reading tracker for books, manga and comics. **Current version: 0.12.0.**
Run it on your PC, keep your reading history in your browser, and back it up as
JSON. Internet access is used for catalog searches, cover images and Windows
update checks/downloads, and optional Google Drive sync in the Windows app.

## Windows application

[Download Quiet Shelf for Windows](https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/latest).
Choose the x64 `.exe` installer, run it, and open **Quiet Shelf** from Start or
its desktop shortcut. The release also includes `SHA256SUMS.txt`.

Version 0.10.0 passed local Windows runtime checks in an isolated profile:
startup, adding a title, start/finish dates, rereads, theme persistence, JSON
backup/restore, and separate browser storage. The installer
targets Windows 11 (64-bit Intel/AMD), installs for the current user,
and includes its own runtime. Node.js, a terminal window and the browser server
are not needed. The installer is unsigned; Windows may show an unknown-publisher
or reputation warning. There is no paid service or account requirement.

The Windows app and both browser versions remain available. The desktop app
uses the same interface, reading features and catalog adapters, but has its
**own separate local library and preferences**. It opens an internal app page,
not a hosted website. It can run beside the browser app. Optional Google sign-in
connects the Windows app directly to each user’s own Google Drive. A temporary
loopback listener opens only during sign-in and closes afterwards; normal app
use needs no browser server or hosted sync server.

Reading records work locally without internet. New catalog searches and uncached
cover images need an internet connection. Catalog source links open in your
normal browser. Back up opens a save dialog; Restore accepts the same JSON
backup format as the browser app. If desired, copy records manually by backing
up in one version and restoring in the other; changes remain independent.

The desktop profile lives in `%APPDATA%\Quiet Shelf`. It is separate from
browser storage, survives app upgrades, and is preserved when uninstalling the
application. Keep JSON backups. The installer refuses a non-empty destination
unless it is an existing Quiet Shelf installation; uninstall removes only its
installed files, not arbitrary files added to the installation folder.

### Windows updates

From version 0.11.0, the installed Windows app checks the public GitHub releases
on startup and daily while open. Only newer stable releases are offered. You
can also press **Alt**, then choose **Help → Check for updates…**.

Choose **Download update** and, when ready, **Restart and update**. The app
verifies the installer checksum, closes, installs the update and reopens.
**Account → App updates** and a small in-app card show the percentage and amount
downloaded, verification, and when the update is ready to install. The card stays
visible while scrolling; hide it and reopen it from Account without stopping
the download. A ready update can be installed from the card without downloading
it again. The indicator follows Dark Ink or Paper Grove and complements the
Windows taskbar progress bar.

Choosing **Later** leaves the current version running. Updates keep library
records, reading history, theme preferences and the separately saved Google key.
Offline startup stays quiet. Checks send no library records or Google key to GitHub.

Install 0.11.0 once using the release installer to get this feature; older
versions cannot update themselves. Browser copies continue to use source/ZIP
updates independently. Every Windows release rebuilds both `Quiet Shelf.exe`
and the installer from current source; generated binaries stay out of main.

### Desktop development and installer build

Use Node.js 24 LTS (or 22.12 or newer):

```sh
npm ci
npm run desktop
```

To make a Windows installer:

```sh
npm run build:windows
```

This packages the shared application with Electron, then uses NSIS to produce
`work/windows/Quiet-Shelf-Setup-<version>-x64.exe` and `SHA256SUMS.txt`. Official
build tools/runtimes are downloaded for development, and require network access
on the first build. Build dependencies, generated installers and personal data
are not committed. `scripts/generate-desktop-icon.mjs` regenerates the app icons.
The browser build command below remains separate and does not require Electron.

Windows-related changes on public main automatically build the installer and
check native startup. The private mirror skips the jobs. Build artifacts expire
after one day. To publish a release, manually run the workflow from main with
Publish enabled. That run builds again and deletes its temporary artifact after
publishing. Bump the application version before publishing a changed installer.

## Run locally

Use Node.js 22 or newer; Node.js 24 LTS is recommended. From the project root:

```sh
npm start
```

The browser/server version needs no npm dependencies. You can also run
`node pc/server.mjs`. Desktop development uses the separate npm dev dependencies.
On Windows, double-click `pc/start-windows.bat`, or run it in PowerShell:

```powershell
.\pc\start-windows.bat
```

The Windows launcher first checks for a portable `runtime/node.exe` inside this
project, then checks for Node.js on PATH. A portable runtime is not included in
the repository or download packages.

Open http://127.0.0.1:8765 in your browser. Keep the terminal open while using
the app; Ctrl+C stops the server. The server listens only on your own computer.

### Update a Git checkout

Stop the running server, then run these commands from the repository folder:

```sh
git pull --ff-only
npm start
```

If using portable Node.js on Windows, restart with `pc/start-windows.bat`
instead of `npm start`. Refresh the browser after restarting; use Ctrl+Shift+R
if it still shows the old version. The current version appears in the footer.

On desktop, the title-details sidebar stays visible while you scroll the list.
Long details scroll inside the panel; selecting a different title returns its
details to the top. Narrow screens use the normal single-column layout.

## Library, reading archive and wishlist

**My library** is the default view for titles currently yours. **Reading archive**
holds titles you no longer own, including books you gave away or borrowed.
**Wishlist** holds titles you want to buy, separately from the main library.
Use **Bought it — move to library** in a wishlist title’s Overview after buying
it, or use **Keep this title in** to move it between any of the three collections.
Moving a title preserves its reading status and all completion dates.
Each view has its own list, search, status filters and filter counts.
The Library insights charts have a separate scope, described below.
Archived titles are excluded from the main library's counts.

When adding a title, choose its destination under **Keep this title in**.
Adding while browsing the wishlist defaults to the wishlist; other views default
to My library. New entries still default to Unread.
Existing titles have the same control in **Overview**. Moving a title between
collections works in both directions and preserves its status and all
completion dates. Existing records from earlier versions remain in My library.

## Interface, themes and insights

The interface uses rounded panels, compact book rows, flat solid colors and
bundled Manrope type. **Dark Ink** is the default charcoal/violet theme;
**Paper Grove** provides a lighter alternative with the same layout and charts.
Use the Theme selector in the header to switch. The font is embedded so loading
it does not contact a font service. Its license is in `assets/Manrope-OFL.txt`.

**Library insights** shows a reading-status ring with real title counts and a
bar chart of completed readings over the last six calendar months. Each
completion counts, including rereads; the graph does not count only titles
currently marked Done. Months without completions show zero, and an empty
period has an explicit empty state. The chart uses the dates you recorded.

The default chart scope is **My library only**. Independent **Include archive**
and **Include wishlist** switches add those collections. Browsing a different
collection, searching, or filtering the list does not change the chart scope.
The status pills above the list filter the current collection; collection tabs
show each collection's total count. Series retain their separate grouped rows.

Theme and chart-scope preferences are remembered separately from book records.
Versioned JSON backups include them. When signed into the Windows app they also
sync with Google Drive, together with sort order, series expansion, search
source/language and collection/filter view. The details panel stays visible while scrolling
on desktop, and the interface stacks on narrow screens.

## Series and sorting

Numbered titles such as **ReLIFE Cilt 1** and **ReLIFE Cilt 2** are grouped
automatically once matching, distinct volumes are recorded. Detection supports
Cilt, Vol./Volume, Tome, # numbers, Japanese volume markers, and trailing volume
numbers. Titles such as **Chainsaw Man 1. Cilt / Testere Adam** are detected
even when the volume marker is followed by a translated subtitle. Standalone years and titles made entirely of digits are not treated
as numbered series. Automatically detected series with different known languages remain separate.
Custom series share a stable identity regardless of an entry’s language metadata.
Previously split custom groups with the same normalized name are combined
automatically when loading records or restoring a backup, preserving every
entry and completion date.

Series and standalone titles appear in separate sections. Series use distinct
headers and indented volume rows so their boundaries stay clear. Series groups
remember their last open/closed state in this browser, including changes made
with the bulk toggle. New groups, or groups without usable saved preferences,
start expanded. Click the arrow beside a series to collapse or reopen it. Use **Collapse all series / Expand all series** beside
the title count to toggle all groups in the current filtered collection. Volumes are ordered
numerically (1, 2, 10), and each retains its own status, collection and history.
A series can span collections, while each view only shows its own titles.
Search respects the saved open/closed state; matching counts remain visible
in collapsed group headers.

Optional series-name and volume fields are available when adding titles. In
Overview, **Series grouping** lets you keep automatic detection, set a custom
series, or mark a title standalone. Both the add form and manual series editor
include an **Existing series** dropdown and name suggestions, populated from
automatic and custom series across all collections. Choose a saved name instead
of retyping it, or enter a new one. The existing-series dropdown remains usable
in automatic and standalone modes. Choosing a series name switches the editor
to **Set series myself**, fills its name and enables the name/volume fields.
Opening or cancelling the dropdown leaves the current mode unchanged. Click **Save series** to apply corrections.

The list's sort selector offers date added (oldest/newest), title (A–Z/Z–A),
author, reading status, and most recently finished. The last choice is remembered
across collections and reloads. Each section follows the selected sort; series groups follow their first
matching sorted entry, while volumes
inside a group stay in numerical order. New records save an added timestamp.
Older records without timestamps use their saved order as a fallback; historical
added dates are not invented.

## Adding titles and recording rereads

Use **Add title** to search a catalog or enter a title manually. Only the title
is required for manual entry; author and description are optional.

- **Unread** is the default status for each new entry.
- **In progress** can be selected when adding or updating a title. Entering
  this status records today as the current reading’s start date.
- **Done** records a completion date. When adding a completed title, the date
  defaults to today and can be changed to an earlier date.

Reading actions sit beside the status selector, separate from series editing.
**Record a finished reading…** and changing an existing title to Done both ask
for confirmation before adding today's date to its reading history. Cancelling
leaves the status and dates unchanged.
**Start rereading** returns it to In progress without removing earlier dates;
finishing again adds another date. In **Reading history**, you can edit or
remove completion dates and add past readings. Future completion dates are
not accepted. Every completed reading keeps both its start and finish date.
If you mark a title Done without first setting it In progress, its start date
defaults to the selected finish date. This also applies to adding past readings
and adding titles already Done. When the start defaults to the finish, editing
the finish date keeps them together until you explicitly edit the start.

Each reread records a new start when you choose In progress or Start rereading;
earlier readings retain their own dates. The history tab shows the current
reading's start date and lets you edit start/finish dates. A start must be on or
before its finish; future dates are rejected. Returning to Unread clears only
the unfinished reading's start, preserving completed history.

Older completed records without a start default to their existing finish date.
An older In progress entry with no known start stays unspecified until you
enter it or begin a new reading; no historical start is guessed. Both dates
are included in backups and retained when moving between collections.

Title deletion is inside the **⋮** menu and asks for confirmation. Deleting a
title also deletes its reading history. Sample titles can be removed together
from the library's **⋮** menu.

## Catalog search

Choose one **Search source** at a time. The app remembers the last source and
language selection. Where supported, **Edition language** narrows results;
suggestions display available author, publisher, language and ISBN details.
Select a result, review its details, then add it to the chosen collection.

Search accepts full titles up to 300 characters and sends the original wording
to the selected catalog first. Curly and straight apostrophes are handled
consistently; internal apostrophes stay inside the word when normalizing
(e.g. DEHB'li becomes dehbli, not two separate search terms).
Candidates are ranked using punctuation- and Turkish-diacritic-insensitive
matching against the original title, author or ISBN, with volume numbers
preserved. A query can combine title and author words. Adjacent alphabetic words
also match joined/spaced spellings (for example, `dil bilgisi` and `dilbilgisi`)
without joining numbers or skipping intervening words. If results are weak, the app tries normalized and shorter main-title
queries on the same source and with the same language filter (up to four
query variants). Results are
deduplicated, and wrong known volume numbers are excluded. Source access blocks
and quota errors are still reported; the app does not switch databases silently.

Valid ISBN-10/13 queries accept hyphens, spaces and an optional ISBN prefix.
Exact ISBN lookup bypasses the edition-language filter and verifies matching
identifiers rather than returning unrelated editions. Google Books and Open
Library receive explicit ISBN queries. Nadir Kitap uses its ISBN search field
and verifies the listing identifiers. Kitapyurdu results without an ISBN are
checked against up to four product pages; only verified matches are displayed.
Catalog indexing still limits coverage: for example, Kitapyurdu's search does
not return ISBN **9786054782369**, although its *The Valley Of Fear* page exists.

Paste a product/edition link into the same search field to load that exact
listing inside the app, then select it and save. Supported links are Kitapyurdu,
BKM Kitap, Nadir Kitap, Open Library edition pages and Google Books volume pages. The source
selector switches to the link's catalog; normal source access restrictions still
apply. Kitapyurdu imports also read the page's displayed language when its
structured metadata omits it.

| Source | Current behavior and observed access limits |
| --- | --- |
| Kitapyurdu | Edition search/import with a language filter. Local searches have worked; the hosted server has received HTTP 403 responses. |
| BKM Kitap | Edition search/import. Language filtering uses the listing's language metadata. Hosted searches and imports have succeeded. |
| Nadir Kitap | Title/author and exact ISBN search, plus listing-link import. Details are read directly without a browser connector. Seller copies with matching valid ISBN and edition details are combined; conflicting years, bindings, languages or missing identifiers remain separate. |
| Open Library | International edition search/import with language filtering. Coverage varies by title and language. |
| Google Books | Volume search/import with language filtering. Shared unauthenticated requests have hit quota limits; an optional personal API key is supported. |
| AniList | Manga series search/import, rather than a specific translated print edition. Edition-language filtering is disabled for this source. API access has failed from the cloud environment. |

Nadir Kitap suggestions include publication year and binding when supplied.
Language filtering uses the listing's metadata; choose Any language to include
listings whose language is unknown. Detail requests are cached and limited to
three at a time, checking up to 24 relevant listings to find unique editions.
Partial failures are reported, and access blocks are not shown as empty results.

Access can change independently of the application. A successful deployment or
fixture test does not establish that every live catalog is reachable.
D&R, İdefix and regional Amazon searches are not active sources in this version.

### Google Books API key

In Google Cloud, create a project, enable **Books API**, and create an API key
for **Public data**. Restrict the key to **Books API**. Quiet Shelf makes the
request through its server, so website/referrer restrictions do not match the
current request path.

In **Add title**, select Google Books and paste the key into its API-key field.
If a search term is already entered, pasting or changing the key retries that
search automatically. The key is sent through the app server to Google. It is
saved in a separate local setting for this browser or Windows app profile.
It survives closing the form and restarting the app, but is not included in
library records, source preferences, JSON backups or Git. Clear the field to
forget the saved key. The browser and Windows app remember their own keys
independently. If local storage is unavailable, the form says so and the key
can still be used for the current form. Your project's Google quota still applies.

## Saving, backups and syncing

Records are stored in the browser's local storage. Use the same browser,
profile and address each time. Local and hosted app storage is separate.
Closing or updating the server does not erase browser records; clearing the
browser's storage does.

**Account → Back up** exports all three collections, series, reading start/finish
history and view preferences in version-2 JSON. Google Books keys, Google tokens,
connection settings and account identity are excluded. **Restore** accepts this
format and legacy library-only JSON arrays. It replaces the current workspace
after confirmation. When signed in, that replacement becomes a syncable change;
export a backup before replacing anything you want to keep.

### Google Drive in the Windows app

Open **Account** and choose **Sign in with Google**. Google opens in your system
browser. Quiet Shelf requests basic account identity and only its own hidden
Drive app-data folder (`drive.appdata`), not access to your other Drive files.
No PC or server has to stay on for Drive to retain the saved copy. Sync runs
while the app is open; an offline device catches up after it reconnects.

Each Google account has a separate device workspace. Your original signed-out
library is kept separately. Signing in first loads that account’s Drive data.
Use **Copy local library to this account** if you want to add your original
local titles; sample titles are excluded and existing account titles remain.
Signing out returns to the signed-out library. Unsynced account edits remain
cached for that account on this device. These device caches are not a password
vault: use separate Windows user accounts when sharing a computer.

Automatic sync is on by default, with a short delay after changes and a periodic
check while the app is visible. Windows metered/data-limit/roaming detection
pauses automatic sync. A device-local override and **Sync now** are available;
manual sync is allowed on metered connections. Turning automatic sync off does
not discard the local queue. Google Books API keys always stay device-local.

Sync preserves independent field changes, separate rereads and deletion markers.
Drive copies are immutable checkpoints: a new copy must save successfully before
observed older copies can be cleaned up. Concurrent changes to the same field
remain available under **Review sync changes** until a user chooses a value.
Deleted titles win a concurrent delete/edit conflict until explicitly recovered.
Invalid or oversized cloud copies stop the sync without replacing the local
workspace. Keep manual exports as an additional backup.

Windows refresh tokens are encrypted with Electron safeStorage/Windows DPAPI in
`%APPDATA%\Quiet Shelf`; they never reach the renderer, catalog providers, Git,
backup JSON or release assets. Sign-out forgets this installation’s connection;
it does not delete Drive data or sign other devices out. Google can revoke or
expire authorization, in which case the app requests sign-in again.

The browser version stays available with local storage and manual backup/restore.
Hosted browser Drive authorization and phone apps are deferred. A Web client
secret is not needed for the Windows PKCE flow. Kitapyurdu account-list sync is
not implemented. See [Google Drive setup](docs/google-drive.md) for maintainer
configuration and the real-account verification checklist.

Git contains application source, synthetic tests and public catalog fixtures.
Never commit personal exports, keys, OAuth credentials or account/session files.
Ignored local folders and file types do not remove data already in Git history.

## Keeping the development mirrors synchronized

In the maintainer's development checkout, `github` names the private GitHub
remote and `public` names the public GitHub remote. Push each source update to
both, using the same commit, and verify that their branch heads match. Private
configuration and personal data stay outside both repositories. `AGENTS.md`
records this workflow for future coding sessions.

## Development and active checks

```sh
npm test
```

Or run `node scripts/check.mjs`. The runner explicitly includes the active
checks for series detection and overrides, wishlist moves, sorting, initial statuses
and dates, reversible collection moves, persistence,
legacy backups, rereads, deletion, menus, source selection, language filtering,
parser fixtures, exact ISBN queries, catalog-link import, completion
confirmation, remembered group states, request routing and API failures. These checks use fixtures or
mocks; live source access and visual browser behavior require separate checks.

Main files:

| Path | Purpose |
| --- | --- |
| `src/index.html` | Interface, browser storage, reading history and collections |
| `src/catalog.mjs` | Catalog adapters and API request handling |
| `pc/server.mjs` | Local browser HTTP server |
| `desktop/main.mjs` | Separate Windows app window and local profile |
| `desktop/app-protocol.mjs` | In-process app/catalog routing and navigation policy |
| `desktop/updates.mjs` | GitHub release checks and verified Windows update downloads |
| `scripts/check-windows-update.ps1` | Installed Windows upgrade/restart smoke check |
| `scripts/build-windows.mjs` | Windows installer packaging |
| `desktop/installer.nsi` | Per-user installation and data-preserving uninstall |
| `pc/start-windows.bat` | Windows launcher, including portable Node.js support |
| `scripts/check.mjs` | Explicit active-test runner |
| `tests/` | Active checks and catalog metadata fixtures |
| `build.mjs` | Download packaging and hosted Worker generation |

## Archived browser connector

[`archive/browser-connector/`](archive/browser-connector/README.md) preserves the
removed connector architecture and both original tests. The tests are stored
as `.cjs.disabled` files outside the active test directory. The connector and
its tests are not loaded, served, packaged, or run by `npm test`.

Keep them inactive unless explicitly requested. The archive includes a
reactivation patch and instructions. Later application changes may require
merging the connector portions manually; do not overwrite the current app
with the older snapshot. This development archive is unrelated to the app's
Reading archive collection.

## Build downloads and hosted Worker

The local app runs directly from source. To create distribution packages,
install Python 3 in addition to Node.js, then run from the project root:

```sh
npm run build
```

The build uses `python` on Windows and `python3` elsewhere. It writes:

- `work/quiet-shelf-pc.zip`: local application package.
- `work/quiet-shelf-update.zip`: updated application files for an existing copy.
- `dist/server/index.js`: generated hosted Worker with embedded download packages.

`src/` is the authoritative application source. Generated `dist/` and `work/`
files and the portable runtime are ignored by Git. Build outputs may embed
source files and ZIP downloads; regenerate them locally instead of committing
them. Building and running the PC app do not require hosting configuration.

Deployment identity in `.openai/hosting.json` is local and ignored by Git.
Publishing is separate from building and is not performed by `npm run build`.
