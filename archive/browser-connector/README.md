# Browser connector — archived, inactive

Preserved at the user's request. This directory is repository-only: it is not
imported, served, packaged into downloads, or included in active test runs.

`snapshot/` preserves the last connector implementation before it was archived:
extension sources and manifests,
Chrome/Firefox packages, bridge UI, local download routes, and packaging code.
The two connector tests are preserved byte-for-byte as `.cjs.disabled` files,
outside the active test directory. They must remain inactive until requested.

## Reactivate when explicitly requested

From the repository root:

```
git apply --check archive/browser-connector/reactivate.patch
git apply archive/browser-connector/reactivate.patch
```

The patch restores the exact previous connector implementation and both tests
to their active paths, including source choices, browser bridge, download
routes and build packaging. It does not restore or change user reading data.
Do not run the tests or enable the extension merely to inspect this archive.

If the check fails after later app edits, merge the connector portions from the
snapshot into the current UI, server and build script; do not force replacement
of newer application changes. Rename/copy the preserved test files back to
`tests/browser-import.cjs` and `tests/connector.cjs` only on reactivation.
Then rebuild and run appropriate active tests. The previous implementation
had passed simulated integration tests; live browser retrieval from every
third-party store was not verified.
