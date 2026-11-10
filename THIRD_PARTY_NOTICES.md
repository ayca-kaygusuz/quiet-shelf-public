# Third-party notices

Quiet Shelf's Apache-2.0 license applies to its original project material.
It does not replace the licenses, copyrights or terms of third-party material.

## Manrope font

Copyright 2018 The Manrope Project Authors
(https://github.com/googlefonts/manrope).

The bundled Manrope font is licensed under the SIL Open Font License 1.1.
The complete copyright and license text is retained in assets/Manrope-OFL.txt
and is available in the app's Account → About Quiet Shelf section. Android
packages retain the same text in their assets.

## Windows and Linux runtime

Electron is provided by Electron contributors under the MIT license. Chromium,
Node.js and their dependencies retain their own licenses. The Windows and Linux packages
keep Electron's LICENSE.electron.txt and LICENSES.chromium.html alongside the
runtime; these notices must remain with redistributed runtime files.

Electron source and licensing: https://github.com/electron/electron
Node.js source and licensing: https://github.com/nodejs/node

## Android runtime libraries

AndroidX is provided by its respective authors under Apache License 2.0.

The Android compatibility runtime desugar_jdk_libs 2.1.5 includes OpenJDK code
under GPL version 2 with the Classpath Exception; it is not Apache-licensed.
The exception permits linking independent modules under their own licenses.
Quiet Shelf's original code remains Apache-2.0. Retained upstream texts are:

- assets/licenses/desugar-jdk-LICENSE.txt
- assets/licenses/desugar-jdk-ASSEMBLY_EXCEPTION.txt
- assets/licenses/desugar-jdk-ADDITIONAL_LICENSE_INFO.txt

Android releases provide desugar_jdk_libs-2.1.5-source.zip beside the APK,
containing the upstream version-2.1.5 source snapshot and build files from
revision 73170c345e6a762fc6a1f0301bb15218850023ef. The source is also available at
https://github.com/google/desugar_jdk_libs/tree/73170c345e6a762fc6a1f0301bb15218850023ef
The original upstream license/notices are retained in the Android assets and
shown in the app's third-party notices. Modified redistributions must also
satisfy applicable upstream source-distribution obligations.

Google Play services SDK components remain subject
to their applicable Google SDK/API terms. They are not relicensed by Quiet Shelf.
Retain upstream notices supplied with those components.

AndroidX licensing: https://source.android.com/docs/setup/about/licenses
Desugaring source: https://github.com/google/desugar_jdk_libs
Google Play services: https://developers.google.com/android/guides/overview
Google Play services POM license: Android Software Development Kit License
https://developer.android.com/studio/terms.html

## iPhone and iPad runtime libraries

Google Sign-In for iOS 10.1.0 and its resolved AppAuth, GTMAppAuth,
GTMSessionFetcher, App Check, GoogleUtilities and Interop dependencies retain
their upstream licenses. Xcode resolves pinned package revisions; the build
collects their original license/notice files and includes them in the iOS app's
offline Account → About → Third-party notices and build artifacts. They are not
relicensed as Quiet Shelf material. Swift runtime components retain their upstream
Apache-2.0 license with Runtime Library Exception; its full text from Swift
6.1.2 is kept in ios/licenses/swift-runtime-LICENSE.txt and the iOS distribution.
Apple system frameworks retain Apple terms.

Google Sign-In source and license: https://github.com/google/GoogleSignIn-iOS
AppAuth source and license: https://github.com/openid/AppAuth-iOS

## Build tools and outside catalogs

Development/build tools and their dependencies retain their upstream licenses.
Their presence in a development checkout does not make them Quiet Shelf code.
The Gradle wrapper's existing upstream copyright and license headers are kept.

Book covers, bibliographic records, retailer content and catalog services retain
their respective owners' rights and terms; retrieving them does not relicense
that material under Quiet Shelf's license. Personal libraries and credentials
are user data and are not part of the licensed project distribution.

German catalog integrations use public bibliographic/search interfaces:
DNB SRU (https://services.dnb.de/sru/dnb), K10plus SRU
(https://sru.k10plus.de/opac-de-627), Thalia (https://www.thalia.de) and
Hugendubel (https://www.hugendubel.de). Their catalog data, covers and site
content remain subject to their respective terms. Small public-record/parser
fixtures exercise compatibility; no storefront access tokens or user data are
included. Catalog metadata is not relicensed by the application license.

The LovelyBooks integration reads anonymous catalog search and edition data
from https://www.lovelybooks.de and covers from https://images.lovelybooks.de.
Its interface is not a documented public API. Book metadata and covers retain
their respective rights and terms; user reviews, ratings, profiles and account
libraries are not imported. Sanitized public metadata fixtures contain no
storefront tokens, affiliate templates or account data.
