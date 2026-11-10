# Quiet Shelf

A personal reading tracker for books, manga and comics. **Current version: 0.21.0.**
Run it on your PC, keep your reading history in your browser, and back it up as
JSON. Windows, Linux, Android, iPhone/iPad and browser versions share the same library format
and features. Internet access is used for catalog searches, cover images,
update checks/downloads and optional Google Drive sync.

## Windows application

[Download Quiet Shelf for Windows](https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/latest).
Choose the x64 `.exe` installer, run it, and open **Quiet Shelf** from Start or
its desktop shortcut. The release also includes the current browser ZIP, browser update ZIP and `SHA256SUMS.txt`.

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

## Linux application

[Download Quiet Shelf for Linux](https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/latest).
The first native Linux release targets **x86-64 / amd64**:

- **Ubuntu/Debian/Mint:** install `Quiet-Shelf-0.21.0-linux-amd64.deb` with your
  package installer, then open **Quiet Shelf** from the applications menu.
  The `quiet-shelf` command is also available. For terminal installation:
  `sudo apt install ./Quiet-Shelf-0.21.0-linux-amd64.deb`.
- **Other Linux desktops:** extract `Quiet-Shelf-0.21.0-linux-x64.tar.gz`, then
  open the `quiet-shelf` executable in the extracted folder. Keep the entire
  folder together. The portable build needs the usual Electron/GTK/NSS system
  libraries and working Chromium sandbox support (unprivileged user namespaces).
  On Ubuntu systems that restrict portable applications' user namespaces, use
  the `.deb` package, which includes the normal app-specific sandbox integration.

No separate Node.js installation, browser server or Google Cloud client is
needed. The native app uses the existing **Desktop app** OAuth client, with a
short-lived loopback callback only during sign-in. A GNOME Secret Service or KDE
KWallet keyring remembers the connection securely. If no usable keyring is
available, sign-in still works for the current app session; refresh tokens are
never saved through Electron's plaintext fallback. Unlock/enable your desktop
keyring to remember sign-in.

The profile is `~/.config/Quiet Shelf` (or `$XDG_CONFIG_HOME/Quiet Shelf` when set).
It survives package upgrades/removal and portable-folder replacement. The
browser has its separate storage; use Drive or JSON backup/restore to connect
libraries. Linux includes the same themes, insights, search, series/display
options, reading history, wishlist/archive and Read next rules. NetworkManager
metered information is used when available; the manual connection switch and
manual sync remain available.

Account → App updates checks stable GitHub versions, respecting the saved
preference, offline state and metered connections. Downloads start only when
requested and are checked against SHA-256 before **Show downloaded package**
reveals them. Install the `.deb` or extract/replace the portable app folder,
then reopen Quiet Shelf. Linux does not silently run privileged installation
commands or replace a running installation. Back up remains available offline.
The release workflow tests the installed app under Ubuntu 24.04 with a real
Linux keyring, full shared UI checks and profile persistence after restart;
package checks compare the portable binary/assets with the tested installed app.

### Android app

The release includes **Quiet-Shelf-Android-0.21.0.apk** for Android 8 or later
with an updated Android System WebView. Download the APK on your phone and open
it; Android may ask you to allow installation from that browser. Future APKs
install over the existing app using the same signing identity. No PC, browser
server or paid app-store account is needed. Uninstalling removes local app data;
use Drive or a JSON backup before doing so.

Android shares library/status/history, series, archive/wishlist, all six themes,
search providers, insights, first-sync choices and recovery with Windows/web.
Title details open as a phone-sized panel; the Android Back action closes forms,
Account or details before leaving the app. System bars follow the selected theme.
The native system file picker handles backup and restore without broad storage
permission. Google sign-in needs Google Play services and the app's registered
Android client; no client secret or manual user credential setup is required.

Automatic sync and update checks pause on metered/offline connections. Manual
checks and the saved preference remain available. Android updates link to the
release APK and require the normal Android install confirmation. The release
checksum manifest covers the APK alongside the Windows/browser packages.
See [Android development and signing](android/README.md).

### iPhone and iPad app

The universal iOS/iPadOS app targets **17.4 or later** and uses the shared library,
catalog, reading history, themes, Read next and Google Drive data format. iPad
uses a full-size window, supports portrait/landscape and permits system
multitasking. From 720 points wide, library and details appear side by side;
narrow windows use compact list/detail navigation. Touch targets, safe areas,
system Files pickers and keyboard shortcuts are included.

