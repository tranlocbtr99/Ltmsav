# LTMsav release procedure

The supported Android application is the Capacitor project generated under
`mobile/android`. The older root `android/` Compose prototype is not the release
application. `release.json` is the version and certificate source of truth.

## Compatibility contract

- Application ID: `com.ltmsav.app`.
- Preserve Capacitor's `https://localhost` origin and the app's data directory.
- Use the existing LTMsav release key. Certificate SHA-256:
  `fd714dfb07beaaca658d99bdcab1982c964eeb3c24e1f66c0ab084ae14731ac7`.
- Previous verified APK: 1.9.1501, versionCode 11501, same certificate.
- Never uninstall, clear app data, reset storage, generate a replacement key,
  or use a debug signature to distribute an update.
- Schema 6 retains real records with historical demo IDs, all PINs and settings.
  Recovery of the existing `ltmsav_pending_write` journal occurs before startup.
  Migrations require a successful raw snapshot; transaction writes roll back on
  failure. Existing schema 6 data is not rewritten by startup.

## Verify and build

Use Node 22, JDK 21, Android SDK 35 / Build Tools 35.0.0, Python with Pillow 11.3.0.

```sh
npm ci
npm run lint
npm test
npm run build
npm --prefix mobile ci
node scripts/prepare-mobile.mjs
cd mobile/android
./gradlew lintRelease testReleaseUnitTest assembleRelease bundleRelease --no-daemon
```

From the repository root, provide `ANDROID_HOME`, `KEYSTORE_PATH`,
`KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` from secure local storage and run
`bash scripts/sign-release.sh`. No signing password or private key belongs in git.
The script verifies APK signature, alignment, application ID, version and
non-debuggable status. It checks the AAB certificate and generates SHA256SUMS.

## GitHub Actions

Pull requests and pushes to main run verification and unsigned Android builds
without signing credentials. Signing runs only on manual dispatch or version
tags, after verification, in the `android-release` environment. Neither step
publishes automatically to Google Play or GitHub Releases.

The repository owner must configure environment protection (trusted release
branches/tags and required reviewers) and these environment secrets:

- `LTMSAV_KEYSTORE_BASE64`: base64 of the existing key, never a new key.
- `LTMSAV_KEYSTORE_PASSWORD`
- `LTMSAV_KEY_ALIAS`
- `LTMSAV_KEY_PASSWORD`

A missing key, build failure, invalid artifact or certificate mismatch fails the
release. There is no debug/unsigned fallback and no `keytool -genkeypair`.
The signing job has read-only repository permissions and deletes its temporary key.

Before the next release, set previousVersionCode to the last distributed code,
increment versionCode and versionName in release.json, and commit that change.
For a device acceptance check, install using `adb install -r` over 1.9.1501 and
confirm balances, transactions, debts, budgets and PIN remain unchanged. Never
use `adb uninstall` as part of an upgrade test. Storage regression tests are not
a substitute for that device check.
