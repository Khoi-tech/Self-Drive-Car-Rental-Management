-- Safe idempotent migration: Upgrade rental_conditions, rental_requests (declared KYC), app_users & default system_settings
-- Zero destructive operations; preserves 100% of existing data on Supabase.

-- 1. rental_conditions new columns
ALTER TABLE rental_conditions
    ADD COLUMN IF NOT EXISTS required_license_class character varying(20) NOT NULL DEFAULT 'B1';
ALTER TABLE rental_conditions
    ADD COLUMN IF NOT EXISTS min_completed_trips integer NOT NULL DEFAULT 0;
ALTER TABLE rental_conditions
    ADD COLUMN IF NOT EXISTS require_verified_kyc boolean NOT NULL DEFAULT FALSE;

-- 2. rental_requests declared self-report columns (nullable)
ALTER TABLE rental_requests
    ADD COLUMN IF NOT EXISTS declared_dob date NULL;
ALTER TABLE rental_requests
    ADD COLUMN IF NOT EXISTS declared_license_class character varying(20) NULL;
ALTER TABLE rental_requests
    ADD COLUMN IF NOT EXISTS declared_license_issue_date date NULL;

-- 3. app_users KYC profile columns (nullable)
ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS date_of_birth date NULL;
ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS license_class character varying(20) NULL;
ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS license_issue_date date NULL;

-- 4. system_settings default fallback rental condition settings
INSERT INTO system_settings (key, value, data_type, description, updated_at)
VALUES
    ('default_min_age', '21', 'INTEGER', 'Độ tuổi tối thiểu mặc định hệ thống khi xe chưa thiết lập điều kiện riêng', NOW() AT TIME ZONE 'utc'),
    ('default_min_driving_years', '1', 'INTEGER', 'Số năm kinh nghiệm lái xe tối thiểu mặc định hệ thống', NOW() AT TIME ZONE 'utc'),
    ('default_required_license', 'B1', 'STRING', 'Hạng GPLX tối thiểu mặc định hệ thống (B1, B2, C)', NOW() AT TIME ZONE 'utc')
ON CONFLICT (key) DO NOTHING;