Free distribution uses an **unsigned IPA**, installed and signed using
**AltStore Classic** from Windows. It cannot install by tapping a download.
Free Apple signing needs refreshing within seven days, with AltServer reachable
for renewal. The PC does not need to stay on continuously. Keep the same Apple
account and update the existing app to preserve its local storage.

Google sign-in uses an iOS OAuth client and the native SDK/Keychain; no iOS OAuth
secret or local browser server is needed. JSON backup/restore also works without
signing in. Update checks respect the saved preference and connection status;
install IPA updates through the same signing method.

See [iPhone/iPad installation and development](ios/INSTALL.md). The native build
workflow validates iPhone/iPad simulators and prepares an explicitly unsigned
arm64 IPA. Physical-device installation, signing renewal and Google consent are
separate checks; simulator success does not prove those. App Store/TestFlight
distribution is not configured and normally requires paid Apple membership.

### German edition sources

**DNB**, **K10plus**, **Thalia** and **Hugendubel** are available inside Add title,
without an API key or browser connector. DNB and K10plus use public SRU/MARC
bibliographic records; Thalia and Hugendubel use their public search and edition
pages. Search by title, author or ISBN, or paste a matching catalog record link.
Any language is the default. Explicit language filters use recorded metadata;
German catalog coverage includes editions in other languages. Libraries may lack
covers, and bookstore result cards load fuller metadata when selected. Catalog
subjects, where supplied, are cached for on-demand Read next information.
Live ISBN/title searches and imports were verified for all four during 0.20.0
verification. Availability and metadata coverage can change independently.

### LovelyBooks

**LovelyBooks** is available in Add title for title, author and ISBN search,
without a login, API key or browser connector. It uses the site's anonymous
catalog interface; this is not a documented public API, so site changes may
require adapter maintenance.

Title searches show the featured editions supplied by LovelyBooks. Search by
ISBN for an exact edition, or paste a LovelyBooks book link. Imports and later
metadata refreshes use the selected edition's title ID, with ISBN verification,
instead of switching to the grouped work page's featured edition. A pasted
work link loads its currently featured edition and is labelled accordingly.
The external **View book on LovelyBooks** link may show the grouped book page.

Any language remains the default. Explicit filters use the recorded language;
unknown page counts, genres or ISBNs stay unknown. ASINs are not stored as ISBNs,
and audiobook results are excluded. Catalog metadata is cached for on-demand
Read next lookups. Live title/author/ISBN searches and edition imports were
verified during 0.21.0 development.

### Additional English-language edition sources

**Blackwell’s (UK)** and **Better World Books (US)** appear in the search-source
menu. Search and import their edition results directly in Quiet Shelf, including
ISBN, publisher, binding and listed language. Blackwell’s also supplies page
counts when available. A pasted product link opens its exact edition. No
browser connector, retailer account or extra API key is needed. Any language is
the default; explicit language filters check edition details rather than assuming
a language from the store’s country. Availability depends on the retailers’
public pages; source failures are shown in the app.

### Read next

Open **Read next** above Library insights to generate a saved checklist of up to
12 suitable unread titles from My library. Choose a balanced mix, quicker reads
or series continuations, with an optional genre filter. Weighted randomness
varies each new mix; when enough alternatives exist, replacement changes the
books rather than merely shuffling them. Small eligible shelves may contain
fewer than 12 suggestions or require repeats.

Each series contributes at most its next unread volume. Unfinished or missing
earlier volumes prevent skipping ahead. Finishing a suggested volume checks it
off; the next volume can appear only after another explicit generation. Series
progress, unread volumes owned and time since registration influence priority.
Dates never claim to represent purchase time.

In-progress and finished entries look different, with a completion counter and
progress bar. The checklist remains fixed until replaced; replacing an unfinished
list requires confirmation. There is no suggestion-list history. Removed and
archived titles remain recognizable in the current checklist. Open a title to
change its real reading status, without a second set of completion records.

Generating a list checks missing catalog information **only on demand**, using
saved edition links and exact ISBNs in Open Library and Google Books. Two requests
run at a time; progress is shown. **Refresh catalog information** does the same
lookup without replacing the list. Catalog categories (including Kitapyurdu's
product categories) identify study/reference books; titles and language alone
never exclude a book. Unconfirmed types remain eligible and clearly labeled.
Offline generation uses cached information. Metered connections ask before
lookup, and declining uses the cache. Failed lookups do not block generation.
The optional Google Books key stays on this device. No AI service, background
generation or background metadata refresh is used. Effort estimates combine
known page count and format. Title details → Read next preferences allows a
reversible exclusion or format override.

