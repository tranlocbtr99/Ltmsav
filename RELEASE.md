# Safe Android updates

The release target is generated in `mobile/android` from the locked Capacitor dependencies. Keep `com.ltmsav.app`, web origin and the original signing certificate unchanged to retain installed application data.

## Required repository Actions secrets
- ANDROID_KEYSTORE_BASE64: ORIGINAL keystore encoded as base64.
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

Never post these values in issues, PRs, chat or source. The old workflow generated a fresh key each run; its password does not recover a lost key. If the original key is unavailable, do not instruct the user to uninstall the app. Export and verify a user backup before planning any alternate migration. This change deliberately fails release without a fixed key.

## Version generation
CI sets both UI and Android versions from the same script: `versionCode = 10000 + GITHUB_RUN_NUMBER * 100 + GITHUB_RUN_ATTEMPT`; name `1.9.<code minus 10000>`. Reruns receive a greater code, including reruns with otherwise identical source. Keep this workflow identity/run counter: renaming the file or resetting its run numbering requires a larger baseline. Confirm the installed versionCode is below the generated code before the first upgrade. Rebuilding an old run after a newer release is not a new release and may produce an older code; use a new run on main.

## Validation and release gates
`validate` runs type checks, regression tests and web build on PR/push. Android runs only for main/manual dispatch after validation. It generates the project, applies native biometric plugin, versions web/Android together, builds APK/AAB, signs with the fixed keystore, verifies signatures and uploads artifacts. Errors are fatal; no `|| true`, no debug fallback labeled release.

Before distributing the first fixed build, compare old/new APK signing SHA-256 and applicationId, install over the previous APK on a test phone, and compare all account balances, transactions, debts, budgets, settings and PIN. Export a JSON backup first. Do not promise continuity solely from CI success.

The root `android/` native prototype and zipped historical sources are retained for reference only. Do not package them as the updated application.
