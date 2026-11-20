# TỔNG QUAN KIẾN TRÚC VELORA (BÀN GIAO PHIÊN BẢN 1.0 -> NÂNG CẤP 2.0)

> **Tài liệu bàn giao & ngữ cảnh hệ thống**  
> Dành cho Agent / Developer tiếp quản dự án VELORA khi mở đoạn chat mới.

---

## 1. Thông Tin Kho Mã Nguồn & Công Nghệ
- **Repository:** `https://github.com/Khoi-tech/Self-Drive-Car-Rental-Management.git` (Nhánh: `main`)
- **Thư mục dự án cục bộ:** `D:\E_Data\Huflit Study\CNPM_NC\Self-Drive-Car-Rental-Management`
- **Công nghệ chính:**
  - **Backend API:** .NET 10, EF Core 10, ASP.NET Core Web API, SignalR Hub, BackgroundService Hosted Workers, HybridCache.
  - **Cơ sở dữ liệu:** PostgreSQL (triển khai trên Supabase Cloud).
  - **Frontend Web:** React 19, Vite, Tailwind CSS, Lucide Icons, Axios.
  - **Mobile App:** Flutter, Dart, Provider / Clean Architecture.

---

## 2. Các Cột Mốc Đã Hoàn Thiện Trong Phiên Bản 1.0 (Production Ready)
1. **Bảo mật & Phân quyền Policy-based:**
   - Đã cấu hình Policies trong `Program.cs`: `Operations` (Admin/Manager/Staff), `Management` (Admin/Manager), `CustomerOrStaff`.
   - Khóa chặt 18 Controllers. Tích hợp `UserActiveStatusMiddleware` tự động chặn token của user bị khóa.
2. **Toàn vẹn dữ liệu & Chống Double Booking:**
   - Extension PostgreSQL `btree_gist` và ràng buộc loại trừ (`Exclusion Constraint`) chống chồng lấn lịch đặt xe.
   - Bọc transaction đa bảng (`BeginTransactionAsync`) cho toàn bộ quy trình: Tạo đơn -> Duyệt đơn -> Bàn giao xe -> Nhận xe -> Quyết toán hoàn tiền.
   - Chuyển `CASCADE` sang `RESTRICT` trên các bảng tài chính / audit (`incident_reports`, `maintenance_records`, `rental_extensions`).
3. **Loại bỏ 100% Mock Data & Dữ liệu RAM:**
   - Kết nối trực tiếp PostgreSQL cho KYC (`app_users.kyc_status`, bảng `customer_violations`).
   - Đổi mật khẩu thật mã hóa BCrypt (`POST /api/auth/change-password`) và thu hồi JWT Refresh Token (`refresh_tokens`).
   - CRUD thật cho lái phụ (`additional_drivers`), kho tài liệu số và sổ cái giao dịch cá nhân.
4. **Tác vụ nền & Webhook Thanh toán:**
   - `FastHoldExpirationWorker`: Quét mỗi 5 phút tự động hủy đơn giữ xe quá 4 tiếng và giải phóng trạng thái xe về `READY`.
   - `DailyOperationalAlertsWorker`: Quét hàng ngày lúc 08:00 cảnh báo hoàn quỹ phạt nguội và gia hạn đăng kiểm/bảo hiểm xe.
   - Webhook VietQR (`POST /api/payments/webhook`) xác thực chữ ký số HMAC-SHA256 và bảo đảm Idempotency.
5. **Tối ưu hóa hiệu năng & Bộ nhớ:**
   - Viết lại toàn bộ `AnalyticsService` bằng LINQ đẩy xuống PostgreSQL (`AsNoTracking`, `GroupBy`, `CountAsync`, `SumAsync`), loại bỏ nguy cơ tràn RAM (OOM).
   - Phân trang chuẩn (`PagedResultDto`) cho danh mục xe, đơn thuê, hợp đồng, khách hàng.
   - Tích hợp `HybridCache` của .NET 10 cho bảng giá, mẫu hợp đồng, danh mục xe.
   - Tích hợp `IStorageService` hỗ trợ Supabase Storage Bucket.
6. **Cấu hình động & Real-time Notifications:**
   - Bảng `system_settings` và trang Admin Settings (`/admin/settings`).
   - Thông báo Real-time với SignalR Hub (`/hubs/notifications`).
7. **Trải nghiệm Đặt xe (UX Polish):**
   - Loại bỏ toàn bộ emoji thừa, sử dụng icon Lucide SVG chuyên nghiệp.
   - Nhãn "Cọc khi nhận xe" hỗ trợ thanh toán linh hoạt bằng tiền mặt hoặc chuyển khoản tại điểm giao nhận.
   - Bộ lọc ký tự (masking/sanitization) tự động cho Họ tên, SĐT (10 số), CCCD (12 số), GPLX (12 số).
   - Trường "Ngày hết hạn GPLX" hỗ trợ gõ định dạng `DD/MM/YYYY`, nút chọn lịch và 3 nút chọn nhanh thời hạn (+3, +5, +10 năm).

---

## 3. Cổng Dịch Vụ Mặc Định Đang Chạy
- **Backend API:** `http://localhost:5171` (Swagger: `http://localhost:5171/swagger`)
- **Frontend Web:** `http://localhost:5173`
- **Database:** Supabase PostgreSQL Pooler (cấu hình trong `CarRental.API/appsettings.json`)

---

## 4. Tài khoản Kiểm thử (Demo Accounts)
- **Quản trị viên / Nhân viên:** `staff@velora.vn` / mật khẩu: `Password123!`
- **Khách hàng mẫu:** `customer@velora.vn` / mật khẩu: `Password123!`
- **Khách VIP:** `hoangminh.nguyen@gmail.com` / mật khẩu: `Password123!`
