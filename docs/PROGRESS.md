# NHẬT KÝ TIẾN ĐỘ REFACTOR VELORA (PROGRESS LOG)

> **Dự án:** VELORA — Nền tảng Cho Thuê Xe Tự Lái Cao Cấp  
> **Nhánh Git:** `refactor/velora-clean-workflow`  
> **Bắt đầu:** 20/11/2026  
> **Cập nhật lần cuối:** 20/11/2026 (Hoàn thành Pha 1 $\rightarrow$ Chuẩn bị Pha 2)

---

## 1. Trạng Thái Tổng Thể Các Pha

| Pha | Tên công đoạn | Bắt đầu | Hoàn thành | Trạng thái |
| :---: | :--- | :---: | :---: | :---: |
| **0** | Chuẩn bị, Khảo sát & Thiết lập Nền tảng | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **1** | Cơ sở Dữ liệu & Domain Entities | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **2** | Backend Core Services & State Machine | — | — | CHỜ THỰC HIỆN |
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

## 3. Nhật Ký Thay Đổi (Change Log)

- **20/11/2026 10:36:**
  - Hoàn tất Pha 0: Rà soát baseline `dotnet build` và `npm run build` (0 errors, 0 warnings). Commit `506a571`.
- **20/11/2026 10:42:**
  - Hoàn thành toàn diện Pha 1:
    - Nâng cấp Enums, `HandoverProtocol`, `ReturnProtocol`, `RentalRequest`, `IncidentReport`.
    - Viết file migration SQL `20261120_UpgradeWorkflowAndDiffMarkers.sql`, thực thi thành công trên Supabase Cloud.
    - Backfill dữ liệu cũ sang mới, chèn cài đặt hệ thống `fuel_tolerance_percent`, `max_default_transit_km`.
    - Khắc phục 12 cảnh báo CS8601 $\rightarrow$ `dotnet build` đạt 0 warnings, 0 errors.
    - `npm run build` thành công.
