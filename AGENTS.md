# Repository instructions

## Publishing source updates

For maintained project updates, push every source update to both `github`
(the private repository) and `public` (the public repository). Ensure both
remotes are configured before publishing. Push the same commit to each. Verify both branch heads before
reporting an update complete. If either push is blocked, report which copy is
pending and finish synchronizing it when access becomes available.

Use the checkout's neutral contributor identity for commits. Do not merge or
push commits from the history that existed before the privacy cleanup.

Both repositories contain public-safe application source. Keep deployment
identity, credentials, personal library exports and machine-specific setup
outside tracked files. Respect `.gitignore`; generated distribution files are
built locally instead of committed.

## Archived connector

Keep `archive/browser-connector/` and its tests preserved but inactive. Do not
reactivate, package or run the archived connector or its disabled tests unless
explicitly requested. Run the active checks with `npm test`.

## Interface

Preserve the approved rounded, flat design in both Dark Ink and Paper Grove.
Use solid color tokens, without gradients, bevels or shadows. Themes share the
same functions and charts. Keep appearance/chart-scope preferences separate
from book records; they are browser-local until device syncing is implemented.
Never replace actual library counts or chart values with illustrative data.

## Windows app

Keep the browser version and standalone desktop version available, sharing
`src/` for interface and catalog behavior. The desktop app has a separate local
profile and no sync, pairing or account connection until explicitly requested.
Keep Node integration disabled in the renderer and use the narrow app protocol
for catalog calls. Do not expose filesystem access to page scripts.
Build an installer and attach it to matching releases when shipping desktop
updates; keep generated binaries outside Git. Preserve local user data during
upgrades and uninstall. Report Windows-runtime testing limits accurately.

Windows Actions builds run automatically for Windows-related changes on public
main. Request explicit approval before manually dispatching a run or changing
the automatic triggers. Publishing requires an explicit manual run with Publish
enabled. The private mirror does not run build jobs.
For local Windows completion, read `desktop/HANDOVER.md`.
