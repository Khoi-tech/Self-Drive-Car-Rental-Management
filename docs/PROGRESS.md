# NHẬT KÝ TIẾN ĐỘ REFACTOR VELORA (PROGRESS LOG)

> **Dự án:** VELORA — Nền tảng Cho Thuê Xe Tự Lái Cao Cấp  
> **Nhánh Git:** `refactor/velora-clean-workflow`  
> **Bắt đầu:** 20/11/2026  
> **Cập nhật lần cuối:** 20/11/2026 (Hoàn tất 100% toàn bộ 5 Pha Refactor V2.0 Clean Workflow)

---

## 1. Trạng Thái Tổng Thể Các Pha

| Pha | Tên công đoạn | Bắt đầu | Hoàn thành | Trạng thái |
| :---: | :--- | :---: | :---: | :---: |
| **0** | Chuẩn bị, Khảo sát & Thiết lập Nền tảng | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **1** | Cơ sở Dữ liệu & Domain Entities | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **2** | Backend Core Services & State Machine | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **3** | Phân quyền Ma trận 3 Role (STAFF / MANAGER / ADMIN) & IDOR | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **4** | Cải tiến Giao diện Vận hành (UI/UX Canvas & Protocol) | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **5** | Kiểm thử Tích hợp E2E & Nghiệm thu Tổng thể | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |

---

## 2. Chi Tiết Tiến Độ Theo Từng Tác Vụ

### PHA 0: CHUẨN BỊ, KHẢO SÁT & THIẾT LẬP NỀN TẢNG — [x] HOÀN THÀNH
- [x] Đọc và tiếp thu toàn bộ `docs/REFACTOR_RULES.md`, `docs/VELORA_SPEC.md`, `PROJECT_HANDOVER_V2.md`.
- [x] Kiểm tra nhánh git hiện tại: `refactor/velora-clean-workflow`.
- [x] Xác minh Baseline Biên dịch:
  - Backend (`CarRental.API`): Chạy `dotnet build` đạt kết quả: **0 Warning(s), 0 Error(s)**.
  - Frontend (`CarRental.Web`): Chạy `npm run build` Vite v8.3.0 đạt kết quả: **0 errors**.
- [x] Khảo sát danh mục tên file thật trong `CarRental.Web/src`.
- [x] Rà soát và xác định danh sách các thành phần hạ tầng v1.0 tái sử dụng: `FastHoldExpirationWorker`, `DailyOperationalAlertsWorker`, `PaymentsController` webhook HMAC-SHA256, `btree_gist` Exclusion Constraint, `UserActiveStatusMiddleware`.
- [x] Chốt chiến lược migration backfill dữ liệu từ cột cũ sang cột mới, không chạy song song 2 luồng.
- [x] Bổ sung các ràng buộc thiếu vào Pha 1, 2, 3 (State Machine, IDOR, seed settings, ODO & Damage Map columns).
- [x] Ban hành `docs/REFACTOR_PLAN.md` và `docs/PROGRESS.md`.
- [x] Commit hoàn thành Pha 0: `docs: finalize phase 0 refactor plan` (commit `506a571`).

---

### PHA 1: CƠ SỞ DỮ LIỆU & DOMAIN ENTITIES — [x] HOÀN THÀNH
- [x] Chuẩn hóa `CarRental.API/Entities/Enums.cs`:
  - `RentalRequestStatus`: `PENDING`, `PENDING_HOLD_PAYMENT`, `HOLD_CONFIRMED`, `APPROVED`, `CONFIRMED`, `ACTIVE`, `RETURNED`, `SETTLED`, `COMPLETED`, `CANCELLED`, `REJECTED`.
  - `ContractStatus`: `PENDING_SIGNATURE`, `SIGNED`, `DEPOSIT_PAID`, `ACTIVE`, `COMPLETED`, `DISPUTED`, `VOID`, `CANCELLED`.
  - `HandoverStatus`: `IN_TRANSIT`, `COMPLETED`.
  - `DamageStage`: `PRE_EXISTING`, `TRANSIT_DELIVERY`, `CUSTOMER_RENTAL`, `TRANSIT_RETURN`.
  - `IncidentResponsibleParty`: `STAFF`, `CUSTOMER`, `THIRD_PARTY`, `FORCE_MAJEURE`.
  - `IncidentType`: `INTERNAL_TRANSIT`, `COLLISION`, `BREAKDOWN`, `WEATHER`, `THEFT_VANDALISM`.
