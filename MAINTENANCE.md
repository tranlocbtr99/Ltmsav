# LTMsav maintenance handoff

## Current implementation
- Baseline inspected: `0493c02` / previous CI version 1.5.11; APK 1.8.2 mentioned in prior work is NOT proven to be present in this repository.
- Source dev version: 1.9.0-dev; schema 8 (additive forecast/reminder preferences; non-destructive replacement for legacy demo-ID cleanup).
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
2. Savings goals; spending forecasts for calendar month/quarter/year are now implemented.
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


## AI recognition and calendar spending forecasts (2026-10-24)
- `forecast.ts` is the shared read-only model for Reports, Overview and local AI queries. Mean of up to 6 completed calendar months, including zero months since first expense; needs 2 months before estimating variable expenses. Current/future transactions, transfers and historical recurring postings excluded; enabled expense schedules added once per forecast month from nextDueDate, using last-day clamping. Paused schedules excluded. Periods mean next calendar month/quarter/year.
- Range is a scenario band (mean absolute deviation, floor ±20%), not a statistical confidence interval; no claimed predictive accuracy. Assumes complete logging and unchanged schedules. Short history displays schedule-only estimate. No storage/schema/identity changes.
- Reports entry added to Overview; supports light/dark and VI/EN. Queries for balance/current-month income, expenses and budgets/forecasts compute locally without transmitting ledger contents. No external model required for those queries.
- Offline recognizer accepts unaccented phrases, TCB/VCB/cash aliases, grouped/decimal/million shorthand amounts, yesterday/day before/tomorrow and explicit dates. Ambiguous accounts, multi-amount messages, negations and recurring requests clarify instead of posting. Remote command output now validates account/category/date/currency/amount before confirmation. Unsupported historical chat report periods ask user to use Reports.
- Chat now scrolls its message container instead of the document, and fits available viewport space above the navigation. Browser checks ensure the chat header/input remain visible.
- Validation: 38 regression tests, TypeScript, production build passed locally. New browser QA covers report horizons at 320px and local AI read-only balance/forecast replies. CI/browser/Android results passed for the release below; no device test.


## Verified AI/forecast release 1.9.2201
- Source 4c314e4f3c272d58a7c37e93ba635eb0b5b40e30; Actions run 40080474168 completed successfully. All 38 tests, TypeScript, web build, browser checks and Android build passed.
- Light/dark 320px browser checks cover all forecast horizons, actual local balance/forecast answers, ledger preservation, recurring create/post-once/pause and visible chat heading/input. Stable screenshots inspected. Chat scroll stays inside message history.
- Signed APK LTMsav_1.9.2201.apk, versionCode12201, package com.ltmsav.app. Bundled UI version 1.9.2201 verified. Signing v1/v2/v3 passed with existing fixed certificate fd714dfb07beaaca658d99bdcab1982c964eeb3c24e1f66c0ab084ae14731ac7.
- APK SHA256 e3b5885cb6292ecdb2093aac323307bf5c579fcd9caecca902a724a28f44e4b8. Delivered privately. No schema/storage-key changes, no migration/reset; no physical-phone installation or real-model API test performed.


## Priority improvements after 1.9.2201
- AI: refunds/gifts map to other income rather than salary; category recognition scores specific words over generic purchase words. Existing transactions are never recategorized automatically.
- Undo: only the latest manually/AI-created transaction can be undone for 15 seconds. `undoCreatedTransaction` checks exact current record, rejects edited/recurring records and spent incoming money, and atomically reverses balances/history/audit while retaining unrelated writes. No bulk snapshot rollback.
- Cashflow: `cashflow.ts` projects enabled schedules over 90 days per account, including overdue occurrences. Expenses precede income on the same day (conservative); excludes unscheduled spending and assumed transfers. Read-only.
- Forecast: users mark fully recorded months in Reports (last36 months). Unconfirmed months are excluded, confirmed zero months count; at least 2 confirmed months required for variable estimate. Mean uses last6 confirmed; bounded/damped trend requires6 consecutive months; seasonal needs2 prior observations for the target calendar month. Trend/seasonal selected only after >=3 holdouts and >10% improvement in MAE against the baseline on identical targets. Historical MAE is not a future accuracy guarantee. UI/Overview/AI share this contract.
- Schema8: optional AppSettings.completeMonths / recurringReminders only. Migration snapshots first and changes only schema marker for schema7 data. Existing raw settings, PIN, balances, ledger, schedules are unchanged. Backup/restore validates new preferences. Legacy snapshots/backups remain supported.
- Android reminders: Settings opt-in + runtime POST_NOTIFICATIONS permission; custom NativeRemindersPlugin / ReminderReceiver / ReminderDates, registered in MainActivity. Generic notifications around9am due day use inexact AlarmManager PendingIntent; no background ledger writes. Persisted native schedule reschedules on boot/timezone/time/package replacement; per-rule delivered-month avoids bursts/duplicates. Force-stop requires reopening; OS may delay alarms. JS serializes sync and cancels paused/deleted/disabled rules. No new third-party dependency or exact-alarm permission.
- Native build: after Capacitor generation run `node scripts/configure-reminders.mjs`; CI does this and runs `node scripts/test-reminder-dates.mjs` under JDK21 before Android build. TypeScript/regression/web and browser/Android checks passed for release below. No real phone notification delivery test yet.


## Verified priority release 1.9.2401
- Source 6c4bc15975be351551e664dfc93e699edc906b3e, Actions run 40082304486. All48 regression tests, TypeScript, web build, browser light/dark QA and Android build passed; 7 native Java calendar reminder assertions passed under JDK21.
- Browser QA verifies complete-month selection persistence, all forecast horizons, local AI replies, exact ledger restoration after AI create→undo, recurring create→post-once→pause, no runtime errors/overflow at320px. Fixture seeds only once so reload checks retain original data/timestamps. Screenshots inspected.
- APK LTMsav_1.9.2401.apk, versionCode12401, package com.ltmsav.app. Bundled UI version/feature assets verified; DEX native plugin/receiver/calendar helper and merged manifest notification/boot permissions verified. Signed v1/v2/v3 with existing certificate fd714dfb07beaaca658d99bdcab1982c964eeb3c24e1f66c0ab084ae14731ac7.
- SHA256 16617e37575af031b9d8c4c162937d2bae257680fd1771088bb72f231feee3ca. Delivered privately. Schema7→8 raw-data/PIN preservation and invalid preference backup rejection covered by tests. No physical-phone upgrade, notification permission/delivery or reboot test performed.
- Next work beyond this priority release: savings goals, CSV statement import with duplicate preview, encrypted user-controlled backup and AI conversational corrections. Do not describe these as implemented.
