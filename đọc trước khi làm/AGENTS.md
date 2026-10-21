# AGENTS.md — LTMsav / Finflow

## ĐỌC TRƯỚC KHI LÀM GÌ (tiết kiệm token)
- Khi user yêu cầu cập nhật/thêm tính năng: đọc **`APP_MAP.md`** (bản đồ app, ~150 dòng) thay vì đọc toàn bộ `src/`. Mở thêm tối đa 1–3 file được chỉ trong mục "Chạm vào đâu".
- Sửa app xong mà có file/tab/key dịch mới → cập nhật luôn `APP_MAP.md`.

## DATA SAFETY (BẮT BUỘC — never break this)
- **Tuyệt đối không được ảnh hưởng dữ liệu người dùng khi cập nhật.** Giữ nguyên `accounts`, `transactions`, `debts`, `budgets`, `settings`, `pins`.
- Không bao giờ `localStorage.clear()` trong flow cập nhật/migration. Chỉ được xóa khi người dùng chủ động xác nhận "XÓA TOÀN BỘ DỮ LIỆU".
- Thay đổi cấu trúc dữ liệu ⇒ tăng `SCHEMA_VERSION` trong `src/services/storage.ts` + viết migration tương thích ngược, và luôn `createAutomaticSnapshot()` trước khi migrate.
- Chi tiết đầy đủ: xem `DATA_SAFETY_RULES.md`.

## VERSIONING (mỗi lần release PHẢI tăng)
- `mobile/android/app/build.gradle`: tăng `versionCode` (+1) và `versionName` (semver).
- Xác nhận sau build: `aapt dump badging app-release.apk | grep version`.

## Build & release (JDK 21 bắt buộc)
```bash
export PATH=~/.local/node/bin:$PATH
npm run build
rm -rf mobile/dist && cp -r dist mobile/dist
cd mobile && npx cap sync android
cd android
export ANDROID_HOME=~/android-sdk JAVA_HOME=~/.local/jdk21
export PATH=$JAVA_HOME/bin:$PATH
./gradlew assembleRelease bundleRelease --no-daemon
cp app/build/outputs/apk/release/app-release.apk ../../build-output/LTMsav-release-signed.apk
cp app/build/outputs/bundle/release/app-release.aab ../../build-output/LTMsav-googleplay.aab
```

## UI rules (light mode)
- Không dùng `text-white` trên nền sáng. Dùng `text-slate-900 dark:text-white` cho tiêu đề, `text-slate-600 dark:text-slate-400` cho text phụ.
- Borders: `border-slate-200 dark:border-slate-800`.

## i18n
- Ngôn ngữ qua `src/contexts/LanguageContext.tsx` (VI/EN). Lưu vào `ltmsav_language`. Nút chuyển ở header + Settings.

## Logo (đổi logo siêu dễ)
- Nguồn duy nhất: `assets/logo-source.<ext>` (ảnh gốc, KHÔNG chỉnh sửa).
- Đổi logo: `npm run logo -- /path/to/anh-moi.png` (hoặc `python3 scripts/update_logo.py <ảnh>`). Script tự tạo lại: `public/logo.png`, `icon.png`, `pwa-*.png`, `apple-touch-icon.png`, `favicon.ico`, và toàn bộ `mipmap-*/ic_launcher*.png` + `ic_launcher_background.xml`. Ảnh được scale nguyên vẹn, không crop/vẽ lại.
- Sau đó build lại bình thường (xem mục Build & release). UI header + splash dùng `/logo.png`.
