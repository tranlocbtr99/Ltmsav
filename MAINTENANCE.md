# LTMsav maintenance handoff

## Current implementation
- Baseline inspected: `0493c02` / previous CI version 1.5.11; APK 1.8.2 mentioned in prior work is NOT proven to be present in this repository.
- Source dev version: 1.9.0-dev; schema 6 (non-destructive replacement for legacy demo-ID cleanup).
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
1. Recurring bills and due-date reminders, with opt-in permissions and no duplicate transactions.
2. Savings goals and monthly cash-flow forecast based only on recorded data.
3. Bank statement CSV import with preview, duplicate matching and reversible batch import.
4. Encrypted user-controlled cloud backups and recovery-key flow.
5. An integrity dashboard showing orphan links and mismatched history, offering previewed repairs.
6. Proper credential enrollment for web biometrics; secure PIN storage with backward-compatible migration.

## Next-session retrieval
Read this file first. UI → APP_MAP table; money/restore → storage.ts + storage tests; AI → aiParser.ts + parser tests; releases → RELEASE.md + workflow/version script. Update this handoff at the end, without claiming more coverage than was run.
