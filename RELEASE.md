# Safe Android updates — fixed signing key since 2026-10-24

The user explicitly authorized one new signing key and will back up/reimport data for this transition. The fixed private key is in the privately delivered `LTMsav_Signing_Kit_20261024.zip`. Its public fingerprint is recorded in `SIGNING_IDENTITY.json`. Do not create another key. APK 1.9.1301 (11301) is the first release signed with it.

The previous installed app may have a different certificate and cannot be updated in place with this first new-key APK. Before removing an old installation, the user must export and verify its JSON backup. Later releases must preserve the new identity and applicationId `com.ltmsav.app`.

## Required repository Actions secrets
- ANDROID_KEYSTORE_BASE64: fixed LTMsav_Signing_Kit_20261024.zip keystore encoded as base64.
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

Never post these values in issues, PRs, chat or source. The old workflow generated a fresh key each run; its password does not recover a lost key. If the original key is unavailable, do not instruct the user to uninstall the app. Export and verify a user backup before planning any alternate migration. Without CI signing secrets, the workflow compiles clearly labeled unsigned APK/AAB plus apksigner.jar for private local signing. These unsigned files are not installable releases. Sign with the saved key, verify against SIGNING_IDENTITY.json, and only then deliver the signed APK. Never upload the key/password to the public repository.

## Version generation
CI sets both UI and Android versions from the same script: `versionCode = 10000 + GITHUB_RUN_NUMBER * 100 + GITHUB_RUN_ATTEMPT`; name `1.9.<code minus 10000>`. Reruns receive a greater code, including reruns with otherwise identical source. Keep this workflow identity/run counter: renaming the file or resetting its run numbering requires a larger baseline. Confirm the installed versionCode is below the generated code before the first upgrade. Rebuilding an old run after a newer release is not a new release and may produce an older code; use a new run on main.

## Validation and release gates
`validate` runs type checks, regression tests and web build on PR/push. Android runs only for main/release branches/manual dispatch after validation. It generates the project, applies native biometric plugin, versions web/Android together, builds APK/AAB, signs with the fixed keystore, verifies signatures and uploads artifacts. Errors are fatal; no `|| true`, no debug fallback labeled release.

Before distributing the first fixed build, compare old/new APK signing SHA-256 and applicationId, install over the previous APK on a test phone, and compare all account balances, transactions, debts, budgets, settings and PIN. Export a JSON backup first. Do not promise continuity solely from CI success.

The root `android/` native prototype and zipped historical sources are retained for reference only. Do not package them as the updated application.
