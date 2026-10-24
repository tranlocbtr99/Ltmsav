# LTMsav maintenance handoff

## Current implementation
- Baseline inspected: `0493c02` / previous CI version 1.5.11; APK 1.8.2 mentioned in prior work is NOT proven to be present in this repository.
- Source dev version: 1.9.0-dev; schema 7 (non-destructive replacement for legacy demo-ID cleanup).
- Canonical architecture: React 19 / localStorage / Vite PWA / Capacitor 7; Express provides optional Gemini endpoint.
- `npm run check`: TypeScript + regression tests + production web build. Capacitor sync and version generation were also checked locally; Gradle APK signing has not been run.
- No production credentials, signing key, installed APK certificate or real-user backup was available in this checkout.

## Changed contracts
- Transactions validate integer positive amount, existing source, distinct existing transfer destination (explicit from/to ignores account list ordering), calendar date and balance policy.
- Account/history writes use rollback journal `ltmsav_pending_write`, recovered at startup. UUIDs replace millisecond IDs.
- Historical demo IDs and PIN 1234 are preserved; a snapshot is required before migration. No schema reset on release.
- Restore validates shape, IDs, numeric values and future schema before mutation. Snapshot restore uses the same path.
- Linked accounts cannot be deleted; use balance adjustment for corrections.
- AI missing amount/destination asks for clarification; it cannot invent 50,000 VND or silently use the first account at execution.
- AI multi-command messages track confirmation per command and block repeated execution in the current chat.
- Local dates follow the device timezone. CSV export protects formula-like text and includes UTF-8 BOM.
- Biometric unlock is native-only until web credentials have an explicit enrollment/binding flow; web uses PIN. App locks on background when security is enabled.
- Add/edit dialog hook ordering is fixed. AI/settings/reports load lazily. Dynamic icons import only selectable built-in names (unknown legacy names fall back to HelpCircle; stored values are preserved).

## Evidence and limits
- Regression coverage: money conservation after add/edit/delete, invalid transfer/balance, quota rollback, interrupted write recovery, malformed backup, legacy migration/PIN, failed snapshot, unique IDs, dialog reopen, parser amounts, CSV and local calendar.
- Initial main JS ~1,242 kB → ~414 kB minified; gzip ~270 kB → ~115 kB. These are build measurements, not device timing claims.
- Android packaging/signing requires original release key and SDK/Gradle validation. Physical upgrade test still required with current installed APK and a copy of its data.
- localStorage rollback protects this app's synchronous write flows; it does not provide multi-tab database transactions, OS uninstall recovery, cloud backup or encryption at rest.
- Debt ledger remains separate from cash transactions (existing behavior). Automatic linking requires a deliberate schema/data reconciliation design; do not retroactively recalculate balances.

## Suggested next features (not implemented)
1. OS due-date notifications for monthly schedules (automatic monthly posting is now implemented).
2. Savings goals and monthly cash-flow forecast based only on recorded data.
3. Bank statement CSV import with preview, duplicate matching and reversible batch import.
4. Encrypted user-controlled cloud backups and recovery-key flow.
5. An integrity dashboard showing orphan links and mismatched history, offering previewed repairs.
6. Proper credential enrollment for web biometrics; secure PIN storage with backward-compatible migration.

## Next-session retrieval
Read this file first. UI → APP_MAP table; money/restore → storage.ts + storage tests; AI → aiParser.ts + parser tests; releases → RELEASE.md + workflow/version script. Update this handoff at the end, without claiming more coverage than was run.

## Signing identity change authorized 2026-10-24
User explicitly requested a new permanent private signing key and will handle the one-time backup/reinstallation. This overrides the original-key-only rule for this transition. A new RSA-4096 key was generated once and delivered privately as LTMsav_Signing_Kit_20261024.zip; no private key/password belongs in git. Keep this identity for future releases. CI may build explicitly unsigned packages for local signing when repository secrets are absent; unsigned packages are never described as installable releases.

## Verified release 2026-10-24
- APK: LTMsav_1.9.1301.apk, versionCode 11301, package com.ltmsav.app; built from f11c6ccfaf0affe6d2e8852d931ad6177749e589.
- GitHub Actions run 40071749267 passed validation and Android APK/AAB compilation.
- APK was signed privately with the fixed key above. apksigner verified v1/v2/v3; certificate matched the delivered keystore certificate. APK manifest and bundled UI both report 1.9.1301.
- APK SHA-256: fca6cc6d51a69abb35e51c46e02c7f8a84bef4558350fc92cfd49d93b4d3ea16
- Signing certificate SHA-256: fd714dfb07beaaca658d99bdcab1982c964eeb3c24e1f66c0ab084ae14731ac7
- APK and private signing kit were delivered privately as downloadable files. No phone install/restore test was performed.
- Future releases: retrieve the exact existing key kit; do not generate another key. GitHub signing secrets are not configured by this delivery. Without them CI deliberately produces unsigned artifacts for private signing.

