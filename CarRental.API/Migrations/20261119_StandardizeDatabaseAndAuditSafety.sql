-- =========================================================================================
-- VELORA CAR RENTAL SYSTEM - ARCHITECTURAL DATABASE REFACTORING & DATA INTEGRITY MIGRATION
-- Generated: 2026-11-19
-- Target: PostgreSQL 15+ (Supabase)
-- =========================================================================================

-- 1. BẬT EXTENSION btree_gist CHO RÀNG BUỘC EXCLUSION CONSTRAINT
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. TẠO EXCLUSION CONSTRAINT CHỐNG DOUBLE BOOKING Ở TẦNG DATABASE
-- Đảm bảo không thể có 2 đơn cùng xe (car_id) có khoảng thời gian giao thoa (start_time, end_time)
-- ngoại trừ các đơn đã HỦY (CANCELLED) hoặc BỊ TỪ CHỐI (REJECTED).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_rentals'
    ) THEN
        ALTER TABLE rental_requests
        ADD CONSTRAINT no_overlapping_rentals
        EXCLUDE USING gist (
            car_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        )
        WHERE (status NOT IN ('CANCELLED', 'REJECTED'));
    END IF;
END $$;

-- 3. CHUYỂN TOÀN BỘ RÀNG BUỘC ON DELETE CASCADE SANG ON DELETE RESTRICT TRÊN CÁC BẢNG LỊCH SỬ / TÀI CHÍNH
-- incident_reports -> cars
ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS "FK_incident_reports_cars_car_id";
ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS "incident_reports_car_id_fkey";
ALTER TABLE incident_reports
    ADD CONSTRAINT "FK_incident_reports_cars_car_id"
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT;

-- incident_reports -> rental_requests
ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS "FK_incident_reports_rental_requests_rental_request_id";
ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS "incident_reports_rental_request_id_fkey";
ALTER TABLE incident_reports
    ADD CONSTRAINT "FK_incident_reports_rental_requests_rental_request_id"
    FOREIGN KEY (rental_request_id) REFERENCES rental_requests(id) ON DELETE RESTRICT;

-- maintenance_records -> cars
ALTER TABLE maintenance_records DROP CONSTRAINT IF EXISTS "FK_maintenance_records_cars_car_id";
ALTER TABLE maintenance_records DROP CONSTRAINT IF EXISTS "maintenance_records_car_id_fkey";
ALTER TABLE maintenance_records
    ADD CONSTRAINT "FK_maintenance_records_cars_car_id"
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT;

-- rental_extensions -> rental_requests
ALTER TABLE rental_extensions DROP CONSTRAINT IF EXISTS "FK_rental_extensions_rental_requests_rental_request_id";
ALTER TABLE rental_extensions DROP CONSTRAINT IF EXISTS "rental_extensions_rental_request_id_fkey";
ALTER TABLE rental_extensions
    ADD CONSTRAINT "FK_rental_extensions_rental_requests_rental_request_id"
    FOREIGN KEY (rental_request_id) REFERENCES rental_requests(id) ON DELETE RESTRICT;

-- 4. TẠO CÁC COMPOSITE INDEXES CHO CÁC TRUY VẤN TRỌNG YẾU (HIGH-FREQUENCY / BOTTLENECK QUERIES)
-- Index tìm kiếm xe sẵn sàng và kiểm tra giao thoa đơn
CREATE INDEX IF NOT EXISTS ix_rental_requests_car_id_status_start_end
    ON rental_requests (car_id, status, start_time, end_time);

-- Index tra cứu lịch sử thuê theo khách hàng sắp xếp mới nhất
CREATE INDEX IF NOT EXISTS ix_rental_requests_customer_email_created_at
    ON rental_requests (customer_email, created_at DESC);

-- Index liên kết hợp đồng với đơn thuê
CREATE INDEX IF NOT EXISTS ix_rental_contracts_request_id
    ON rental_contracts (request_id);

-- Index mã giao dịch thanh toán duy nhất chống duplicate payment
CREATE UNIQUE INDEX IF NOT EXISTS ix_payments_transaction_code_unique
    ON payments (transaction_code)
    WHERE transaction_code IS NOT NULL AND transaction_code <> '';

-- Index tra cứu lịch sử thanh toán theo đơn, phân loại và trạng thái
CREATE INDEX IF NOT EXISTS ix_payments_rental_request_id_type_status
    ON payments (rental_request_id, type, status);

-- Index kiểm tra thời hạn bảo hiểm xe sắp hết hạn
CREATE INDEX IF NOT EXISTS ix_car_insurances_end_date
    ON car_insurances (end_date);

-- 5. DỌN SẠCH CÁC BẢNG LEGACY KHÔNG CÒN SỬ DỤNG
DROP TABLE IF EXISTS contract_extensions CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 6. GHI NHẬN MIGRATION VÀO BẢNG __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261119100000_StandardizeDatabaseAndAuditSafety', '10.0.12')
ON CONFLICT ("MigrationId") DO NOTHING;

-- 7. BỔ SUNG CỘT KYC, TRUST SCORE VÀ THÔNG TIN GIẤY TỜ VÀO app_users
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS kyc_status character varying(50) DEFAULT 'PENDING';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamp with time zone;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS kyc_note text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 100;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS id_card_number character varying(50);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_number character varying(50);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_class character varying(20);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_expiry timestamp with time zone;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS id_card_front_url text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS id_card_back_url text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_front_url text;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_back_url text;

-- 8. TẠO BẢNG customer_violations GẮN KHÓA NGOẠI TỚI app_users
CREATE TABLE IF NOT EXISTS customer_violations (
    id uuid NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    type character varying(100) NOT NULL,
    points_change integer NOT NULL,
    reason text NOT NULL,
    officer character varying(100) DEFAULT 'Trưởng ca Vận hành',
    created_at timestamp with time zone DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_customer_violations_user_id ON customer_violations(user_id);

-- 9. NÂNG CẤP BẢNG additional_drivers HỖ TRỢ LƯU TRỰC TIẾP THEO KHÁCH HÀNG (user_id)
ALTER TABLE additional_drivers ALTER COLUMN rental_request_id DROP NOT NULL;
ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES app_users(id) ON DELETE CASCADE;
ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS relationship character varying(100);
ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS date_of_birth timestamp with time zone;
ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS license_class character varying(20) DEFAULT 'B2';
ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS license_expiry timestamp with time zone;
ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS status character varying(50) DEFAULT 'VERIFIED';
ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT NOW();
CREATE INDEX IF NOT EXISTS ix_additional_drivers_user_id ON additional_drivers(user_id);
