# APP_MAP — LTMsav (calm-kepler)
> **QUY TẮC DÙNG FILE NÀY**: khi user yêu cầu cập nhật tính năng → đọc file này trước (≈150 dòng), KHÔNG đọc cả app. Chỉ mở đúng 1–3 file liên quan được liệt kê ở mục "Chạm vào đâu". Sau khi sửa app mà cấu trúc thay đổi (file mới, tab mới, key mới) → cập nhật luôn file này.

## 1. App là gì
App chi tiêu cá nhân **LTMsav** (tên cũ Finflow), offline-first, chạy cả 3 dạng: PWA web + Express server + Android (Capacitor 7). React 19 + Vite 6 + Tailwind v4 + TypeScript, không thư viện state/router/chart nào — state phẳng trong `App.tsx`, biểu đồ tự vẽ SVG/div, i18n tự viết.

- Repo: `/home/loctm/Desktop/antigravity/calm-kepler` (git, nhánh main)
- Version app hiển thị: `APP_VERSION` trong `SettingsTab.tsx` (đang `1.5.9`); version Android: `mobile/android/app/build.gradle`
- Dev: `npm run dev` (tsx server.ts, cổng 3000 — vừa serve Vite vừa API). `npm run lint` = `tsc --noEmit`. **Không có test.**

## 2. Kiến trúc dữ liệu (đọc kỹ trước khi thêm field)
Tất cả nằm trên `localStorage`, khóa tiền tố `ltmsav_*` (legacy `finflow_*` được tự migrate). Singleton `storage` trong `src/services/storage.ts`, `SCHEMA_VERSION = 5` ở đầu file.

| Khóa localStorage | Type (`src/types.ts`) | Ghi chú |
|---|---|---|
| `ltmsav_accounts_v1` | `Account` | Ví tiền/thẻ; `applyBalanceChange` tự cộng trừ số dư khi thêm/sửa/xóa giao dịch |
| `ltmsav_categories_v1` | `Category` | 12 danh mục seed `isDefault`; type `expense\|income` |
| `ltmsav_transactions_v1` | `Transaction` | type `expense\|income\|transfer\|lend\|debt_repay` |
| `ltmsav_budgets_v1` | `Budget` | 1 ngân sách/tháng/danh mục |
| `ltmsav_debts_v1` | `DebtOrLoan` | `loan` (cho vay) / `debt` (nợ), có `remainingAmount` |
| `ltmsav_audit_logs_v1` | `AuditLog` | tự ghi bởi storage, tối đa 200 bản |
| `ltmsav_settings_v1` | `AppSettings` | theme, PIN, `geminiApiKey`, `customServerUrl`, currency… |
| `ltmsav_auto_snapshots_v1` | — | snapshot tự động, giữ 5 bản |
| `ltmsav_language` | `'vi'\|'en'` | i18n |

**Bất biến**: thêm/thay đổi field ⇒ tăng `SCHEMA_VERSION` + migrate trong `runDataMigration()` (luôn `createAutomaticSnapshot()` trước). Không bao giờ `localStorage.clear()` ngoài flow "Xóa toàn bộ dữ liệu". Xem `DATA_SAFETY_RULES.md` + `AGENTS.md`.