Open a title → **Read next preferences** to exclude just that title or its entire
series. Leave the end date blank for no expiry, or choose a date to pause
suggestions through that day. Series exclusions also cover volumes added later.
**Read next → Excluded titles & series** lists active and expired rules and lets
you undo either kind. Rules never remove books or rewrite the current checklist;
expired titles become eligible the next time you generate. Exclusions and dates
are saved locally, backed up and synced separately for each account/guest shelf.

The current checklist, settings, exclusions and cached information are included
in backups and optional Drive sync, separately for guest/account workspaces.
Update Windows, Android and browser copies before sharing these new fields;
older clients safely reject unfamiliar sync data. Every search source starts
with **Any language**, while manually chosen language filters remain remembered.

### Themes

Choose a palette in the header’s Theme menu. Dark options are **Dark Ink**,
**Midnight Tide** (navy/sea-glass) and **Rosewood** (plum/dusty rose). Light options
are **Paper Grove**, **Porcelain** (cool white/blue) and **Apricot Hour**
(warm cream/terracotta). Every palette keeps the same rounded, flat layout,
readable status colors and chart separators. Theme choices stay on this device,
travel with JSON backups and optional Drive sync, and never change book records.
Use current browser and Windows versions when syncing the new palette names.

### Windows updates

Open **Account → App updates** for a quiet runtime status: a newer version,
a downloaded update, the last successful check, or a check failure. Automatic
checks are on by default and run at startup and at most once per day while open.
They pause while offline, on a metered connection, or when **Automatic update
checks** is switched off. The card explains the current pause reason. Network
conditions are rechecked while the app stays open, so eligible checks resume
without restarting.

**Check for updates** works independently of the automatic-check toggle and can
be used on a metered connection. Finding an update never opens a prompt or
starts a download. The toggle is saved with library preferences, included in
version-2 JSON backups and shared through optional Drive sync. Runtime check
history and connection cost stay local. On Windows, a profile-local mirror lets
the background updater honor the preference before the interface opens. Legacy
backups default to automatic checks on.

The browser version has the same status, toggle and manual check, with a link
to the matching browser package when newer source is released. It does not
replace its own running files or install a Windows executable. Hosted browser
code still updates when deployed. The native Help menu also has a manual check.

Choose **Download update** and, when ready, **Restart and update**. The app
verifies the installer checksum, closes, installs the update and reopens.
**Account → App updates** and a small in-app card show the percentage and amount
downloaded, verification, and when the update is ready to install. The card stays
visible while scrolling; hide it and reopen it from Account without stopping
the download. A ready update can be installed from the card without downloading
it again. The indicator follows Dark Ink or Paper Grove and complements the
Windows taskbar progress bar.

Download only when you choose; confirming **Restart and update** is required to install. Updates keep library
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

### Series ordering and display

Title A–Z / Z–A sorts both series names and the titles inside each series,
using natural number ordering. Other sorts order series by their first book
under the selected ordering; numbered volumes keep their reading sequence in
grouped view. **Show series** and **Show standalones** independently filter the
library display. **Plain list** shows every matching title in one sorted list,
without group headers, nesting or collapse controls. Returning to grouped view
restores the previous visibility and expansion choices. These controls never
remove books or change library insights. Display preferences are remembered
locally and included in backups and Drive sync; update other clients before
syncing the new display preference.

Language-course detection recognizes study subjects and learning/speaking
phrases together with a language name, rather than excluding books merely
because they are in another language. If a saved checklist contains a title
now recognized as study/reference material, it is flagged as excluded from
future suggestions without replacing the saved list. Regeneration remains
explicit, with the existing unfinished-list confirmation.

## Catalog search