- [x] Nâng cấp Entity `HandoverProtocol.cs`:
  - Mốc ODO: `dispatch_odo`, `handover_odo` (bảo toàn tương thích `start_km`).
  - Mốc nhiên liệu: `dispatch_fuel_level`, `handover_fuel_level` (decimal, bảo toàn `fuel_level`).
  - Ảnh taplo: `handover_dash_photo_url`.
  - Audit ODO: `has_transit_anomaly`, `transit_anomaly_note`.
  - Sơ đồ xước 2D: `dispatch_damage_map`, `handover_damage_map`.
  - Trạng thái: `status` (`IN_TRANSIT`, `COMPLETED`).
- [x] Nâng cấp Entity `ReturnProtocol.cs`:
  - Mốc ODO: `customer_return_odo`, `yard_checkin_odo` (bảo toàn `start_km`, `end_km`, `end_odo`).
  - Mốc nhiên liệu: `customer_return_fuel_level`, `yard_checkin_fuel_level` (decimal, bảo toàn `fuel_level`).
  - Ảnh taplo: `return_dash_photo_url`.
  - Audit ODO: `has_return_anomaly`, `return_anomaly_note`.
  - Sơ đồ xước 2D: `return_damage_map`.
- [x] Nâng cấp Entity `RentalRequest.cs`: `estimated_delivery_distance_km`.
- [x] Nâng cấp Entity `IncidentReport.cs`: `responsible_party`, `staff_pay_amount`.
- [x] Viết và thực thi Migration SQL an toàn `20261120_UpgradeWorkflowAndDiffMarkers.sql` trên PostgreSQL Supabase:
  - Sử dụng `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
  - Backfill an toàn 100% dữ liệu lịch sử từ cột cũ sang cột mới.
  - Seed an toàn `system_settings`: `fuel_tolerance_percent` (3.0%), `max_default_transit_km` (50 km), `traffic_fine_hold_amount` (2.000.000đ).
- [x] Sửa triệt để các cảnh báo nullable reference CS8601 còn tồn đọng $\rightarrow$ Biên dịch Backend: `dotnet build` đạt **0 Warning(s), 0 Error(s)**.
- [x] Biên dịch Frontend: `npm run build` đạt **0 errors**.

---

### PHA 2: BACKEND CORE SERVICES & STATE MACHINE ENGINE — [x] HOÀN THÀNH
- [x] **Single Source of Truth & Đồng bộ 2 chiều:**
  - Toàn bộ backend service đọc 100% từ các cột mới (`dispatch_odo`, `handover_odo`, `customer_return_odo`, `yard_checkin_odo`, `dispatch_fuel_level`, `handover_fuel_level`, `customer_return_fuel_level`, `yard_checkin_fuel_level`, `dispatch_damage_map`, `handover_damage_map`, `return_damage_map`).
  - Tự động ghi đồng bộ giá trị sang cột cũ (`start_km`, `end_km`, `fuel_level`, `damage_points_json`) để duy trì tương thích cho Frontend trước Pha 4.
- [x] **Hóa giải Bẫy 1 — Hao hụt nhiên liệu / pin có dung sai:**
  - Đọc `fuel_tolerance_percent` từ `system_settings` (mặc định 3.0%).
  - Tính phụ phí deficit chỉ trên `handover_fuel_level - customer_return_fuel_level`; miễn cước nếu `deficit <= tolerance`.
  - Kiểm soát trung chuyển chiều đi: Nếu `dispatch_fuel_level - handover_fuel_level > 15%`, tự động gắn ghi chú cảnh báo nội bộ `[CẢNH BÁO NỘI BỘ]` cho Quản lý.
- [x] **Hóa giải Bẫy 2 — Sơ đồ xước 2D phân tầng diff marker & Tự động tạo Incident nội bộ:**
  - `IN_TRANSIT`: Kế thừa vết xước chưa sửa thành `PRE_EXISTING` vào `dispatch_damage_map`.
  - `COMPLETED` (Giao khách): Khóa không cho xóa marker từ `dispatch_damage_map`. Mọi marker mới so với lúc xuất bãi tự động gắn `stage = TRANSIT_DELIVERY`.
  - Trong cùng Transaction, tự động tạo bản ghi `incident_reports` (`incident_type = INTERNAL_TRANSIT`, `responsible_party = STAFF`, `customer_cost = 0`), không phạt tiền khách.
  - `ReturnProtocol`: Khóa toàn bộ marker lúc bàn giao (`PRE_EXISTING` và `TRANSIT_DELIVERY`); chỉ marker mới (`stage = CUSTOMER_RENTAL`, `type = NEW`) mới được chuyển sang `SettlementService` để tính khấu trừ cọc.
  - Quãng đường khách đi: `customer_return_odo - handover_odo` (loại trừ trung chuyển). Cập nhật `cars.current_mileage` theo `yard_checkin_odo` (hoặc `customer_return_odo`).
- [x] **Hóa giải Bẫy 3 — Audit ODO 2 cấp độ 2 chiều:**
  - Công thức ngưỡng: `max_allowed_km = (estimated_delivery_distance_km * 1.3) + 5` (hoặc `max_default_transit_km` = 50 km).
  - *Hard Block (HTTP 400):* Chặn lưu nếu `handover_odo < dispatch_odo` hoặc `transit_km > max_allowed_km * 3` hoặc `> 300 km`.
  - *Soft Flag (Cảnh báo mềm):* Nếu `transit_km > max_allowed_km`: bắt buộc nhập `transit_anomaly_note`, lưu `has_transit_anomaly = true`.
  - Áp dụng logic đối xứng cho chiều xe về bãi (`yard_checkin_odo - customer_return_odo`, `has_return_anomaly`, `return_anomaly_note`).
- [x] **Ràng buộc State Machine 10 bước & Khóa cứng Settlement:**
  - Chặn chuyển hợp đồng sang `DEPOSIT_PAID` nếu chưa ở trạng thái `SIGNED`.
  - Nhánh hủy đơn/từ chối trước giao xe: chuyển `RentalRequest -> CANCELLED/REJECTED`, `RentalContract -> VOID`, và giải phóng `Car -> READY` (tự động hoàn 500k nếu là Fast Hold).
  - Duyệt gia hạn (`RentalExtensionService.ApproveAsync`): kiểm tra không trùng lịch đặt trước, bọc Transaction đa bảng, bắt lỗi PostgreSQL Exclusion Constraint `23P01` trả HTTP 409 Conflict.
  - Sau khi `RentalSettlement` chốt (`PARTIALLY_SETTLED`, `SETTLED`, `CLOSED`), khóa cứng không cho chỉnh sửa hoặc xóa ngược `HandoverProtocol` và `ReturnProtocol`.
  - Hoàn quỹ phạt nguội sau 15–30 ngày (`confirm-traffic-fine-refund`): bảo đảm tính Idempotent (chỉ hoàn 1 lần, số tiền hoàn <= quỹ tạm giữ 2.000.000đ), cập nhật `RentalSettlement -> CLOSED`, `RentalContract -> COMPLETED`, `RentalRequest -> COMPLETED`, `Car -> READY`.
- [x] **Sửa triệt để lỗi lệch số liệu Analytics Dashboard:**
  - Chuẩn hóa điều kiện đếm xe hoạt động (`is_active = true && status != INACTIVE`) trên toàn bộ các truy vấn.
  - Đẩy các phép tính tổng hợp, đếm, nhóm xuống PostgreSQL bằng `GroupBy` thay vì load về RAM.
  - Đồng bộ công thức tỷ lệ khai thác xe lăn bánh `fleetUtilization = Math.Round((rentedVehicles / totalVehicles) * 100, 1)`, khớp 100% với hiển thị `({rentedVehicles}/{totalVehicles} xe lăn bánh)`.
  - Loại bỏ chuỗi fix cứng `Danh sách xe (27)` trên `AdminLayout.jsx`.
- [x] **Xác minh Biên dịch:**
  - Backend: `dotnet build` đạt **0 Warning(s), 0 Error(s)**.
  - Frontend: `npm run build` đạt **0 errors**.

---

### PHA 3: PHÂN QUYỀN MA TRẬN 3 ROLE (STAFF / MANAGER / ADMIN) & BẢO MẬT IDOR — [x] HOÀN THÀNH
- [x] **Hotfix Bước 10 (`SettlementService.ConfirmTrafficFineRefundAsync`):**
  - Gỡ bỏ hoàn toàn việc gán `Car.Status = READY` khi hoàn phạt nguội sau 15–30 ngày.
- [x] **Chuẩn hóa Authorization Policies (`Program.cs`):**
  - `Operations`: `STAFF`, `MANAGER`, `ADMIN`.
  - `Management`: `MANAGER`, `ADMIN`.
  - `AdminOnly`: `ADMIN`.
- [x] **Rà soát & Khóa phân quyền toàn bộ Controllers theo Ma trận 3 Role:**
  - `VehiclesController`: GET công khai; POST/PUT/PATCH status $\rightarrow$ `Management`; DELETE $\rightarrow$ `AdminOnly`.
  - `PricingPoliciesController` & `RentalConditionsController`: GET công khai; POST/PUT/DELETE $\rightarrow$ `Management`.
  - `CompensationPoliciesController` & `ContractTemplatesController`: GET công khai; POST/PUT/PATCH/DELETE $\rightarrow$ `AdminOnly`.
  - `SystemSettingsController`: Toàn bộ controller $\rightarrow$ `AdminOnly`.
  - `SettlementsController`: GET list / preview / POST tạo bảng kê $\rightarrow$ `Operations`; `confirm-refund`, `confirm-traffic-fine-refund`, `confirm-additional-payment`, `resolve-dispute` $\rightarrow$ `Management`.
  - `CustomersController`: GET danh sách $\rightarrow$ `Operations`; `PUT status` (khóa/mở khóa), `PUT kyc-status`, `POST violations` $\rightarrow$ `Management`; chặn sửa tài khoản nội bộ nếu caller không phải ADMIN.
  - `CarInsurancesController`: POST/PUT/DELETE $\rightarrow$ `Management`.
  - Các Controller vận hành (`RentalRequests`, `RentalContracts`, `Payments`, `HandoverProtocols`, `ReturnProtocols`, `RentalExtensions`, `IncidentReports`): Khóa toàn bộ endpoint danh sách tổng và thao tác nội bộ bằng `Operations`.
- [x] **Vá triệt để lỗ hổng IDOR & Chặn tài khoản bị khóa:**
  - `SecurityExtensions.cs`: Trích xuất `UserId` từ Claim `ClaimTypes.NameIdentifier` / `sub`, truy vấn DB kiểm tra `dbUser.IsActive` và so khớp quyền sở hữu `RentalRequest` theo `userId` (hoặc email/sđt chuẩn hóa). Chặn 100% IDOR từ query/body.
  - `UserActiveStatusMiddleware`: Chặn lập tức mọi request từ tài khoản `is_active = false` bằng HTTP 403 Forbidden.
- [x] **Phân tách số liệu Analytics theo vai trò Backend:**
  - `IAnalyticsService` & `AnalyticsService`: Nhận cờ `bool isStaffOnly = false`.
  - Nếu `STAFF`: Trả `null` cho `TotalRevenue`, `ThisMonthRevenue`, `RevenueGrowthPercent`, `MonthlyRevenue`; ẩn số tiền trong hoạt động gần đây và báo cáo xe.
  - Nếu `MANAGER` / `ADMIN`: Trả đầy đủ doanh thu + thống kê hậu kiểm `TransitAnomalies` (Tổng số bất thường, giao xe, nhận xe, sự cố trung chuyển, và danh sách cảnh báo chi tiết).
- [x] **Phân tách giao diện & Ẩn thao tác vượt quyền trên Frontend (`CarRental.Web`):**
  - `AuthContext.jsx`: Bổ sung các cờ tiện ích `isBackoffice`, `isOperations`, `isManagement`, `isAdmin`, `isManager`, `isStaff`.
  - `ProtectedRoute.jsx`: Hỗ trợ `allowedRoles` chặn truy cập URL trực tiếp và hiển thị thông báo 403.
  - `AppRoutes.jsx`: Khóa route quản lý giá, chính sách và hệ thống theo vai trò.
  - `AdminLayout.jsx`: Ẩn menu "Cấu hình chính sách" và "Hệ thống & Nhân sự" với STAFF; lọc các menu con cho MANAGER.
  - `SettlementModal.jsx`: STAFF bị ẩn các nút Xác nhận hoàn cọc, Hoàn quỹ phạt nguội, Giải quyết khiếu nại (thay bằng banner cảnh báo quyền hạn Quản lý).
  - `CustomersManagementPage.jsx`: STAFF bị ẩn nút Khóa tài khoản, Phê duyệt/Từ chối KYC, Ghi nhận vi phạm/Điều chỉnh điểm.
  - `VehiclesPage.jsx` & `VehicleDetailPage.jsx`: STAFF bị ẩn nút "Thêm xe mới", "Chỉnh sửa", "Đổi trạng thái"; chỉ ADMIN thấy "Ngừng hoạt động".
  - `DashboardPage.jsx`:
    * `STAFF`: "Bảng Điều Phối Vận Hành" với 4 thẻ vận hành, lối tắt 4 nghiệp vụ điều phối, Top xe theo lượt thuê, ẩn hoàn toàn doanh thu và biểu đồ doanh thu 6 tháng.
    * `MANAGER` / `ADMIN`: Dashboard doanh thu đầy đủ + Khu vực Cảnh báo Hậu kiểm Trung chuyển (Transit Anomalies).
- [x] **Xác minh Biên dịch:**
  - Backend: `dotnet build` đạt **0 Warning(s), 0 Error(s)**.
  - Frontend: `npm run build` đạt **0 errors**.

---

### PHA 4: CẢI TIẾN GIAO DIỆN VẬN HÀNH (FRONTEND UI/UX POLISH) — [x] HOÀN THÀNH
- [x] **Xác minh nhanh 2 endpoint Backend từ Pha 3:**
  - Xác nhận `POST /api/vehicles/{vehicleId}/pricing-preview` mở `[AllowAnonymous]` (không bị 403 khi khách vãng lai xem dự toán).
  - Xác nhận `POST /api/handover-protocols/{id}/confirm` yêu cầu Authenticated + IDOR/Operations validation (hỗ trợ cả khách hàng ký từ máy mình và nhân viên ký kép).
- [x] **Nâng cấp Sơ đồ xước 2D (`VehicleDamageMap.jsx`):**
  - Đọc/ghi cấu trúc JSON marker có trường `stage` (`PRE_EXISTING`, `TRANSIT_DELIVERY`, `CUSTOMER_RENTAL`, `TRANSIT_RETURN`), tương thích DTO Backend.
  - 4 màu sắc phân biệt trực quan kèm thanh chú thích (legend):
    * Xám (`PRE_EXISTING`): Vết cũ từ trước (chỉ đọc, khóa không cho xóa/sửa).
    * Cam (`TRANSIT_DELIVERY`): Vết phát sinh lúc trung chuyển giao xe (khóa lúc trả xe, gắn nhãn "Nội bộ / Không tính phí khách").
    * Đỏ (`CUSTOMER_RENTAL`): Vết mới do khách làm lúc trả xe (tính bồi thường).
    * Vàng/Tím (`TRANSIT_RETURN`): Vết phát sinh khi Staff lái xe về bãi.
  - Tích hợp Modal xem ảnh chụp độ nét cao khi click vào marker và hỗ trợ upload ảnh chi tiết cho marker mới.
- [x] **Nâng cấp Biểu mẫu Bàn giao xe (`HandoverModal.jsx`, `CustomerHandoverModal.jsx`, `HandoversPage.jsx`):**
  - Tách bạch rõ 2 luồng không chồng chéo:
    * Nhận tại bãi: đi thẳng hoàn tất bàn giao `COMPLETED`.
    * Giao tận nơi (2 bước): Bước 1 tạo nháp `IN_TRANSIT` (`dispatch_odo`, `dispatch_fuel_level`, xác nhận `PRE_EXISTING`) $\rightarrow$ Bước 2 gặp khách hoàn tất `COMPLETED` (`handover_odo`, `handover_fuel_level`, bắt buộc ảnh taplo `handover_dash_photo_url`, ký xác nhận kép).
  - Bộ chọn nhiên liệu thông minh theo `car.fuelType`:
    * Xe điện: nhập số % pin (0–100%) kèm slider.
    * Xe xăng/dầu: bộ chọn trực quan thang 8 vạch (1/8 đến 8/8 tương ứng 12.5% – 100%).
  - Xử lý trực quan Audit ODO 2 cấp độ:
    * Soft Flag: cảnh báo vàng khi chênh lệch vượt `max_allowed_km`, bắt buộc nhập lý do giải trình (`transit_anomaly_note`), không chặn nút hoàn tất giao xe.
    * Hard Block: thông báo lỗi rõ ràng yêu cầu kiểm tra ODO và ảnh taplo.
  - Khóa toàn bộ nút sửa/xóa nếu hồ sơ đã chốt Quyết toán (`PARTIALLY_SETTLED`, `SETTLED`, `CLOSED`).
- [x] **Nâng cấp Biểu mẫu Nghiệm thu Trả xe (`ReturnProtocolModal.jsx`, `ReturnsPage.jsx`):**
  - Nhập `customer_return_odo`, mức nhiên liệu lúc khách trả (thang 8 vạch hoặc % pin), ảnh chụp taplo bắt buộc (`return_dash_photo_url`) và sơ đồ 2D (khóa toàn bộ vết cũ, chỉ cho chấm vết mới `CUSTOMER_RENTAL`).
  - Khi nhận xe tận nơi: hiển thị khu vực cập nhật `yard_checkin_odo`, `yard_checkin_fuel_level` và ô giải trình `return_anomaly_note` (khi vượt ngưỡng ODO chiều về).
  - Hiển thị dòng tóm tắt minh bạch: "Quãng đường khách sử dụng = ODO khách trả − ODO lúc giao khách".
- [x] **Nâng cấp Giao diện Quyết toán & Quản lý Phạt nguội (`SettlementModal.jsx`, `CustomerSettlementReceiptModal.jsx`):**
  - Bảng kê chi tiết từ `PreviewSettlementDto` hiển thị mức xăng giao vs trả, ngưỡng dung sai (`FuelTolerancePercent`), ghi chú "Miễn phụ phí (trong ngưỡng dung sai)" khi `deficit <= tolerance`, và chỉ phạt các vết trầy xước `CUSTOMER_RENTAL`.
  - Tách bạch rõ 2 phần thanh toán: Đợt 1 (Quyết toán cọc chính) và Đợt 2 (Tạm giữ 2.000.000đ quỹ phạt nguội 15–30 ngày).
  - Nút xác nhận hoàn cọc đợt 1, hoàn quỹ phạt nguội đợt 2 (kèm mã giao dịch VietQR) và giải quyết khiếu nại chỉ hiển thị cho `MANAGER` / `ADMIN`.
- [x] **Đồng bộ luồng 10 bước & UX khách hàng:**
  - Đồng bộ nhãn trạng thái (badge) khớp State Machine mới (`PENDING_HOLD_PAYMENT`, `HOLD_CONFIRMED`, `PENDING_SIGNATURE`, `DEPOSIT_PAID`, `IN_TRANSIT`, `ACTIVE`, `RETURNED`, `SETTLED`, `PARTIALLY_SETTLED`, `CLOSED`, `COMPLETED`, `VOID`, `INSPECTION`) trên `RentalRequestsPage.jsx` và `RentalsManagementSection.jsx`.
  - Ẩn/vô hiệu hóa các nút hành động không hợp lệ ở trạng thái hiện tại để tránh bấm sai bước.
  - Tự động điều hướng khách vãng lai (Guest) sang `/login?returnUrl=...` khi bấm Đặt xe / Fast Hold tại `CarDetailPage.jsx` và `BookingPage.jsx`.
- [x] **Xác minh Biên dịch:**
  - Backend: `dotnet build` đạt **0 Warning(s), 0 Error(s)**.
  - Frontend: `npm run build` đạt **0 errors**.

### PHA 5: KIỂM THỬ TÍCH HỢP E2E & NGHIỆM THU TỔNG THỂ — [x] HOÀN THÀNH
- [x] **Xây dựng Script Kiểm thử Tự động E2E Toàn diện (`scripts/e2e_phase5_test.py`):**
  - Chạy thật qua HTTP REST API `http://localhost:5171/api`.
  - Cơ chế Safe Cleanup tự động: chỉ dọn dẹp các bản ghi mang tiền tố `E2E_TEST_` hoặc `e2e_`, bảo toàn nguyên vẹn 100% dữ liệu thật trên Supabase.
  - Tích hợp endpoint dọn dẹp an toàn `POST /api/system-settings/cleanup-e2e` (AdminOnly).
