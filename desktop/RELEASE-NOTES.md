Quiet Shelf 0.21.1 fixes missing covers and mixed Arabic/Roman series grouping across browser, Windows, Linux, Android and iPhone/iPad.

- Open Library uses recorded edition cover IDs. Editions without cover metadata show the normal title placeholder rather than a guessed image URL.
- Failed images fall back to the same placeholder in the library, details and catalog results. This also handles old saved cover URLs; no re-adding or library migration is needed.
- Automatic series grouping recognizes canonical Roman volume numbers. Erşan Kuneri - Senaryo 1 and 2 now group with Erşan Kuneri Senaryo III and IV. Language separation and manual/standalone overrides remain intact.
- Shared library, reading history, backup and Google Drive formats are unchanged. All maintained platform packages are rebuilt from the same source.

Validation includes the active regression suite, recorded/missing Open Library cover metadata, legacy saved image failures, real browser/native DOM fallback and mixed numeral grouping. Native release workflows check Windows/browser startup and installed updates, Linux startup/keyring/profile persistence, Android emulator behavior, and iPhone/iPad Simulator layouts. Physical-device installation and interactive Google consent remain separate checks.

Original project material remains Apache-2.0, credited to Alex (Ayca Kaygusuz). Third-party notices and the pinned Android compatibility runtime source remain included.