Choose one **Search source** at a time. The app remembers the last source.
Every new **Add title** dialog starts with **Any language**, including after
loading older preferences or signing in. You can choose an **Edition language**
to narrow the current search;
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
BKM Kitap, Nadir Kitap, Open Library edition pages, Google Books volume pages,
Blackwell’s, Better World Books, Thalia and Hugendubel product pages, plus DNB
and K10plus record links. The source
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
| Blackwell’s (UK) | In-app edition search and product-link import from public pages, without a connector or API key. Explicit language filters read edition details. Live search and import succeeded during 0.16.0 verification. |
| Better World Books (US) | In-app edition search and product-link import from public pages, without a connector or API key. ISBN, publisher, binding and actual language are checked. Live search and import succeeded during 0.16.0 verification. |
| DNB | German National Library SRU edition records: title/author/ISBN search, record-link import, language, publisher, pagination and subjects where supplied. No API key. |
| K10plus | Library union catalog SRU edition records with international coverage, ISBN and record-link import. No API key. |
| Thalia | In-app search and edition import from public German bookstore pages, with actual edition language, ISBN and pagination. No connector or API key. |
| Hugendubel | In-app search and edition import from public German bookstore pages, with actual edition language, ISBN and pagination. No connector or API key. |
| LovelyBooks | In-app title/author/ISBN search through anonymous catalog requests. Selected editions retain their title ID and ISBN; work links load the featured edition with an explicit notice. Some metadata is unavailable. |
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
history and view preferences in version-2 JSON. Google Books keys, user access/refresh tokens,
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

Signing in keeps the current shelf visible while Drive is checked read-only.
For an empty Drive account, choose **Start syncing this library**. When Drive
already has titles, review both counts and choose **Combine libraries** or
**Use Drive library**. Counts cover all three collections; sample titles are
excluded. Local edits made while deciding are kept. A failed check leaves the
current library open, with a waiting-to-connect message.

Before a choice changes the workspace, the app saves a recovery set. Find it in
**Account → Backups & restore → Download recovery copy**. The latest three sets
stay on the device and include the pre-connection shelf and Drive snapshots.
The separate signed-out library and account queues are retained. Accounts that
have completed the new connection choice reopen quietly. Older empty account
views recover the preserved signed-out shelf before any network call.

The header stays visible while scrolling and shows the current sync status beside
Account: Local only, Syncing, Changes waiting, Offline, Sync paused, Sync failed,
or Synced with the age of the last successful check. Click the indicator for the
exact timestamp, an explanation and **Sync now**. Opening this panel never starts
sync automatically. A previous successful sync is not a live guarantee about
changes another device made afterward. Unfinished setup, conflicts, sign-in and
local save problems have their own status; Windows update progress stays separate.

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

Web and Windows share sign-in, first-sync choices, preferences, recovery and
library behavior. The release includes **quiet-shelf-pc.zip**, an updated local
browser package with Google sign-in configured. Extract it over the existing
browser folder, restart `pc/start-windows.bat`, and use the same browser/profile
and `http://127.0.0.1:8765` to retain library and sign-in storage. Keep its private
runtime folder when updating. The local web server is needed only while using
that browser copy; Drive retains the shared data while it is stopped.

A hosted Worker adapter implements Web OAuth with server-side Web credentials,
encrypted HttpOnly remembered-session cookies, state/PKCE and the same data
format. Public hosting deployment remains deferred. The release supplies the Desktop application credentials alongside PKCE; users
only sign in and approve access. Web client credentials remain separate. Kitapyurdu account-list sync is
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
| `desktop/updates.mjs` | Saved background-check policy and verified Windows update downloads |
| `src/releases.mjs` | Shared trusted release metadata and browser update-check adapter |
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


## License and attribution

Quiet Shelf's original project material is licensed under the
[Apache License 2.0](LICENSE). This covers the original application source,
documentation, artwork/assets, tests, build scripts and archived connector,
including earlier revisions of that original material published in this
repository. Original project created by **Alex (Ayca Kaygusuz)**; see [NOTICE](NOTICE).

You may use, modify and redistribute the covered work, including commercially,
under Apache-2.0. Redistribution must meet its license and notice requirements.
Keep applicable attribution, include the license, and identify modified files
as required by the license. This does not add a requirement to preserve a
particular logo, footer or screen layout.

Third-party material remains under its respective licenses and terms; see
[third-party notices](THIRD_PARTY_NOTICES.md) and the
[Manrope font license](assets/Manrope-OFL.txt). Catalog content and user data are
not relicensed as project code. Account → About Quiet Shelf displays the
creator credit, Apache license and retained notices offline on every platform.
Redistributable packages include the applicable notice files. Android releases
also provide the unmodified desugar_jdk_libs runtime's upstream source archive
beside the APK, under its GPLv2 + Classpath Exception terms. This runtime's
exception permits Quiet Shelf's independent original code to remain Apache-2.0.