- [x] **Xác minh 100% Bộ A — Chu trình 10 bước khép kín & 3 Bẫy nghiệp vụ:**
  - *Bước 1–2:* Customer A đặt xe Fast Hold 500k (có `estimated_delivery_distance_km = 20`) $\rightarrow$ Khởi tạo `HOLD_DEPOSIT` $\rightarrow$ Webhook VietQR kèm chữ ký HMAC-SHA256 (xác thực từ chối chữ ký sai 401, nhận chữ ký đúng 200) $\rightarrow$ `RentalRequest = HOLD_CONFIRMED`, `Car = BOOKED`. Idempotent: Webhook trùng `transaction_code` không bị cộng trùng hay báo lỗi.
  - *Bước 3–4:* Staff duyệt đơn (`APPROVED`, sinh `RentalContract = PENDING_SIGNATURE`) $\rightarrow$ Customer A ký số (`SIGNED`) $\rightarrow$ Nộp cọc thế chân qua VietQR $\rightarrow$ `Contract = DEPOSIT_PAID`, `Request = CONFIRMED`, `Car = BOOKED`.
  - *Bước 5–6 (Bẫy 1, 2, 3 chiều đi):*
    + Staff tạo biên bản `IN_TRANSIT`: `dispatch_odo = 1000`, `dispatch_fuel_level = 100`, kế thừa vết xước cũ `PRE_EXISTING`.
    + Staff hoàn tất giao xe: `handover_odo = 1035` (vượt `20 * 1.3 + 5 = 31 km`) $\rightarrow$ Kích hoạt **Soft Flag**: chặn lưu nếu không có note giải trình (HTTP 400), cho phép bàn giao khi có note kèm `has_transit_anomaly = true`.
    + Thêm 1 vết xước mới lúc giao $\rightarrow$ Marker tự động mang `stage = TRANSIT_DELIVERY`. Tự động sinh 1 bản ghi `incident_reports` nội bộ (`INTERNAL_TRANSIT`, `responsible_party = STAFF`, `customer_cost = 0`). Đồng bộ State Machine: `Request = ACTIVE`, `Contract = ACTIVE`, `Car = RENTED`.
  - *Bước 8 (Bẫy 1, 2, 3 chiều về):*
    + Khách trả xe: `customer_return_odo = 1350`, `customer_return_fuel_level = 75`, phát sinh 1 vết trầy mới `CUSTOMER_RENTAL` (phí 500.000đ).
    + Xe về bãi: `yard_checkin_odo = 1380`.
    + Xác nhận: Quãng đường tính khách = `1350 - 1035 = 315 km` (loại trừ 35km giao và 30km về), `cars.current_mileage = 1380`, `Request = RETURNED`, `Car = INSPECTION`.
  - *Bước 9 (Quyết toán & Dung sai):*
    + Staff gọi preview: kiểm tra chỉ phạt vết `CUSTOMER_RENTAL` (500.000đ), không phạt vết `TRANSIT_DELIVERY`. Áp dụng dung sai nhiên liệu 3% (`fuelFee = 102.000đ`). Tách giữ 2.000.000đ quỹ phạt nguội.
    + Manager xác nhận hoàn cọc đợt 1 (`confirm-refund`): `Settlement = PARTIALLY_SETTLED`, `Request = SETTLED`, `Car = READY`.
  - *Bước 10 (Hoàn phạt nguội & Kiểm chứng Hotfix):*
    + Giả lập xe lúc này được khách khác đặt (`Car.Status = BOOKED`).
    + Manager gọi `confirm-traffic-fine-refund`: `Settlement = CLOSED`, `Contract = COMPLETED`, `Request = COMPLETED`, và **`Car.Status` VẪN GIỮ NGUYÊN `BOOKED` (không bị ghi đè về `READY`)**.
    + Idempotent: Gọi lại `confirm-traffic-fine-refund` lần 2 bị chặn (HTTP 400).
