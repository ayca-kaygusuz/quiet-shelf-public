# Quiet Shelf

A personal reading tracker for books, manga and comics. It runs on your PC and
stores your library in your browser, with JSON backup and restore.

## Run locally

Install Node.js 22 or newer (24 LTS recommended), open a terminal in this folder,
and run:

```
node pc/server.mjs
```

Or use `pc/start-windows.bat`. The Windows launcher also supports a portable
`runtime/node.exe` inside this project, without a system-wide installation.
No npm dependencies need installing. The app opens http://127.0.0.1:8765.
Keep the terminal open while using it. Ctrl+C stops the server.

Use the same browser and address each time. Browser data is separate between
the local app and the hosted app. Use Back up / Restore to transfer records;
restore replaces the target library. Clearing browser storage erases records,
so keep backups. Git contains the application, not your personal reading data.

## Features

- Dashboard, searchable library, and title details with reading-history tabs.
- Unread / In progress / Done; new titles default to Unread. You can add a title
  in progress or done; Done starts with an editable completion date (today by default).
- Starting a reread preserves prior completion dates. Finishing appends a date.
- Editable completion dates, title deletion through overflow menus, sample cleanup.
- Manual entry, source selection, edition-language filters and metadata import.
- Browser-scoped storage, JSON export/import; device syncing is not implemented.

## Search sources and current limitations

Only the selected source is queried. No credentials are needed for ordinary
catalog searches. An optional Google Books key is sent to Google through the
server; it is not stored in the library or included in backups.

| Source | Behavior / current limitation |
| --- | --- |
| Kitapyurdu | Edition search/import; rejects the current hosted server with HTTP 403. Local searches have worked. |
| BKM Kitap | Edition search/import with language metadata; hosted requests have succeeded. |
| Open Library | International edition search/import with language filters; coverage varies. |
| Google Books | Volume search/import; shared unauthenticated quota has returned 429. Optional user API key supported. |
| AniList | Manga series records, not specific translated editions; API access has failed from the cloud environment. |

Third-party services can restrict access or change their responses. A deployment
success does not prove every source works. No Kitapyurdu account-list import or
bidirectional account sync is implemented.

## Active checks

```
npm test
```

Or `node scripts/check.mjs`. These checks exercise data persistence, rereads,
deletion, menu state, source selection, parser fixtures, routing, language
filters and API failures. They use fixtures/mocks rather than live services;
they do not substitute for browser testing or live source verification.

## Archived connector

`archive/browser-connector/` preserves the removed connector architecture,
original disabled tests, and reactivation instructions/patch. It is not loaded,
served, packaged or included in active checks. Do not reactivate it or its tests
unless explicitly requested. See its README for details and limitations.

## Build download packages and hosted worker

The local app needs no build step. Packaging requires Python 3 in addition to
Node.js. Run from the project root:

```
npm run build
```

This writes PC/update ZIPs into ignored `work/` and a generated Worker module
into `dist/server/index.js`. `src/` is the authoritative application source.
The `.openai/hosting.json` manifest identifies the existing private Sites
publication; it is hosting configuration, not a credential. Publishing is a
separate action and is not performed by the build command.
