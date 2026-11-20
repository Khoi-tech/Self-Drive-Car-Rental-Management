-- Migration: 20261120_UpgradeWorkflowAndDiffMarkers.sql
-- Description: Mở rộng các cột cho 10 bước quy trình, 3 bẫy nghiệp vụ (ODO, Nhiên liệu, Sơ đồ 2D diff marker)
--              và chuẩn hóa các thiết lập hệ thống an toàn.

-- 1. BẢNG HANDOVER_PROTOCOLS (BIÊN BẢN BÀN GIAO)
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS dispatch_odo INT;
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS handover_odo INT NOT NULL DEFAULT 0;
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS dispatch_fuel_level NUMERIC(5,2);
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS handover_fuel_level NUMERIC(5,2) NOT NULL DEFAULT 100;
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS handover_dash_photo_url TEXT;
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS has_transit_anomaly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS transit_anomaly_note TEXT;
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS dispatch_damage_map TEXT;
ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS handover_damage_map TEXT;

-- Backfill dữ liệu lịch sử từ cột cũ sang cột mới cho handover_protocols
UPDATE handover_protocols SET
    handover_odo = CASE WHEN handover_odo = 0 AND start_km > 0 THEN start_km ELSE handover_odo END,
    dispatch_odo = COALESCE(dispatch_odo, start_km, 0),
    handover_fuel_level = CASE WHEN handover_fuel_level = 100 AND fuel_level > 0 THEN fuel_level ELSE handover_fuel_level END,
    dispatch_fuel_level = COALESCE(dispatch_fuel_level, fuel_level, 100),
    handover_damage_map = COALESCE(handover_damage_map, damage_points_json),
    dispatch_damage_map = COALESCE(dispatch_damage_map, damage_points_json),
    status = CASE 
        WHEN status IS NULL OR status = '' OR status = 'PENDING_CUSTOMER' THEN 'IN_TRANSIT'
        ELSE status 
    END;

-- 2. BẢNG RETURN_PROTOCOLS (BIÊN BẢN NHẬN XE)
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS customer_return_odo INT NOT NULL DEFAULT 0;
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS yard_checkin_odo INT;
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS customer_return_fuel_level NUMERIC(5,2) NOT NULL DEFAULT 100;
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS yard_checkin_fuel_level NUMERIC(5,2);
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS return_dash_photo_url TEXT;
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS has_return_anomaly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS return_anomaly_note TEXT;
ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS return_damage_map TEXT;

-- Backfill dữ liệu lịch sử từ cột cũ sang cột mới cho return_protocols
UPDATE return_protocols SET
    customer_return_odo = CASE WHEN customer_return_odo = 0 AND end_km > 0 THEN end_km ELSE customer_return_odo END,
    yard_checkin_odo = COALESCE(yard_checkin_odo, end_km, end_odo, 0),
    customer_return_fuel_level = CASE WHEN customer_return_fuel_level = 100 AND return_fuel_level > 0 THEN return_fuel_level ELSE customer_return_fuel_level END,
    yard_checkin_fuel_level = COALESCE(yard_checkin_fuel_level, return_fuel_level, fuel_level, 100),
    return_damage_map = COALESCE(return_damage_map, damage_points_json);

-- 3. BẢNG RENTAL_REQUESTS
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS estimated_delivery_distance_km NUMERIC(8,2);

-- 4. BẢNG INCIDENT_REPORTS
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS responsible_party VARCHAR(50) DEFAULT 'CUSTOMER';
ALTER TABLE incident_reports ADD COLUMN IF NOT EXISTS staff_pay_amount NUMERIC(18,2) DEFAULT 0;

-- 5. SEED CẤU HÌNH HỆ THỐNG AN TOÀN TRÊN SYSTEM_SETTINGS
INSERT INTO system_settings (key, value, data_type, description, updated_at)
VALUES 
    ('fuel_tolerance_percent', '3.0', 'DECIMAL', 'Dung sai hao hụt nhiên liệu / pin cho phép (3% pin EV hoặc 0.5 vạch xăng)', NOW()),
    ('max_default_transit_km', '50.0', 'DECIMAL', 'Ngưỡng km trung chuyển xe tối đa mặc định trước khi kích hoạt cảnh báo mềm', NOW()),
    ('FuelTolerancePercent', '3.0', 'DECIMAL', 'Dung sai hao hụt nhiên liệu / pin cho phép (alias PascalCase)', NOW()),
    ('MaxDefaultTransitKm', '50.0', 'DECIMAL', 'Ngưỡng km trung chuyển xe tối đa mặc định trước khi kích hoạt cảnh báo mềm (alias PascalCase)', NOW()),
    ('TrafficFineHoldAmount', '2000000', 'DECIMAL', 'Khoản tiền giữ lại đối soát phạt nguội khi quyết toán (alias PascalCase)', NOW())
ON CONFLICT (key) DO NOTHING;