- [x] **Xác minh 100% Bộ B — Ràng buộc biên, Ma trận Phân quyền 3 Role & Bảo mật IDOR:**
  - *Hard Block ODO:* Chặn lưu `handover_odo < dispatch_odo` và `transit_km > 300` (HTTP 400).
  - *Chống trùng lịch:* Đặt xe trùng khung giờ đơn khác trả về HTTP 409 Conflict.
  - *Thứ tự ký hợp đồng:* Cố tình nộp cọc thế chân khi hợp đồng chưa `SIGNED` bị chặn (HTTP 400).
  - *Khóa cứng sau quyết toán:* Cố tình sửa hoặc xóa `HandoverProtocol` sau khi đã chốt quyết toán bị chặn (HTTP 400).
  - *Ma trận 3 Role:*
    + `STAFF`: Gọi Analytics trả `totalRevenue = null`, `monthlyRevenue = null`. Chặn gọi `confirm-refund`, `resolve-dispute`, `system-settings`, xóa xe (toàn bộ HTTP 403).
    + `MANAGER`: Xem đầy đủ doanh thu & cảnh báo `TransitAnomalies`. Bị chặn truy cập `system-settings`, tạo `compensation-policies`, tạo `contract-templates`, xóa xe (toàn bộ HTTP 403).
    + `ADMIN`: Gọi các endpoint `AdminOnly` thành công (HTTP 200).
  - *IDOR & Khóa tài khoản:*
    + Customer B dùng JWT của mình gọi xem/ký/hủy/khiếu nại đơn Customer A $\rightarrow$ Toàn bộ bị chặn HTTP 403.
    + Manager khóa Customer B (`is_active = false`) $\rightarrow$ `UserActiveStatusMiddleware` chặn ngay lập tức request tiếp theo bằng HTTP 403 Forbidden.
