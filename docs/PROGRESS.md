# NHẬT KÝ TIẾN ĐỘ REFACTOR VELORA (PROGRESS LOG)

> **Dự án:** VELORA — Nền tảng Cho Thuê Xe Tự Lái Cao Cấp  
> **Nhánh Git:** `refactor/velora-clean-workflow`  
> **Bắt đầu:** 20/11/2026  
> **Cập nhật lần cuối:** 20/11/2026 (Hoàn thành Pha 2 $\rightarrow$ Chuẩn bị Pha 3)

---

## 1. Trạng Thái Tổng Thể Các Pha

| Pha | Tên công đoạn | Bắt đầu | Hoàn thành | Trạng thái |
| :---: | :--- | :---: | :---: | :---: |
| **0** | Chuẩn bị, Khảo sát & Thiết lập Nền tảng | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **1** | Cơ sở Dữ liệu & Domain Entities | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **2** | Backend Core Services & State Machine | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **3** | Phân quyền Ma trận 3 Role (STAFF / MANAGER / ADMIN) & IDOR | — | — | CHỜ THỰC HIỆN |
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

## 3. Danh Mục File & Endpoint Thay Đổi (Phase 2 Artifacts)

### Entities & DTOs:
1. `CarRental.API/Entities/Enums.cs`: Bổ sung `RentalSettlementStatus` (`PENDING`, `DISPUTED`, `PARTIALLY_SETTLED`, `CLOSED`, `SETTLED`).
2. `CarRental.API/DTOs/Handover/HandoverProtocolDto.cs`: Cập nhật `HandoverProtocolDto`, `CreateHandoverProtocolDto`, `UpdateHandoverProtocolDto` hỗ trợ các mốc ODO mới, Nhiên liệu decimal, Audit Anomaly, và Sơ đồ xước 2D.
3. `CarRental.API/DTOs/Handover/HandoverConfirmDto.cs`: Mở rộng DTO xác nhận bàn giao nhận các mốc thực tế và ảnh taplo.
4. `CarRental.API/DTOs/ReturnProtocol/CreateReturnProtocolDto.cs`: Hỗ trợ `CustomerReturnOdo`, `YardCheckinOdo`, `CustomerReturnFuelLevel`, `YardCheckinFuelLevel`, `ReturnAnomalyNote`, `ReturnDamageMap`.
5. `CarRental.API/DTOs/ReturnProtocol/ReturnProtocolResponseDto.cs`: Bổ sung đầy đủ các trường mới đối xứng.
6. `CarRental.API/DTOs/Settlement/PreviewSettlementDto.cs`: Bổ sung `FuelTolerancePercent`, `FuelDeficit`, `HandoverFuelLevel`, `CustomerReturnFuelLevel`, `TrafficFineHoldAmount`.

### Services & Controllers:
7. `CarRental.API/Services/HandoverProtocolService.cs`: Cài đặt Bẫy 1, Bẫy 2 (diff marker & tạo Incident Report nội bộ), Bẫy 3 (audit ODO 2 cấp độ), khóa cứng khi Settlement đã chốt, đồng bộ trạng thái 3 bảng (`ACTIVE`, `ACTIVE`, `RENTED`).
8. `CarRental.API/Services/ReturnProtocolService.cs`: Cài đặt Single Source of Truth, Bẫy 2 (khóa marker cũ, marker mới `CUSTOMER_RENTAL`), Bẫy 3 chiều về, tính quãng đường loại trừ trung chuyển, đồng bộ trạng thái (`RETURNED`, `INSPECTION`/`REPAIR`).
9. `CarRental.API/Services/SettlementService.cs`: Tính phụ phí nhiên liệu có dung sai `FuelTolerancePercent`, chỉ tính bồi thường cho marker `CUSTOMER_RENTAL`, luồng quyết toán Step 9 (`PARTIALLY_SETTLED`, `SETTLED`), và hoàn phạt nguội Step 10 Idempotent (`CLOSED`, `COMPLETED`, `COMPLETED`).
10. `CarRental.API/Services/RentalRequestService.cs`: Hoàn thiện Step 3 duyệt đơn tự động sinh hợp đồng `PENDING_SIGNATURE` trong cùng Transaction; nhánh Hủy/Từ chối chuyển `RentalContract -> VOID` và giải phóng `Car -> READY`.
11. `CarRental.API/Services/PaymentService.cs`: Bắt buộc hợp đồng phải `SIGNED` trước khi chuyển sang `DEPOSIT_PAID`.
12. `CarRental.API/Services/RentalExtensionService.cs`: Kiểm tra chống trùng lịch, bọc Database Transaction, bắt lỗi `23P01` ném `ConflictException`.
13. `CarRental.API/Controllers/RentalExtensionsController.cs`: Bắt `ConflictException` trả HTTP 409 Conflict.
14. `CarRental.API/Services/AnalyticsService.cs`: Chuẩn hóa lọc `is_active = true && status != INACTIVE`, tính toán tỷ lệ khai thác xe lăn bánh khớp 100%, đẩy aggregate xuống PostgreSQL.
15. `CarRental.Web/src/layouts/AdminLayout.jsx`: Xóa số cứng `(27)` khỏi menu Danh sách xe.

---

## 4. Nhật Ký Thay Đổi (Change Log)

- **20/11/2026 10:36:** Hoàn tất Pha 0: Rà soát baseline `dotnet build` và `npm run build` (0 errors, 0 warnings). Commit `506a571`.
- **20/11/2026 10:42:** Hoàn tất Pha 1: Nâng cấp Enums, Entities, Migration SQL `20261120_UpgradeWorkflowAndDiffMarkers.sql`, backfill dữ liệu, seed settings. Commit `688ce80`.
- **20/11/2026 11:04:** Hoàn tất Pha 2: Cài đặt State Machine 10 bước tập trung, 3 bẫy nghiệp vụ (Nhiên liệu tolerance, Sơ đồ xước diff & incident nội bộ, Audit ODO 2 cấp độ 2 chiều), khóa cứng sau Settlement, chống trùng lịch gia hạn (HTTP 409), và sửa triệt để lệch số liệu Analytics. `dotnet build` 0 errors, 0 warnings; `npm run build` 0 errors.
