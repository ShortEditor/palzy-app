# Palzy Android 1.0

Android shell of https://github.com/ShortEditor/palzy at source commit 9c03cf36407fa6cb4479865cc477557df3790e34. Existing web repo and website are unchanged. Original React pages and CSS are reused, not redesigned.

- Package: com.example.palzy_app (the owner's existing Firebase Android registration).
- Version 1.0 / code 1, min SDK 23 (Android 6), target/compile 35, Capacitor 7, Java 21.
- Same Firebase project social-media-d84ea, same Auth users and Firestore collections, same Cloudinary unsigned upload settings. No new database, provider change, rules edit or migration.
- Native Google login obtains the device account token and passes it to the original Firebase JS auth session. User-supplied Android config has the matching package and release SHA-1.
- Same publisher signing key as Drift, separate package. Private keys/passwords are never in source.
- Native microphone runtime permission, Android back/minimize, speaker routing, image share/save chooser, window/keyboard insets. No camera, contacts, location or broad storage permissions.
- Native build omits PWA install prompt/service-worker cache. Assets are bundled locally, but data, authentication and media need internet.

## Build

```sh
npm ci
cp .env.example .env.local
npm run build:android
# Set JAVA_HOME, ANDROID_HOME, PALZY_KEYSTORE, PALZY_STORE_PASS, PALZY_KEY_PASS securely.
cd android
./gradlew assembleRelease bundleRelease --no-daemon
```

The example includes existing PUBLIC frontend Firebase/Cloudinary configuration recovered from the deployed web assets. It is not an admin credential. Firebase authorization depends on the existing rules and authentication, not hiding client config. Do not add private service-account keys or Cloudinary API secrets. google-services.json is the owner's client registration, not a service-account key. Native auth plugin v7 declares a Firebase JS 11 peer range while this source uses JS 12; `.npmrc` enables legacy peer resolution. Web production build and native compilation pass, but auth runtime still requires device testing.

Use the same private release key for later updates and increase versionCode. SHA-1: d7:b1:a1:75:52:b8:a3:9d:94:15:c5:8e:73:04:5a:6e:9d:eb:25:f2. APK is directly installable; AAB is for a possible later Play upload, not store approval.

## Feature parity and verification

| Feature | Web | Android |
| --- | --- | --- |
| UI/theme/forms/navigation | Original React UI | Same React/CSS; login pixels compared, Android system bars outside content |
| Email auth/password reset | Firebase JS | Same code/project/users, device sign-in not yet tested |
| Google auth | Popup | Native Google token -> same Firebase JS session; matching registration verified, device login pending |
| Feed/posts/likes/follows/stories/campus/profile/admin | Existing Firestore collections/rules | Original modules preserved, same project; no live test posts/edits made |
| Uploads | Cloudinary unsigned preset | Same cloud/preset, Android file picker; live upload pending |
| Calls | Foreground WebRTC + Firestore signalling | Same signalling; microphone prompt and native speaker routing, two-device call pending |
| Push/background ringing | Not a native background service | Not added; foreground listeners only; app suspension may stop incoming calls |
| Image exports | Browser download/Web Share | Android save/share chooser, not an automatic gallery save; UI reports this honestly |
| Saved login/theme | Browser storage | App WebView storage, separate session from browser; same account/data after login |
| PWA install/cache | Browser feature | Not applicable; native app bundles UI locally |

Public login/signup screenshots inspected. At 393px width, settled login screenshots have identical 393x951 geometry with only six pixels above a 10/255 difference threshold. No horizontal overflow. This is a desktop browser harness, not Android device proof. Authenticated feed pages are preserved in source but not visually checked with a real account in this build. No Android device/emulator test, actual sign-in, upload, data mutation or voice call completed. Owner testing is required before claiming full runtime parity.

Build and seven config/wiring tests pass; lint has zero errors and 26 warnings, mostly inherited unused variables. These checks are not a security audit. APK signature verifies integrity/publisher identity, not safety or Play Protect approval. Do not disable Play Protect to install.

Release integrity:
- APK SHA256: 6347b631de68b932728aacb6a98281f901e26d789a36ae76b8b28ea63a4f2618
- AAB SHA256: 5bc1b90bc8815d32a639976c9c8b1e055bb27bbfb894b5d1e0917067afb5871d
- Same certificate SHA256: 84cf73cb658fb36ee9488192b71f9fd8a1b5ade8446fe126d5d5719adce56a8b
- APK v1/v2 verification passes. AAB jarsigner verifies with self-signed/no-timestamp/JAR metadata warnings; not a store submission.

The web and Android Firebase client API keys differ, as expected for separately registered clients; both configs identify the same project number/ID. The web JS uses the original web key and native Google uses the supplied Android key. Client API keys are not server credentials.