- [x] **Kết quả kiểm thử:**
  - **48 / 48 PASSED (100% PASS)**, 0 FAILED.
  - Supabase Database: 100% an toàn, không rò rỉ dữ liệu test.
- [x] **Xác minh Biên dịch cuối cùng:**
  - Backend: `dotnet build` đạt **0 Warning(s), 0 Error(s)**.
  - Frontend: `npm run build` đạt **0 errors**.

---

## 3. Danh Mục File Thay Đổi (Phase 4 & 5 Artifacts)

### Backend (`CarRental.API`):
1. `Services/PaymentService.cs`: Sửa điều kiện phân biệt `FAST_HOLD` vs `COLLATERAL` trong luồng Webhook và nộp cọc; bảo đảm tính chính xác khi đơn `FAST_HOLD` bước sang nộp cọc thế chân.
2. `DTOs/Incidents/IncidentDtos.cs`: Bổ sung `ResponsibleParty` vào `IncidentReportDto`.
3. `Services/IncidentReportService.cs`: Ánh xạ `ResponsibleParty` trong `MapToDto`.
4. `Controllers/HandoverProtocolsController.cs`: Bổ sung try-catch cho endpoint `Delete` để trả HTTP 400 thay vì 500 khi vi phạm khóa cứng quyết toán.
5. `Controllers/SystemSettingsController.cs`: Thêm endpoint nội bộ an toàn `cleanup-e2e` (AdminOnly) hỗ trợ dọn sạch dữ liệu test tiền tố `E2E_` / `e2e_`.
6. `Program.cs`: Đồng bộ schema migration khởi động cho `customer_violations` và `additional_drivers`, seed tài khoản Manager/Admin.

