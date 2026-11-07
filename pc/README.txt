QUIET SHELF — PC VERSION

1. Install Node.js LTS (free) from https://nodejs.org if it is not installed.
2. Extract the entire ZIP to a folder. Do not run it inside the ZIP.
3. Windows: open pc/start-windows.bat.
   macOS: in Terminal run: node pc/server.mjs from the extracted folder.
   Linux: in Terminal run: node pc/server.mjs from the extracted folder.
4. Your browser opens http://127.0.0.1:8765.
   Keep the terminal window open while using Quiet Shelf.

Kitapyurdu searches go directly from your computer to Kitapyurdu.
No paid services, account, package installation, or cloud server needed.
An internet connection is required for searches and covers.
Kitapyurdu may still restrict a connection; this is not a guaranteed API.

MOVING YOUR EXISTING LIBRARY
On the hosted Quiet Shelf, click Back up.
On this local version, click Restore and choose that JSON file.
Restore replaces the current library; back it up first if needed.

SAVING
Use the same browser and http://127.0.0.1:8765 each time.
Records stay in that browser's local storage. Clearing browser data removes them.
Use Back up regularly. Closing the terminal does not erase your records.
This version does not sync devices.

SOURCE
src/index.html — interface
src/catalog.mjs — Kitapyurdu search and edition import
pc/server.mjs — local server (Node.js 22 or newer recommended)
