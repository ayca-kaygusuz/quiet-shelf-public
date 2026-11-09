# Android

Quiet Shelf's Android app packages the shared `src/` interface, catalog, sync
model and release checks. It has its own private local storage and can connect
to the same Google Drive app-data folder as Windows/browser. Android 8+ and a
current Android System WebView are required. Google sign-in requires Google
Play services. No PC/server needs to stay open.

## Build

Use Java 21 and Android SDK 36, then run from the repository root:

```
npm test
npm run build:android
```

The pinned Gradle wrapper downloads a checksum-verified Gradle distribution.
The build prepares an explicit asset allowlist, creates a script-hashed CSP,
builds release/debug/test APKs, runs Android lint, and verifies signed APKs.
Output is under ignored `work/android/`. Unsigned packages are explicitly named
and are never eligible for production publication. The signed production file
is `Quiet-Shelf-Android-<version>.apk`.

## Google configuration and signing

Create an **Android** OAuth client in the same Google Cloud project as the
existing platform clients, registering `com.quietshelf.android` and the release
certificate's SHA-1. The Android AuthorizationClient uses that package and
certificate. Android does not use a client secret. Neither the Web/Desktop
client secret nor `QUIET_SHELF_GOOGLE_ANDROID_CLIENT_SECRET` is read by this build.
A public client ID can be supplied as `QUIET_SHELF_GOOGLE_ANDROID_CLIENT_ID` for
configuration validation; its value must stay outside tracked source.

The public repository's Actions secrets hold:

- `QUIET_SHELF_ANDROID_KEYSTORE_BASE64`: base64 of the existing release PKCS12 key.
- `QUIET_SHELF_ANDROID_KEYSTORE_PASSWORD`: its password; the key alias is `quiet-shelf`.

Store each setup value in its own private plaintext file, with no quotes or JSON
syntax. Never commit or publish those files, the private keystore or password.
Keep an independent secure backup of the key: replacing it prevents ordinary
APK upgrades. Do not generate a new release key during CI or on build failure.
The published signing-certificate text contains public fingerprints only.

`node scripts/build-android.mjs --release` requires signing configuration and
fails before publishing an unsigned APK. Android CI runs on free public runners
only. Test first with Publish off; a later Publish run can reuse the successful
run ID only when its workflow and exact source commit match. It verifies hashes
and attaches the APK to the already matching Windows/browser release. It never
replaces an existing APK with different bytes for the same version.

## Native boundaries

The app loads signed local assets at `https://appassets.androidplatform.net/`.
It exposes only an origin-bound, main-frame WebMessage adapter. File/content
URL access, mixed content, WebView media/location permissions and arbitrary
navigation are disabled. The app declares network permissions only; the system
document picker grants access to the JSON file the user selects.

Search HTTP uses a bounded native allowlist to avoid browser CORS restrictions,
with redirects handled explicitly. Google Books keys go only to the Books API.
Drive access tokens stay native/in memory; renderer requests use a non-secret
marker and the expected account ID. Silent renewal verifies Google's userinfo
subject before using the token. Account changes invalidate the binding and
sign-out clears local connection state without deleting Drive files.

First connection previews Drive read-only and keeps the visible shelf. The
shared explicit combine/use-Drive choice and recovery copies apply on Android.
Credentials, network policy and Google Books keys are excluded from sync/backup
content. Android cloud backup is disabled; export/Drive are explicit choices.

## Verification

`npm test` checks the Android adapter, native credential marker, account-ID
binding, read-only previews, shared catalog behavior, saved settings and CSP.
Android lint checks the native project. The emulator instrumentation test adds
a title, records reading dates, exercises the phone details panel/Back action,
switches all six themes, checks backup payloads and preference/record retention
through Activity recreation, probes the real native bridge, and checks denied
hosts/permissions. CI captures real Android screenshots and test reports.

Real Google consent, account switching across two physical devices, and the
system backup/restore pickers still need interactive device verification. Do
not describe them as verified by the emulator or mock-provider tests.


Read next uses the same on-device engine as Windows/browser and is never
scheduled. Its current checklist and cached edition information use the shared
backup/Drive model. Blackwell’s and Better World Books use the native HTTP
allowlist, with no connector or retailer account.
