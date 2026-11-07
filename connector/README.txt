QUIET SHELF BROWSER CONNECTOR

This connector reads public search results from the listed bookstores and returns
selectable titles to Quiet Shelf. It does not read PC files, send browser cookies
to Quiet Shelf, or run on unrelated websites. It briefly opens search tabs.
If a store requests a CAPTCHA, complete it yourself and retry the search.
It cannot guarantee access or stable page layouts at third-party stores.

EDGE / CHROME
1. Extract the ZIP inside your chosen connector folder.
2. Open edge://extensions or chrome://extensions.
3. Enable Developer mode, choose Load unpacked, select the extracted folder
   containing manifest.json.
4. Refresh http://127.0.0.1:8765. Quiet Shelf should show Browser connector connected.

FIREFOX
Use the Firefox package. Extract it in your chosen connector folder.
Open about:debugging#/runtime/this-firefox, choose Load Temporary Add-on,
and select manifest.json. Refresh Quiet Shelf.
Firefox temporary add-ons must be loaded again after Firefox restarts.

Use the same browser for the connector and Quiet Shelf.
No login to Quiet Shelf, paid service, or API key is needed for the connector.
Permissions are restricted to the local app and these named stores:
D&R, Idefix, and Amazon TR/US/UK/DE/JP.
