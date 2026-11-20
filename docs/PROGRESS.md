# NHẬT KÝ TIẾN ĐỘ REFACTOR VELORA (PROGRESS LOG)

> **Dự án:** VELORA — Nền tảng Cho Thuê Xe Tự Lái Cao Cấp  
> **Nhánh Git:** `refactor/velora-clean-workflow`  
> **Bắt đầu:** 20/11/2026  
> **Cập nhật lần cuối:** 20/11/2026 (Hoàn thành Pha 0 $\rightarrow$ Khởi động Pha 1)

---

## 1. Trạng Thái Tổng Thể Các Pha

| Pha | Tên công đoạn | Bắt đầu | Hoàn thành | Trạng thái |
| :---: | :--- | :---: | :---: | :---: |
| **0** | Chuẩn bị, Khảo sát & Thiết lập Nền tảng | 20/11/2026 | 20/11/2026 | **HOÀN THÀNH** |
| **1** | Cơ sở Dữ liệu & Domain Entities | 20/11/2026 | — | **ĐANG TIẾN HÀNH** |
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
- [x] Khảo sát danh mục tên file thật trong `CarRental.Web/src` (xác minh chính xác các modal và page).
- [x] Rà soát và xác định danh sách các thành phần hạ tầng v1.0 tái sử dụng: `FastHoldExpirationWorker`, `DailyOperationalAlertsWorker`, `PaymentsController` webhook HMAC-SHA256, `btree_gist` Exclusion Constraint, `UserActiveStatusMiddleware`.
- [x] Chốt chiến lược migration backfill dữ liệu từ cột cũ sang cột mới, không chạy song song 2 luồng.
- [x] Bổ sung các ràng buộc thiếu vào Pha 1, 2, 3 (State Machine, IDOR, seed settings, ODO & Damage Map columns).
- [x] Ban hành `docs/REFACTOR_PLAN.md` và `docs/PROGRESS.md`.

---

### PHA 1: CƠ SỞ DỮ LIỆU & DOMAIN ENTITIES — [ ] ĐANG TIẾN HÀNH
- [ ] Chuẩn hóa `CarRental.API/Entities/Enums.cs` (RentalRequestStatus, ContractStatus, HandoverStatus, DamageStage, IncidentType, IncidentResponsibleParty).
- [ ] Nâng cấp Entity `HandoverProtocol.cs` (dispatch_odo, handover_odo, dispatch_fuel_level, handover_fuel_level, handover_dash_photo_url, has_transit_anomaly, transit_anomaly_note, dispatch_damage_map, handover_damage_map, status).
- [ ] Nâng cấp Entity `ReturnProtocol.cs` (customer_return_odo, yard_checkin_odo, customer_return_fuel_level, yard_checkin_fuel_level, return_dash_photo_url, has_return_anomaly, return_anomaly_note, return_damage_map).
- [ ] Nâng cấp Entity `RentalRequest.cs` (estimated_delivery_distance_km) & `RentalSettlement.cs` & `IncidentReport.cs`.
- [ ] Viết migration SQL script (ALTER TABLE ADD COLUMN IF NOT EXISTS, backfill dữ liệu cũ sang mới, insert safe seed cho system_settings).
- [ ] Cập nhật cấu hình EF Core trong `AppDbContext.cs` / `CarRentalDbContext.cs`.
- [ ] Thực thi kiểm tra dữ liệu và chạy `dotnet build` đạt 0 errors, 0 warnings.

---

## 3. Nhật Ký Thay Đổi (Change Log)

- **20/11/2026 10:36:**
  - Hoàn tất Pha 0: Rà soát baseline `dotnet build` và `npm run build` (0 errors, 0 warnings).
  - Cập nhật 4 nội dung trọng yếu vào `docs/REFACTOR_PLAN.md` (tên file thật, chiến lược backfill cột cũ, tái sử dụng hạ tầng v1.0, các ràng buộc State Machine/IDOR/seed settings).
  - Đánh dấu hoàn thành Pha 0 trong `docs/PROGRESS.md`.
  - Khởi động Pha 1: Nâng cấp Domain Entities & Schema Database.