## 3. Sơ đồ file src/ (~7k dòng, 23 file)
```
src/main.tsx                     mount <LanguageProvider><App/></LanguageProvider>
src/App.tsx          (343)       ★ TRUNG TÂM: state của MỌI tab + handlers gọi storage
src/types.ts         (106)       toàn bộ type; thêm entity mới ở đây
src/index.css        (200)       Tailwind v4 @import + utility custom (glass-panel, pt-safe…)
src/contexts/LanguageContext.tsx (845)  bản dịch vi/en, object PHẲNG ~360 key
src/services/storage.ts (613)    CRUD + migration + backup/snapshot/audit
src/services/aiParser.ts (307)   pipeline AI (xem mục 5)
src/services/biometric.ts (107)  Capacitor NativeBiometric → fallback WebAuthn
src/hooks/usePWA.ts   (83)       usePWAInstall(), useOnlineStatus()
src/components/Navigation.tsx (177) TopHeader + BottomNavBar (5 tab + nút AI giữa)
src/components/OverviewTab.tsx (594)      ★ tab 'overview'
src/components/TransactionsTab.tsx (322)  ★ tab 'transactions'
src/components/BudgetsTab.tsx (274)       ★ tab 'budgets'
src/components/AssetsTab.tsx (719)        ★ tab 'assets' (3 sub-tab)
src/components/ReportsTab.tsx (231)       ★ tab 'reports' (chỉ vào được qua header/overview)
src/components/AiChatTab.tsx (342)        ★ tab 'ai'
src/components/SettingsTab.tsx (746)      ★ tab 'settings'
src/components/AddTransactionModal.tsx (341)   modal giao dịch mới
src/components/EditTransactionModal.tsx (417)  modal sửa/xóa (giữ song song với Add!)
src/components/SecurityLockScreen.tsx (216) keypad PIN + vân tay
src/components/SplashScreen.tsx (64)       2s
src/components/DynamicIcon.tsx (14)        icon theo tên (lucide)
```
Bên ngoài `src/`: `server.ts` (Express, `/api/chat`, serve `dist/`), `vite.config.ts` (PWA autoUpdate, port 3000), `scripts/update_logo.py`, `android/` + `mobile/` (Capacitor), `public/` (logo, PWA icons), docs (`AGENTS.md`, `DATA_SAFETY_RULES.md`, `PRIVACY_POLICY.md`, `GOOGLE_PLAY_DEPLOY_GUIDE.md`).

## 4.luồng dữ liệu UI → storage
`App.tsx` giữ `useState` cho accounts/categories/transactions/budgets/debts/auditLogs/settings + `currentTab`. Mọi handler (`handleAddTransaction`, `handleEditTransaction`, `handleDeleteTransaction`, `handleSetBudget`, `handleAddAccount`, `handleAdjustBalance`, `handleAddDebtOrLoan`, `handleRecordPayment`, backup/reset) gọi `storage.xxx()` rồi **`reloadData()`** rồi `showToast(t('key'))`.

⚠️ **Thêm tính năng có dữ liệu = 3 bước**: (1) type trong `types.ts` → (2) CRUD trong `storage.ts` → (3) state + handler trong `App.tsx` rồi truyền props xuống tab. Tab không tự đọc localStorage.

Tabs hiện có (key `currentTab`): `overview | transactions | ai | budgets | assets | reports | settings`. Nav dưới đáy chỉ hiện 4 (overview/transactions/budgets/assets) + nút AI giữa; `reports` vào qua Overview.

## 5. AI (AiChatTab + aiParser)
`processAiMessage(message, accounts, categories, settings?)` thử lần lượt, fail ở bước nào rơi xuống bước sau:
1. Backend riêng: `settings.customServerUrl` + `/api/chat` (timeout 8s)
2. `/api/chat` của `server.ts` (timeout 2.5s) — server dùng env `GEMINI_API_KEY`, model `gemini-2.5-flash`, JSON mode temp 0.1
3. Gọi thẳng Gemini REST với `settings.geminiApiKey`
4. **Parser rule-based offline** `parseVietnameseFinancialCommand()` — regex tiếng Việt (triệu/nghìn/k, tên tài khoản, từ khóa intent)

Kết quả `AiChatResponse`: `{ intent, needs_confirmation, clarification_question?, analysis, commands?: AiParsedCommand[] }`. Chat chỉ hiển thị "Bản xem trước", user bấm xác nhận → ghép `accountId`/`categoryId` theo TÊN → `onAddTransaction`. Quick-chip mẫu nằm ở key `aiQuickExample1..6`.