## Liquid Glass UI refresh (2026-10-24)
- Design entry points: `src/index.css` (ios-* tokens/surfaces), Navigation.tsx (floating dock/header), OverviewTab.tsx (large title/balance), SplashScreen.tsx.
- Authoritative logo source: `assets/logo-source.svg` (editable minimal L/wallet); update_logo.py renders via CairoSVG + Pillow. CI regenerates all web/PWA/Android icons from this SVG. The previous PNG master is historical only.
- Added VI/EN keys: mainNavigation, newTransaction.
- UI-only changes: schema 6 and all storage keys/contracts are unchanged; reuse SIGNING_IDENTITY.json key. No reset/migration added.
- Browser QA: scripts/visual-qa.mjs uses synthetic data, light/dark screenshots, tab navigation, runtime-error checks and ledger preservation. CI downloads browser; local browser download was unavailable.

## Verified Liquid Glass release 1.9.1501
- Built from 8362f7476757714a05e962054fe06692f106d986; GitHub Actions 40073254236 passed 18 tests, web build, Chromium UI QA and Android APK/AAB build.
- Browser QA passed all five tabs, settings and add dialog in light/dark at 390x844; also checked 320x740 with no horizontal overflow. Synthetic account/transaction storage remained byte-identical during navigation. Screenshots inspected; compact balance hero and readable dark settings verified.
- APK versionName 1.9.1501, versionCode 11501, package com.ltmsav.app. New bundled logo matches generated SVG assets; bundled UI version matches manifest. Signed with the existing 2026-10-24 key (same as 1.9.1301); apksigner v1/v2/v3 verification passed.
- SHA-256 d6488730b41f62bcf518cd321a8e288e83de935258573f6ee7b2ce14679cf170. APK delivered privately as LTMsav_1.9.1501.apk. No physical-phone installation test was performed.
- UI only: storage.ts, schema and data contracts were not changed. For next UI edits start with ios-* tokens in index.css and run visual-qa.mjs in CI; do not regenerate the signing key.

## Monthly recurring transactions
- Entry: Transactions → Recurring, managed by RecurringTransactionsTab.tsx (lazy), with App.tsx state/handlers.
- Schema 7 only adds `ltmsav_recurring_v1` after a required snapshot. Existing ledger/settings/PIN keys remain byte-identical in migration. New backup/snapshots include `recurringTransactions`. Legacy backup import preserves local definitions but pauses them.
- `recurrence.ts` handles calendar-month arithmetic and last-day clamping while retaining desired day 1–31.
- Each rule stores nextDueDate + lastProcessedMonth. Generated transactions use deterministic rule/month IDs and recurringRuleId/recurringMonth metadata. Balances, history, cursor and audit commit in one rollback journal transaction. Deleting a generated transaction does not recreate that occurrence; deleting a rule preserves history.
- Scheduler runs on app open/unlock, foreground return and every 60 seconds while visible. It catches up due months; no background service, OS notifications or bank integration. Expenses with insufficient funds remain due. Resuming a paused schedule skips paused months. Web Locks serialize scheduler runs where available.
- Tests: recurring.test.ts covers clamping/leap/year boundaries, catch-up/idempotency, insufficiency/retry, pause/resume, deletion/edit behavior, journal failure, backup and schema 6 migration. Browser QA creates a due rule, verifies one debit and pauses it in both themes at 320px.
- Future change scope: types.ts, recurrence.ts, storage.ts, RecurringTransactionsTab.tsx, App.tsx and corresponding translations/tests. Reuse existing signing key.

## Verified recurring release 1.9.1801
- Source 2b331b7a0d865d44c4f1e7c4894fae7082eb7ce5, Actions run 40077101722. All 29 tests, TypeScript, web build, browser QA and Android build passed.
- Browser QA uses HTTPS to match production secure-context APIs; recurring editor uses a document-body portal above navigation. Verified create → one due posting → pause in both themes at 320px, no runtime errors; screenshots inspected.
- Migration from schema6 snapshots first and adds only the new recurring key. Existing balances/history/settings/PIN raw values were verified unchanged during migration; backup/restore includes definitions and monthly cursors.
- APK LTMsav_1.9.1801.apk, versionCode11801, package com.ltmsav.app. Existing fixed certificate fd714dfb07beaaca658d99bdcab1982c964eeb3c24e1f66c0ab084ae14731ac7 verified with apksigner v1/v2/v3. Bundled UI version and recurring chunk verified.
- APK SHA256 296164bbbde69b7870fd0514bfc04d8d12a05b4a9aa3e52d7b17760b265551a5; delivered privately. No physical-phone installation test.
