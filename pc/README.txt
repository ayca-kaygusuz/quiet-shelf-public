QUIET SHELF — PC VERSION 0.7.0

START
Use Node.js 22 or newer (24 LTS recommended).
Extract the entire ZIP before running it.
Windows: open pc/start-windows.bat. It uses runtime/node.exe inside the project
if present, otherwise Node.js on PATH. The runtime is not included in this ZIP.
macOS/Linux: run node pc/server.mjs from the extracted project folder.

Open http://127.0.0.1:8765 and keep the terminal window open while using it.
Press Ctrl+C to stop. After updating files, restart and refresh the browser.

COLLECTIONS AND READING HISTORY
My library holds titles currently yours. Reading archive holds titles no longer
owned or borrowed. Use Keep this title in when adding a title or in its Overview
to move it between collections in either direction. Status and completion dates
are preserved. The main library excludes archived titles from its list/counts.

New titles default to Unread. You can also add them In progress or Done.
Done defaults to today's completion date; earlier dates can be entered.
Starting a reread preserves history; finishing adds another completion date.
The Reading history tab lets you edit dates or add past readings.

SEARCH
Select Kitapyurdu, BKM Kitap, Open Library, Google Books or AniList.
Only the selected source is searched. Language filters apply where supported.
AniList provides manga series rather than translated print editions.
Internet access is needed for catalog searches and covers. Services may block
requests or enforce quotas. Google Books accepts an optional personal API key;
the key is not saved and must currently be re-entered each Add title session.
The browser connector and its dependent sources are inactive.

SAVING AND TRANSFERRING RECORDS
Use the same browser/profile and http://127.0.0.1:8765 each time.
Records stay in that browser. Clearing its storage removes them.
Back up exports both collections and reading histories to JSON.
Restore replaces the current records after confirmation; back up first if needed.
To move records from the hosted app, Back up there, then Restore here.
This version does not sync devices or Kitapyurdu account lists.

SOURCE
src/index.html — interface, collections and browser storage
src/catalog.mjs — catalog search and metadata import
pc/server.mjs — local server
The repository's README.md has full development and source-access details.
