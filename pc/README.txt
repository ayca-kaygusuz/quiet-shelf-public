QUIET SHELF — PC VERSION 0.10.1

THIS PACKAGE IS THE LOCAL BROWSER VERSION
A separate installable Windows app is also available from the public repository's
Releases page. It bundles its runtime and needs no Node.js or terminal. Both
versions remain available and keep separate local libraries. No syncing exists
in this release. Back up and Restore can copy records manually if desired.

START
Use Node.js 22 or newer (24 LTS recommended).
Extract the entire ZIP before running it.
Windows: open pc/start-windows.bat. It uses runtime/node.exe inside the project
if present, otherwise Node.js on PATH. The runtime is not included in this ZIP.
macOS/Linux: run node pc/server.mjs from the extracted project folder.

Open http://127.0.0.1:8765 and keep the terminal window open while using it.
Press Ctrl+C to stop. After updating files, restart and refresh the browser.

THEMES AND LIBRARY INSIGHTS
Theme in the header switches between Dark Ink and Paper Grove, with flat
colors, rounded panels and bundled Manrope type (no online font request).
The theme and chart scope are remembered in this browser, separately from backups.
The status ring uses real title counts. Finished readings shows the last six
calendar months and includes every recorded completion, including rereads.
Include archive and Include wishlist independently add those collections to
stats. The charts default to My library only, regardless of the collection
currently open. The list's status pills filter the collection you are browsing.

COLLECTIONS AND READING HISTORY
My library holds titles currently yours. Wishlist saves books to buy; use
Bought it in a wishlist entry to move it into My library. Reading archive holds titles no longer
owned or borrowed. Use Keep this title in when adding a title or in its Overview
to move it between collections in either direction. Status and completion dates
are preserved. The main library excludes archived titles from its list/counts.

New titles default to Unread. You can also add them In progress or Done.
Done defaults to today's completion date; earlier dates can be entered.
Entering In progress records today's start date, including when adding a title.
Finishing preserves that start alongside the completion date. Going straight to
Done defaults the start to the selected finish date; both move together when
you edit the finish, until you explicitly edit the start. Adding past readings
uses this same default. Starting a reread records a new start and preserves all
earlier readings. History lets you edit both dates, with start no later than finish.
Older completed entries default their start to their existing finish. Older
In progress entries with no start stay unspecified until corrected or restarted.
The Reading history tab lets you edit dates or add past readings.
Reading actions sit beside the status selector, separate from series editing.
Recording a finished reading or changing an existing title to Done asks for
confirmation before recording today. Cancel keeps your status and dates intact.

SERIES AND SORTING
Numbered titles such as ReLIFE Cilt 1 and ReLIFE Cilt 2 group automatically.
Series and standalones have separate sections. Series remember their last
open/closed state in this browser and default open without a saved preference.
Volumes stay in numerical order; click the group header to collapse. The Collapse
all series / Expand all series button toggles groups in the current view. Correct the series
name/volume or mark a title standalone in its Overview. Existing-series dropdowns
in the add form and manual series editor let you reuse names without retyping.
Choosing a name in Existing series switches grouping to Set series myself,
even from automatic or standalone mode. Opening/cancelling the dropdown leaves
the mode unchanged. Use Save series to apply your choice. Each volume keeps its
own reading history and collection. Same-name custom series use a shared group
identity; existing split custom groups combine automatically on load/restore,
preserving records and reading history.
Sort by date added, title, author, status or most recently finished. Older
entries without added timestamps use their saved order.

SEARCH
Select Kitapyurdu, BKM Kitap, Open Library, Google Books or AniList.
Only the selected source is searched. Language filters apply where supported.
Original title wording is searched first; apostrophes such as DEHB'li stay
within the word when normalizing. Curly and straight apostrophes match.
Results are ranked against the original query; weak long-title matches trigger
normalized/shorter main-title searches on the same source and language.
Known wrong volume numbers are excluded.
Valid ISBN searches verify the identifier and bypass the language filter.
A catalog may omit a book from its search index even if its page still exists.
Paste its Kitapyurdu/BKM/Open Library/Google Books edition link into the same
search field to import that listing directly; select the result and save.
AniList provides manga series rather than translated print editions.
Internet access is needed for catalog searches and covers. Services may block
requests or enforce quotas. Google Books accepts an optional personal API key;
the key is remembered in a separate local browser setting, outside library
records and JSON backups. Clear the API-key field to forget it.
The browser connector and its dependent sources are inactive.

SAVING AND TRANSFERRING RECORDS
Use the same browser/profile and http://127.0.0.1:8765 each time.
Records stay in that browser. Clearing its storage removes them.
Back up exports all three collections, series settings and reading histories.
Restore replaces the current records after confirmation; back up first if needed.
To move records from the hosted app, Back up there, then Restore here.
This version does not sync devices or Kitapyurdu account lists.

SOURCE
src/index.html — interface, collections and browser storage
src/catalog.mjs — catalog search and metadata import
pc/server.mjs — local server
The repository's README.md has full development and source-access details.
