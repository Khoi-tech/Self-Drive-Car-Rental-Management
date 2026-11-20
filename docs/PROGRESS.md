# NHẬT KÝ TIẾN ĐỘ REFACTOR VELORA (PROGRESS LOG)

> **Dự án:** VELORA — Nền tảng Cho Thuê Xe Tự Lái Cao Cấp  
> **Nhánh Git:** `refactor/velora-clean-workflow`  
> **Bắt đầu:** 20/11/2026  
> **Cập nhật lần cuối:** 20/11/2026 (Hoàn thành Pha 3 $\rightarrow$ Chuẩn bị Pha 4)

---

## 1. Trạng Thái Tổng Thể Các Pha

| Pha | Tên công đoạn | Bắt đầu | Hoàn thành | Trạng thái |
| :---: | :--- | :---: | :---: | :---: |
| **0** | Chuẩn bị, Khảo sát & Thiết lập Nền tảng | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **1** | Cơ sở Dữ liệu & Domain Entities | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **2** | Backend Core Services & State Machine | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **3** | Phân quyền Ma trận 3 Role (STAFF / MANAGER / ADMIN) & IDOR | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **4** | Cải tiến Giao diện Vận hành (UI/UX Canvas & Protocol) | — | — | CHỜ THỰC HIỆN |
| **5** | Kiểm thử Tích hợp E2E & Nghiệm thu Tổng thể | — | — | CHỜ THỰC HIỆN |

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

## 3. Danh Mục File & Endpoint Thay Đổi (Phase 3 Artifacts)

### Backend:
1. `CarRental.API/Program.cs`: Bổ sung Authorization Policy `AdminOnly` (`ADMIN`).
2. `CarRental.API/Helpers/SecurityExtensions.cs`: Tăng cường `CanAccessRequestIdAsync` chống IDOR, kiểm tra `dbUser.IsActive`.
3. `CarRental.API/Controllers/VehiclesController.cs`: Gắn `AdminOnly` cho DELETE xe.
4. `CarRental.API/Controllers/CompensationPoliciesController.cs`: Gắn `AdminOnly` cho POST/PUT/PATCH.
5. `CarRental.API/Controllers/ContractTemplatesController.cs`: Gắn `AdminOnly` cho POST/PUT/PATCH/DELETE.
6. `CarRental.API/Controllers/SystemSettingsController.cs`: Gắn `AdminOnly` cho toàn bộ Controller.
7. `CarRental.API/Controllers/SettlementsController.cs`: Gắn `Management` cho confirm-refund, confirm-traffic-fine-refund, confirm-additional-payment, resolve-dispute.
8. `CarRental.API/Controllers/CustomersController.cs`: Gắn `Management` cho update-kyc, add-violation, toggle-status; chặn sửa tài khoản nội bộ nếu không phải ADMIN.
9. `CarRental.API/Controllers/CarInsurancesController.cs`: Gắn `Management` cho POST/PUT.
10. `CarRental.API/Controllers/AnalyticsController.cs`: Kiểm tra role và truyền `isStaffOnly` vào `AnalyticsService`.
11. `CarRental.API/Services/AnalyticsService.cs`: Ẩn doanh thu với `STAFF`, tổng hợp `TransitAnomalies` cho `MANAGER`/`ADMIN`.
12. `CarRental.API/DTOs/Analytics/DashboardOverviewDto.cs`: Bổ sung DTOs `TransitAnomalySummaryDto`, `TransitAnomalyItemDto`, nullable revenue fields.
13. `CarRental.API/Services/SettlementService.cs`: Hotfix Bước 10 không đổi `Car.Status = READY`.

### Frontend:
14. `CarRental.Web/src/context/AuthContext.jsx`: Thêm helper getters theo 3 role.
15. `CarRental.Web/src/routes/ProtectedRoute.jsx`: Thêm kiểm tra `allowedRoles` và giao diện cảnh báo 403.
16. `CarRental.Web/src/routes/AppRoutes.jsx`: Bảo vệ các route quản lý giá, chính sách, hệ thống.
17. `CarRental.Web/src/layouts/AdminLayout.jsx`: Lọc menu điều hướng theo role.
18. `CarRental.Web/src/components/operations/SettlementModal.jsx`: Ẩn thao tác hoàn cọc/giải quyết tranh chấp cho STAFF.
19. `CarRental.Web/src/pages/Customers/CustomersManagementPage.jsx`: Ẩn thao tác KYC duyệt, khóa tài khoản, ghi vi phạm cho STAFF.
20. `CarRental.Web/src/pages/Vehicles/VehiclesPage.jsx`: Ẩn Thêm xe mới, Sửa, Đổi trạng thái, Ngừng hoạt động theo role.
21. `CarRental.Web/src/pages/Vehicles/VehicleDetailPage.jsx`: Ẩn Chỉnh sửa, Đổi trạng thái, Ngừng hoạt động theo role.
22. `CarRental.Web/src/pages/Dashboard/DashboardPage.jsx`: Phân tách "Bảng Điều Phối Vận Hành" cho STAFF và Dashboard Doanh thu + Cảnh báo Hậu kiểm Trung chuyển cho Quản lý.

---

## 4. Nhật Ký Thay Đổi (Change Log)

- **20/11/2026 10:36:** Hoàn tất Pha 0: Rà soát baseline `dotnet build` và `npm run build` (0 errors, 0 warnings). Commit `506a571`.
- **20/11/2026 10:42:** Hoàn tất Pha 1: Nâng cấp Enums, Entities, Migration SQL `20261120_UpgradeWorkflowAndDiffMarkers.sql`, backfill dữ liệu, seed settings. Commit `688ce80`.
- **20/11/2026 11:04:** Hoàn tất Pha 2: Cài đặt State Machine 10 bước tập trung, 3 bẫy nghiệp vụ (Nhiên liệu tolerance, Sơ đồ xước diff & incident nội bộ, Audit ODO 2 cấp độ 2 chiều), khóa cứng sau Settlement, chống trùng lịch gia hạn (HTTP 409), và sửa triệt để lệch số liệu Analytics. Commit `ca43051`.
- **20/11/2026 11:35:** Hoàn tất Pha 3: Hotfix Bước 10 (không đổi Car -> READY khi hoàn phạt nguội), chuẩn hóa Ma trận 3 Role (STAFF / MANAGER / ADMIN), vá triệt để lỗ hổng IDOR, phân tách dữ liệu Backend Analytics & Dashboard theo role, ẩn hoàn toàn các nút thao tác vượt quyền trên Frontend. `dotnet build` 0 errors, 0 warnings; `npm run build` 0 errors.
