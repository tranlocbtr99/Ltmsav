# LTMsav/Finflow – DATA SAFETY & UPDATE RULES

> **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÁ HỦY DỮ LIỆU NGƯỜI DÙNG KHI CẬP NHẬT APP**

## 1) Nguyên tắc cốt lõi
- **Không reset dữ liệu**: `transactions`, `accounts`, `debts`, `budgets`, `settings`, `pins`... phải được giữ nguyên giữa các phiên bản.
- **Chỉ migration**: Mọi thay đổi cấu trúc localStorage chỉ được thực hiện bằng cách nâng `SCHEMA_VERSION` + hàm migrate tương thích ngược.
- **Luôn sao lưu trước migrate**: Trước khi thay đổi schema, phải gọi `createAutomaticSnapshot()` (đã có trong `src/services/storage.ts`).
- **An toàn mặc định**: Không bao giờ gọi `localStorage.clear()` trong flow cập nhật. Chỉ dùng trong "XÓA TOÀN BỘ DỮ LIỆU" có xác nhận rõ ràng của người dùng.

## 2) Quản lý phiên bản (Android)
Version UI và Android được tạo tự động cùng lúc bằng `scripts/release-version.mjs` trong CI. Xem `RELEASE.md` để biết công thức và khóa ký gốc bắt buộc. Không chỉnh Gradle thủ công; `mobile/android/` là dự án được sinh khi đóng gói. Không dùng root `android/` làm bản phát hành.

## 3) Quản lý Schema
File: `src/services/storage.ts`
- `SCHEMA_VERSION`: chỉ tăng khi **THỰC SỰ** cần thay đổi cấu trúc dữ liệu.
- Nếu `storedVersion < SCHEMA_VERSION`: 
  1. Tạo snapshot tự động
  2. Migrate từng bước từ version cũ -> mới, KHÔNG xóa keys của user
  3. Chỉ normalize/rename/add default an toàn
  4. Sau thành công mới ghi `SCHEMA_VERSION` mới
- **Cấm**: xóa `accounts/transactions/debts/budgets` khi chỉ sửa UI, fix bug, thêm tính năng.

## 4) Checklist trước mỗi build release
- [ ] `storage.ts`: migration không xóa dữ liệu user
- [ ] CI sinh version UI/Android thống nhất và versionCode lớn hơn APK đang cài
- [ ] Build web: `npm run build` thành công
- [ ] `cap sync android` thành công
- [ ] `./gradlew assembleRelease bundleRelease` thành công
- [ ] Cài test trên thiết bị: mở app, dữ liệu cũ còn đầy đủ
- [ ] Kiểm tra chế độ sáng/tối không bị mất text

## 5) Lỗi đã gặp & cách tránh
- **Text trắng trên nền trắng (light mode)**: luôn kiểm tra `text-white` trên card nền sáng. Ưu tiên `text-slate-900 dark:text-white`, `text-slate-600 dark:text-slate-400`.
- **Quên tăng version**: bắt buộc check `versionCode/versionName` trước khi xuất file release.
- **Migrate sai**: luôn backup snapshot + test với dữ liệu có sẵn trước khi release.

**Quy tắc: Mỗi lần cập nhật = tăng version + migration an toàn. KHÔNG ĐƯỢC ẢNH HƯỞNG DỮ LIỆU NGƯỜI DÙNG.**