## 6. i18n (VI/EN)
- File duy nhất: `src/contexts/LanguageContext.tsx` — 2 object phẳng `vi` và `en` (KHÔNG nested, KHÔNG dùng thư viện).
- Thêm chuỗi: thêm key camelCase vào `vi` (bắt buộc) + `en` (nếu thiếu fallback về `vi`). Dùng `t('key')` hoặc `t('key', { name, count… })` với placeholder `{name}` trong chuỗi.
- Mọi component đều `const { t } = useLanguage()`.

## 7. Quy ước UI
- Light mode là bắt buộc phải đẹp: **không** `text-white` trên nền sáng. Tiêu đề `text-slate-900 dark:text-white`, phụ `text-slate-600 dark:text-slate-400`, border `border-slate-200 dark:border-slate-800`.
- Layout mobile-first, khung `max-w-3xl mx-auto`, tôn trọng safe-area (`pb-safe`/`pt-safe`), bottom-nav cố định.
- Icon: `lucide-react` qua `DynamicIcon name="Utensils"`. Accent chính: emerald; nút AI tím gradient.
- Toast tự hiện ở App.tsx (fixed, phía trên bottom nav), tự tắt sau 3s.

## 8. Checklist "cập nhật tính năng" nhanh
1. Xác định tab đích trong mục 3 → mở file đó (+ `App.tsx` nếu cần state).
2. Thêm chuỗi → `LanguageContext.tsx` (vi + en).
3. Có dữ liệu mới → `types.ts` → `storage.ts` (bump `SCHEMA_VERSION` nếu đổi cấu trúc) → handler + `reloadData()` ở `App.tsx`.
4. Chạy `npm run lint` (tsc) → sửa lỗi type.
5. Release Android thì đọc mục 9 + `AGENTS.md`.

## 9. Build & release Android
`npm run build` → copy `dist/` vào `mobile/dist` → `npx cap sync android` → Gradle `assembleRelease bundleRelease` (JDK 21, `ANDROID_HOME=~/android-sdk`, `JAVA_HOME=~/.local/jdk21`). Chi tiết lệnh đầy đủ trong `AGENTS.md`. **Mỗi release phải tăng** `versionCode`/`versionName` trong `mobile/android/app/build.gradle`. CI/CD Google Play: `.github/workflows/`.
Đổi logo: `npm run logo -- /path/anh.png` (nguồn: `assets/logo-source.*`) rồi build lại.

## Release maintenance (2026-10-26)
- Authoritative version/certificate: `release.json`; Settings and exports use it.
- Storage schema: 6. Startup preserves historical IDs and PINs, snapshots raw keys
  before migrating, and recovers the prior release's pending-write journal.
- Regression tests: `npm test` (`tests/storage.test.ts`).
- Packaging: `node scripts/prepare-mobile.mjs`; signing: `bash scripts/sign-release.sh`.
- Supported Android project: generated `mobile/android`; root `android` is a legacy
  native prototype. Detailed commands and protected environment setup: `RELEASE.md`.

## Asset visibility (2026-10-27)
- Overview hero has an accessible eye button to mask/unmask the total balance.
- App owns `assetsHidden` and persists the UI-only preference in `ltmsav_assets_hidden`; no financial schema migration.
- Translation keys: `hideTotalAssets`, `showTotalAssets` (VI/EN).

## Asset editing
- AssetsTab edit button reuses account form for name/type/icon/color. App handler calls existing storage.updateAccount, preserving ID, balance, currency and transaction links.
- Balance adjustments remain separate. New keys: editAccount, toastAccountEdited.

## Reachable asset management (1.9.2416)
- Bottom navigation: home, transactions, AI, assets, plans, profile. Reports stay accessible from Overview.
- Overview balance card has a dedicated Manage assets button. Assets cards have distinct labeled edit-details and adjust-balance actions (44px targets).
- UI keys: homeNav, planNav, profileNav, manageAssets, editDetails (VI/EN).
