# Quiet Shelf

A personal reading tracker for books, manga and comics. **Current version: 0.8.2.**
Run it on your PC, keep your reading history in your browser, and back it up as
JSON. Internet access is used for catalog searches and cover images.

## Run locally

Use Node.js 22 or newer; Node.js 24 LTS is recommended. From the project root:

```sh
npm start
```

No npm dependencies need installing. You can also run `node pc/server.mjs`.
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

## Library, reading archive and wishlist

**My library** is the default view for titles currently yours. **Reading archive**
holds titles you no longer own, including books you gave away or borrowed.
**Wishlist** holds titles you want to buy, separately from the main library.
Use **Bought it — move to library** in a wishlist title’s Overview after buying
it, or use **Keep this title in** to move it between any of the three collections.
Moving a title preserves its reading status and all completion dates.
Each view has its own list, search, status filters and dashboard counts.
Archived titles are excluded from the main library's counts.

When adding a title, choose its destination under **Keep this title in**.
Adding while browsing the wishlist defaults to the wishlist; other views default
to My library. New entries still default to Unread.
Existing titles have the same control in **Overview**. Moving a title between
collections works in both directions and preserves its status and all
completion dates. Existing records from earlier versions remain in My library.

## Series and sorting

Numbered titles such as **ReLIFE Cilt 1** and **ReLIFE Cilt 2** are grouped
automatically once matching, distinct volumes are recorded. Detection supports
Cilt, Vol./Volume, Tome, # numbers, Japanese volume markers, and trailing volume
numbers. Titles such as **Chainsaw Man 1. Cilt / Testere Adam** are detected
even when the volume marker is followed by a translated subtitle. Standalone years and titles made entirely of digits are not treated
as numbered series. Entries with different known languages remain separate.

Series groups start expanded by default. Click the arrow beside a series to
collapse or reopen it. Volumes are ordered
numerically (1, 2, 10), and each retains its own status, collection and history.
A series can span collections, while each view only shows its own titles.
Search expands matching groups so individual results remain visible.

Optional series-name and volume fields are available when adding titles. In
Overview, **Series grouping** lets you keep automatic detection, set a custom
series, or mark a title standalone. Click **Save series** to apply corrections.

The list's sort selector offers date added (oldest/newest), title (A–Z/Z–A),
author, reading status, and most recently finished. The last choice is remembered
across collections and reloads. Series groups follow the selected sort; volumes
inside a group stay in numerical order. New records save an added timestamp.
Older records without timestamps use their saved order as a fallback; historical
added dates are not invented.

## Adding titles and recording rereads

Use **Add title** to search a catalog or enter a title manually. Only the title
is required for manual entry; author and description are optional.

- **Unread** is the default status for each new entry.
- **In progress** can be selected when adding or updating a title.
- **Done** records a completion date. When adding a completed title, the date
  defaults to today and can be changed to an earlier date.

Marking an existing title Done adds today's date to its reading history.
**Start rereading** returns it to In progress without removing earlier dates;
finishing again adds another date. In **Reading history**, you can edit or
remove completion dates and add past readings. Future completion dates are
not accepted.

Title deletion is inside the **⋮** menu and asks for confirmation. Deleting a
title also deletes its reading history. Sample titles can be removed together
from the library's **⋮** menu.

## Catalog search

Choose one **Search source** at a time. The app remembers the last source and
language selection. Where supported, **Edition language** narrows results;
suggestions display available author, publisher, language and ISBN details.
Select a result, review its details, then add it to either collection.

| Source | Current behavior and observed access limits |
| --- | --- |
| Kitapyurdu | Edition search/import with a language filter. Local searches have worked; the hosted server has received HTTP 403 responses. |
| BKM Kitap | Edition search/import. Language filtering uses the listing's language metadata. Hosted searches and imports have succeeded. |
| Open Library | International edition search/import with language filtering. Coverage varies by title and language. |
| Google Books | Volume search/import with language filtering. Shared unauthenticated requests have hit quota limits; an optional personal API key is supported. |
| AniList | Manga series search/import, rather than a specific translated print edition. Edition-language filtering is disabled for this source. API access has failed from the cloud environment. |

Access can change independently of the application. A successful deployment or
fixture test does not establish that every live catalog is reachable.
D&R, İdefix and regional Amazon searches are not active sources in this version.

### Google Books API key

In Google Cloud, create a project, enable **Books API**, and create an API key
for **Public data**. Restrict the key to **Books API**. Quiet Shelf makes the
request through its server, so website/referrer restrictions do not match the
current request path.

In **Add title**, select Google Books and paste the key into its API-key field,
then enter or change your search term. The key is sent through the app server
to Google. It is not saved in your library, source preferences, backups or Git.
The form resets when reopened, so the key must currently be entered again for
each Add title session. Your project's Google quota still applies.

## Saving, backups and syncing

Records are stored in the browser's local storage. Use the same browser,
profile and address each time. Local and hosted app storage is separate.
Closing or updating the server does not erase browser records; clearing the
browser's storage does.

**Back up** exports all three collections, saved series settings, and all
completion dates to JSON.
**Restore** imports that file and replaces the current records after
confirmation. Back up the target library before restoring if you need to keep
it. Backups from before the reading archive was added remain compatible.

Git contains the application and its history, not your personal library.
Phone/computer syncing and Kitapyurdu account-list import/sync are not
implemented.

## Development and active checks

```sh
npm test
```

Or run `node scripts/check.mjs`. The runner explicitly includes the active
checks for series detection and overrides, wishlist moves, sorting, initial statuses
and dates, reversible collection moves, persistence,
legacy backups, rereads, deletion, menus, source selection, language filtering,
parser fixtures, request routing and API failures. These checks use fixtures or
mocks; live source access and visual browser behavior require separate checks.

Main files:

| Path | Purpose |
| --- | --- |
| `src/index.html` | Interface, browser storage, reading history and collections |
| `src/catalog.mjs` | Catalog adapters and API request handling |
| `pc/server.mjs` | Local HTTP server |
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

`work/` and the portable runtime are ignored by Git. `src/` is the authoritative
application source. `.openai/hosting.json` identifies the existing private
Sites publication; it contains hosting configuration rather than credentials.
Publishing is separate from building and is not performed by `npm run build`.