### Testing & Verification:
7. `scripts/e2e_phase5_test.py`: Bộ script kiểm thử tự động toàn diện 48 kịch bản tích hợp bao phủ 100% yêu cầu Pha 5.

### Tài liệu Bàn giao:
8. `docs/OPERATIONS_3_ROLES_GUIDE.md`: Cẩm nang hướng dẫn vận hành & ma trận phân quyền chuẩn hóa 3 Role (`STAFF`, `MANAGER`, `ADMIN`).
9. `docs/REFACTOR_PLAN.md`: Cập nhật trạng thái hoàn thành Pha 5 và kết thúc toàn bộ đợt refactor.
10. `docs/PROGRESS.md`: Cập nhật chi tiết tiến độ 100% và nhật ký thay đổi.

---

## 4. Nhật Ký Thay Đổi (Change Log)

- **20/11/2026 10:36:** Hoàn tất Pha 0: Rà soát baseline `dotnet build` và `npm run build` (0 errors, 0 warnings). Commit `506a571`.
- **20/11/2026 10:42:** Hoàn tất Pha 1: Nâng cấp Enums, Entities, Migration SQL `20261120_UpgradeWorkflowAndDiffMarkers.sql`, backfill dữ liệu, seed settings. Commit `688ce80`.
- **20/11/2026 11:04:** Hoàn tất Pha 2: Cài đặt State Machine 10 bước tập trung, 3 bẫy nghiệp vụ (Nhiên liệu tolerance, Sơ đồ xước diff & incident nội bộ, Audit ODO 2 cấp độ 2 chiều), khóa cứng sau Settlement, chống trùng lịch gia hạn (HTTP 409), và sửa triệt để lệch số liệu Analytics. Commit `ca43051`.
- **20/11/2026 11:35:** Hoàn tất Pha 3: Hotfix Bước 10 (không đổi Car -> READY khi hoàn phạt nguội), chuẩn hóa Ma trận 3 Role (STAFF / MANAGER / ADMIN), vá triệt để lỗ hổng IDOR, phân tách dữ liệu Backend Analytics & Dashboard theo role, ẩn hoàn toàn các nút thao tác vượt quyền trên Frontend. `dotnet build` 0 errors, 0 warnings; `npm run build` 0 errors. Commit `04ff22e`.
- **20/11/2026 12:05:** Hoàn tất Pha 4: Nâng cấp sơ đồ xước 2D diff 4 stage, form bàn giao 2 luồng & ODO audit, form nghiệm thu trả xe & tóm tắt quãng đường, giao diện quyết toán 2 đợt & phân quyền duyệt hoàn cọc, đồng bộ 10 bước State Machine trên toàn bộ trang quản trị và giao diện khách hàng. `dotnet build` 0 errors, 0 warnings; `npm run build` 0 errors. Commit `aeb4d6c`.
- **20/11/2026 12:47:** Hoàn tất Pha 5: Triển khai kiểm thử tích hợp tự động E2E 48/48 test cases PASS tuyệt đối (100%). Xác minh trọn vẹn 10 bước nghiệp vụ, 3 bẫy nghiệp vụ, ma trận phân quyền 3 role, kiểm chứng hotfix giữ trạng thái BOOKED, bảo mật IDOR & khóa tài khoản tức thì, an toàn dữ liệu Supabase 100%. Ban hành cẩm nang vận hành `OPERATIONS_3_ROLES_GUIDE.md`. Hoàn tất toàn bộ dự án Refactor VELORA Clean Workflow V2.0!
