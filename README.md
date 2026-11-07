# Quiet Shelf

A personal reading tracker for books, manga and comics. **Current version: 0.9.0.**
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
**Sage / Beige** provides a lighter alternative with the same layout and charts.
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

Theme and chart-scope preferences are remembered separately in this browser,
using a versioned preferences object. They are not part of library backups and
do not yet sync between devices. The details panel stays visible while scrolling
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
preserved. If results are weak, the app tries normalized and shorter main-title
queries on the same source and with the same language filter (up to four
query variants). Results are
deduplicated, and wrong known volume numbers are excluded. Source access blocks
and quota errors are still reported; the app does not switch databases silently.

Valid ISBN-10/13 queries accept hyphens, spaces and an optional ISBN prefix.
Exact ISBN lookup bypasses the edition-language filter and verifies matching
identifiers rather than returning unrelated editions. Google Books and Open
Library receive explicit ISBN queries. Kitapyurdu results without an ISBN are
checked against up to four product pages; only verified matches are displayed.
Catalog indexing still limits coverage: for example, Kitapyurdu's search does
not return ISBN **9786054782369**, although its *The Valley Of Fear* page exists.

Paste a product/edition link into the same search field to load that exact
listing inside the app, then select it and save. Supported links are Kitapyurdu,
BKM Kitap, Open Library edition pages and Google Books volume pages. The source
selector switches to the link's catalog; normal source access restrictions still
apply. Kitapyurdu imports also read the page's displayed language when its
structured metadata omits it.

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
completion dates to JSON. Themes, chart scope, open/closed group preferences
and sorting are local interface preferences and are not included in this backup.
**Restore** imports that file and replaces the current records after
confirmation. Back up the target library before restoring if you need to keep
it. Backups from before the reading archive was added remain compatible.

Git contains application source, synthetic test records, and public catalog
metadata fixtures. Your library records and completion dates stay in browser
storage unless you export them. Never commit personal backups, API keys or
account/session information. Local `private/`, `data/`, `backups/`, and `exports/`
folders, environment files, database files and common key formats are ignored;
ignore rules do not remove anything already present in Git history.
Phone/computer syncing and Kitapyurdu account-list import/sync are not
implemented.

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

`src/` is the authoritative application source. Generated `dist/` and `work/`
files and the portable runtime are ignored by Git. Build outputs may embed
source files and ZIP downloads; regenerate them locally instead of committing
them. Building and running the PC app do not require hosting configuration.

Deployment identity in `.openai/hosting.json` is local and ignored by Git.
Publishing is separate from building and is not performed by `npm run build`.
