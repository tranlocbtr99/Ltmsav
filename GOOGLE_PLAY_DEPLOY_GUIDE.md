# Hướng Dẫn Đóng Gói APK & Đăng Ứng Dụng Lên Google Play (CH Play)

Tài liệu này hướng dẫn chi tiết từng bước để bạn:
1. **Lấy file APK cài đặt trực tiếp lên điện thoại** để dùng ngay.
2. **Lấy file AAB (Android App Bundle)** để tải lên Google Play Console (CH Play).

---

## BƯỚC 1: Lấy File APK & AAB Tự Động Qua GitHub Actions (Khuyên Dùng)

Dự án đã được tích hợp quy trình CI/CD tự động trên GitHub Actions:

1. Đẩy code lên GitHub:
   ```bash
   git push origin main
   ```
2. Mở trình duyệt vào repository:
   👉 **https://github.com/tranlocbtr99/Ltmsav/actions**
3. Bạn sẽ thấy quy trình **Build Android APK and Google Play AAB** đang tự động chạy (hoặc bấm nút **Run workflow**).
4. Sau khi quá trình build hoàn tất (~2 đến 3 phút), kéo xuống mục **Artifacts** ở cuối trang để tải:
   * 📱 **`FinFlow-Debug-APK`** hoặc **`FinFlow-Signed-Release-APK`**: File `.apk` dùng để chép vào điện thoại Android và cài đặt dùng ngay.
   * 📦 **`FinFlow-GooglePlay-AAB`**: File `.aab` chuẩn dùng để tải lên CH Play.

---

## BƯỚC 2: Cài Đặt File APK Trực Tiếp Lên Điện Thoại Android

1. Tải file `FinFlow-Debug-APK.zip` từ GitHub Actions về máy tính hoặc điện thoại, giải nén ra file `.apk`.
2. Gửi file `.apk` vào điện thoại (qua Zalo, Google Drive, Telegram, hoặc cắm cáp USB).
3. Mở file `.apk` trên điện thoại:
   * Nếu điện thoại hiện thông báo *"Chặn cài đặt ứng dụng từ nguồn không xác định"*, bấm **Cài đặt (Settings)** $\rightarrow$ Bật **Cho phép từ nguồn này (Allow from this source)**.
4. Bấm **Cài đặt (Install)** $\rightarrow$ Mở ứng dụng và trải nghiệm đầy đủ tính năng!

---

## BƯỚC 3: Đăng Ứng Dụng Lên Google Play Console (CH Play)

### 1. Chuẩn bị tài khoản Google Play Developer
* Truy cập: [Google Play Console](https://play.google.com/console)
* Đăng ký tài khoản nhà phát triển (phí 1 lần là $25 của Google).

### 2. Tạo ứng dụng mới trên Google Play Console
1. Bấm **Tạo ứng dụng (Create app)**.
2. Điền thông tin:
   * **Tên ứng dụng**: `FinFlow - Quản Lý Thu Chi` (dưới 30 ký tự)
   * **Ngôn ngữ mặc định**: Tiếng Việt (vi)
   * **Loại ứng dụng**: Ứng dụng (App)
   * **Miễn phí hay có phí**: Miễn phí (Free)

### 3. Thiết lập thông tin ứng dụng (Set up your app)
Vào mục **Nội dung ứng dụng (App content)** ở menu bên trái và hoàn thành các mục:
* **Chính sách quyền riêng tư (Privacy Policy)**: 
  Điền link: `https://github.com/tranlocbtr99/Ltmsav/blob/main/PRIVACY_POLICY.md` (hoặc link trang web của bạn).
* **Quyền truy cập ứng dụng**: Chọn *"Tất cả chức năng đều dùng được mà không cần cấp quyền đặc biệt"*.
* **Quảng cáo**: Chọn *"Không, ứng dụng của tôi không chứa quảng cáo"*.
* **Xếp hạng nội dung (Content Rating)**: Trả lời bảng câu hỏi khảo sát (chọn thể loại Tiện ích/Tài chính).
* **Đối tượng mục tiêu**: Chọn từ 18 tuổi trở lên.
* **Ứng dụng tài chính (Financial Features)**: Chọn mục Quản lý tài chính cá nhân / Sổ thu chi (Personal Finance Management), dữ liệu lưu trữ trên thiết bị.

### 4. Danh sách trang thông tin trên cửa hàng (Store listing)
* **Mô tả ngắn (Short description)**:
  `Quản lý tài chính, ghi chép thu chi cá nhân thông minh với AI và bảo mật mã PIN.`
* **Mô tả đầy đủ (Full description)**:
  `FinFlow LTMsav là ứng dụng quản lý tài chính cá nhân hiện đại, giúp bạn theo dõi chi tiêu dễ dàng:
  - Ghi chép thu chi nhanh chóng bằng ngôn ngữ tự nhiên với Trợ lý AI.
  - Quản lý hạn mức ngân sách theo từng danh mục chi tiêu.
  - Theo dõi tài sản, số dư tài khoản ngân hàng, ví điện tử và sổ nợ.
  - Báo cáo biểu đồ thống kê trực quan.
  - Bảo mật an toàn với mã PIN và sinh trắc học vân tay/khuôn mặt.
  - Hoạt động mượt mà offline, không phụ thuộc vào internet.`
* **Hình ảnh (Graphics assets)**:
  * Icon ứng dụng: Kích thước 512 x 512 px (PNG 32-bit).
  * Ảnh đồ họa tính năng (Feature graphic): Kích thước 1024 x 500 px.
  * Ít nhất 2 ảnh chụp màn hình điện thoại (Phone screenshots).

### 5. Tải bản phát hành (Upload Release AAB)
1. Trong menu bên trái, vào **Sản xuất (Production)** hoặc **Thử nghiệm nội bộ (Internal testing)**.
2. Bấm **Tạo bản phát hành mới (Create new release)**.
3. Kéo thả file **`FinFlow-GooglePlay-Signed.aab`** vừa tải từ GitHub Actions vào.
4. Đặt tên bản phát hành: `1.0.0 (1)`.
5. Điền ghi chú phát hành: `Phiên bản đầu tiên của ứng dụng FinFlow LTMsav.`
6. Bấm **Lưu** $\rightarrow$ **Xem lại bản phát hành** $\rightarrow$ **Bắt đầu triển khai**.

---

Chúc mừng! Ứng dụng của bạn sẽ được đội ngũ Google kiểm duyệt (thường mất từ 1 - 3 ngày làm việc đối với app mới) và chính thức xuất hiện trên CH Play!
