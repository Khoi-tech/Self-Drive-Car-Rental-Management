CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922080737_InitialCreate') THEN
    CREATE TABLE "Vehicles" (
        "Id" uuid NOT NULL,
        "Make" character varying(100) NOT NULL,
        "Model" character varying(100) NOT NULL,
        "LicensePlate" character varying(20) NOT NULL,
        "Seats" integer NOT NULL,
        "Transmission" character varying(50) NOT NULL,
        "FuelType" integer NOT NULL,
        "ManufactureYear" integer NOT NULL,
        "DailyRate" numeric(18,2) NOT NULL,
        "DepositAmount" numeric(18,2) NOT NULL,
        "PickupLocation" character varying(255),
        "Status" integer NOT NULL,
        "ImageUrl" character varying(1000),
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_Vehicles" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922080737_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Vehicles_LicensePlate" ON "Vehicles" ("LicensePlate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922080737_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260922080737_InitialCreate', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922082825_AddVehicleMaintenanceFields') THEN
    ALTER TABLE "Vehicles" ADD "CurrentMileage" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922082825_AddVehicleMaintenanceFields') THEN
    ALTER TABLE "Vehicles" ADD "MileageLimit" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922082825_AddVehicleMaintenanceFields') THEN
    ALTER TABLE "Vehicles" ADD "NextMaintenanceDate" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922082825_AddVehicleMaintenanceFields') THEN
    ALTER TABLE "Vehicles" ADD "NextMaintenanceMileage" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922082825_AddVehicleMaintenanceFields') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260922082825_AddVehicleMaintenanceFields', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE "Vehicles" DROP CONSTRAINT "PK_Vehicles";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE "Vehicles" RENAME TO cars;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "Transmission" TO transmission;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "Status" TO status;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "Seats" TO seats;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "Model" TO model;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "Id" TO id;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "UpdatedAt" TO updated_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "PickupLocation" TO pickup_location;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "NextMaintenanceMileage" TO next_maintenance_mileage;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "NextMaintenanceDate" TO next_maintenance_date;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "MileageLimit" TO included_km_per_day;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "ManufactureYear" TO manufacture_year;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "Make" TO brand;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "LicensePlate" TO license_plate;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "IsActive" TO is_active;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "ImageUrl" TO image_url;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "FuelType" TO fuel_type;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "DepositAmount" TO deposit_amount;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "DailyRate" TO base_price;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "CurrentMileage" TO current_mileage;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars RENAME COLUMN "CreatedAt" TO created_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER INDEX "IX_Vehicles_LicensePlate" RENAME TO "IX_cars_license_plate";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
        IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'car_status') THEN
            CREATE SCHEMA car_status;
        END IF;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    CREATE TYPE car_status."VehicleStatus" AS ENUM ('READY', 'BOOKED', 'RENTED', 'INSPECTION', 'MAINTENANCE', 'REPAIR', 'INACTIVE');
        IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'car_transmission') THEN
            CREATE SCHEMA car_transmission;
        END IF;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    CREATE TYPE car_transmission."TransmissionType" AS ENUM ('AUTO', 'MANUAL');
        IF NOT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'fuel_type') THEN
            CREATE SCHEMA fuel_type;
        END IF;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    CREATE TYPE fuel_type."FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars ALTER COLUMN transmission TYPE car_transmission."TransmissionType" USING 'AUTO'::car_transmission."TransmissionType";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars ALTER COLUMN status TYPE car_status."VehicleStatus" USING 'READY'::car_status."VehicleStatus";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars ALTER COLUMN fuel_type TYPE fuel_type."FuelType" USING 'PETROL'::fuel_type."FuelType";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars ADD extra_km_rate numeric;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars ADD fuel_return_policy character varying(30) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    ALTER TABLE cars ADD CONSTRAINT "PK_cars" PRIMARY KEY (id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175151_TestEnumMapping') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260922175151_TestEnumMapping', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922175912_FixEnumMapping') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260922175912_FixEnumMapping', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922180720_FixEnumMappingSchema') THEN
    CREATE TYPE public.car_status AS ENUM ('READY', 'BOOKED', 'RENTED', 'INSPECTION', 'MAINTENANCE', 'REPAIR', 'INACTIVE');
    CREATE TYPE public.car_transmission AS ENUM ('AUTO', 'MANUAL');
    CREATE TYPE public.fuel_type AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922180720_FixEnumMappingSchema') THEN
    ALTER TABLE cars ALTER COLUMN transmission TYPE public.car_transmission USING transmission::text::public.car_transmission;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922180720_FixEnumMappingSchema') THEN
    ALTER TABLE cars ALTER COLUMN status TYPE public.car_status USING status::text::public.car_status;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922180720_FixEnumMappingSchema') THEN
    ALTER TABLE cars ALTER COLUMN fuel_type TYPE public.fuel_type USING fuel_type::text::public.fuel_type;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260922180720_FixEnumMappingSchema') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260922180720_FixEnumMappingSchema', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260924074333_AddCompensationPolicies') THEN
    CREATE TABLE compensation_policies (
        id uuid NOT NULL,
        name text NOT NULL,
        description text,
        calculation_type text NOT NULL,
        amount numeric NOT NULL,
        is_active boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_compensation_policies" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260924074333_AddCompensationPolicies') THEN
    CREATE TABLE pricing_policies (
        id uuid NOT NULL,
        car_id uuid NOT NULL,
        min_days integer NOT NULL,
        discount_percentage numeric(5,2) NOT NULL,
        holiday_surcharge numeric(5,2) NOT NULL,
        created_at timestamp with time zone NOT NULL,
        CONSTRAINT "PK_pricing_policies" PRIMARY KEY (id),
        CONSTRAINT "FK_pricing_policies_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260924074333_AddCompensationPolicies') THEN
    CREATE TABLE rental_conditions (
        id uuid NOT NULL,
        car_id uuid,
        min_age integer,
        require_driving_years integer,
        other_conditions text,
        CONSTRAINT "PK_rental_conditions" PRIMARY KEY (id),
        CONSTRAINT "FK_rental_conditions_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260924074333_AddCompensationPolicies') THEN
    CREATE INDEX "IX_pricing_policies_car_id" ON pricing_policies (car_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260924074333_AddCompensationPolicies') THEN
    CREATE UNIQUE INDEX "IX_rental_conditions_car_id" ON rental_conditions (car_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260924074333_AddCompensationPolicies') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260924074333_AddCompensationPolicies', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926035234_AddContractTemplates') THEN
    CREATE TABLE contract_templates (
        id uuid NOT NULL,
        name character varying(255) NOT NULL,
        template_type character varying(50) NOT NULL,
        version character varying(20) NOT NULL,
        description text,
        content text NOT NULL,
        is_active boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_contract_templates" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926035234_AddContractTemplates') THEN
    INSERT INTO contract_templates (id, content, created_at, description, is_active, name, template_type, updated_at, version)
    VALUES ('a0000000-0000-0000-0000-000000000001', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
    Độc lập - Tự do - Hạnh phúc
    ---o0o---

    HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI TIÊU CHUẨN
    Mã hợp đồng: HD-{{LicensePlate}}-{{StartDate}}

    Hôm nay, ngày ký hợp đồng, các bên gồm:

    BÊN CHO THUÊ (BÊN A):
    - Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA
    - Đại diện: Ban Điều Hành Hệ Thống Thuê Xe Tự Lái VELORA
    - Hotline hỗ trợ 24/7: 1900 6868
    - Trụ sở / Trạm bàn giao: {{PickupLocation}}

    BÊN THUÊ XE (BÊN B):
    - Họ và tên khách hàng: {{CustomerName}}
    - Giấy phép lái xe: Đã xác thực thành công trên hệ thống VELORA
    - Trạng thái xác thực hồ sơ: HỢP LỆ

    Hai bên cùng thống nhất thỏa thuận và ký kết Hợp đồng thuê xe ô tô tự lái với các điều khoản chi tiết như sau:

    ĐIỀU 1: THÔNG TIN PHƯƠNG TIỆN VÀ THỜI GIAN THUÊ
    1.1. Thông tin phương tiện:
    - Dòng xe: {{CarModel}}
    - Biển số đăng ký: {{LicensePlate}}
    - Tình trạng kỹ thuật: Xe bảo đảm an toàn vận hành, đầy đủ giấy tờ đăng kiểm, bảo hiểm và đã được vệ sinh sạch sẽ trước khi bàn giao.
    1.2. Thời gian và địa điểm:
    - Thời gian bắt đầu: {{StartDate}}
    - Thời gian kết thúc dự kiến: {{EndDate}}
    - Địa điểm nhận và bàn giao xe: {{PickupLocation}}

    ĐIỀU 2: GIÁ THUÊ VÀ NGHĨA VỤ ĐẶT CỌC
    2.1. Đơn giá thuê: {{DailyRate}} VNĐ/ngày (theo bảng giá niêm yết của hệ thống).
    2.2. Tiền đặt cọc bảo đảm: {{DepositAmount}} VNĐ.
    Khoản tiền đặt cọc này sẽ được hoàn trả đầy đủ cho Bên B sau khi kết thúc hợp đồng, hoàn tất biên bản kiểm tra trả xe và đối soát không phát sinh vi phạm giao thông / hư hỏng.
    2.3. Phương thức thanh toán: Thanh toán trực tuyến qua cổng thanh toán liên kết hoặc ví điện tử của hệ thống.

    ĐIỀU 3: TRÁCH NHIỆM VÀ NGHĨA VỤ CỦA KHÁCH HÀNG (BÊN B)
    3.1. Chỉ khách hàng đã được định danh và xác minh GPLX hợp lệ mới được quyền điều khiển phương tiện.
    3.2. Không được sử dụng xe vào các mục đích trái pháp luật, chở hàng cấm, đua xe trái phép hoặc cho thuê lại bên thứ ba.
    3.3. Tự chịu trách nhiệm hoàn toàn đối với các lỗi vi phạm luật an toàn giao thông đường bộ (bao gồm cả phạt nguội) trong thời gian nhận bàn giao đến khi hoàn trả xe.
    3.4. Hoàn trả xe đúng giờ thỏa thuận. Trường hợp cần gia hạn, Bên B phải gửi yêu cầu gia hạn trên ứng dụng trước thời hạn trả xe ít nhất 04 giờ.

    ĐIỀU 4: PHỤ PHÍ VÀ QUY ĐỊNH BỒI THƯỜNG THIỆT HẠI
    4.1. Phụ phí phát sinh vượt km quy định hoặc trễ giờ trả xe sẽ được tính theo Chính sách phụ phí niêm yết hiện hành của VELORA.
    4.2. Mức nhiên liệu khi trả xe phải tương đương mức nhiên liệu lúc nhận xe. Nếu thấp hơn, Bên B chịu phí chênh lệch nhiên liệu cộng phí dịch vụ.
    4.3. Trường hợp xảy ra trầy xước, va chạm, hỏng hóc hoặc sự cố, mức phạt và bồi thường sẽ căn cứ theo Bảng chính sách bồi thường thiệt hại và hợp đồng bảo hiểm đã công bố của VELORA.

    ĐIỀU 5: HIỆU LỰC HỢP ĐỒNG
    5.1. Hai bên cam kết tuân thủ nghiêm túc các điều khoản đã thỏa thuận trong hợp đồng điện tử này.
    5.2. Hợp đồng có hiệu lực pháp lý kể từ thời điểm Bên B hoàn tất thanh toán tiền cọc và ký nhận biên bản bàn giao phương tiện.', TIMESTAMPTZ '2026-09-26T00:00:00Z', 'Áp dụng cho tất cả các giao dịch thuê xe tự lái theo ngày trên hệ thống VELORA.', TRUE, 'Mẫu hợp đồng thuê xe tự lái tiêu chuẩn (v1.0)', 'DAILY', NULL, 'v1.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926035234_AddContractTemplates') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260926035234_AddContractTemplates', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926045917_AddRentalRequestsAndDrivers') THEN
    CREATE TABLE rental_requests (
        id uuid NOT NULL,
        car_id uuid NOT NULL,
        customer_name text NOT NULL,
        customer_phone text NOT NULL,
        customer_email text NOT NULL,
        customer_id_card text NOT NULL,
        id_card_front_url text,
        id_card_back_url text,
        driver_license_number text NOT NULL,
        driver_license_front_url text,
        driver_license_back_url text,
        start_time timestamp with time zone NOT NULL,
        end_time timestamp with time zone NOT NULL,
        pickup_location text NOT NULL,
        dropoff_location text NOT NULL,
        total_days integer NOT NULL,
        daily_rate numeric(18,2) NOT NULL,
        discount_percent numeric(5,2) NOT NULL,
        holiday_surcharge_percent numeric(5,2) NOT NULL,
        estimated_total_fee numeric(18,2) NOT NULL,
        deposit_amount numeric(18,2) NOT NULL,
        status text NOT NULL,
        reject_reason text,
        notes text,
        created_at timestamp with time zone NOT NULL,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_rental_requests" PRIMARY KEY (id),
        CONSTRAINT "FK_rental_requests_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926045917_AddRentalRequestsAndDrivers') THEN
    CREATE TABLE additional_drivers (
        id uuid NOT NULL,
        rental_request_id uuid NOT NULL,
        full_name text NOT NULL,
        phone_number text NOT NULL,
        id_card_number text NOT NULL,
        license_number text NOT NULL,
        CONSTRAINT "PK_additional_drivers" PRIMARY KEY (id),
        CONSTRAINT "FK_additional_drivers_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926045917_AddRentalRequestsAndDrivers') THEN
    CREATE INDEX "IX_additional_drivers_rental_request_id" ON additional_drivers (rental_request_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926045917_AddRentalRequestsAndDrivers') THEN
    CREATE INDEX "IX_rental_requests_car_id" ON rental_requests (car_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260926045917_AddRentalRequestsAndDrivers') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260926045917_AddRentalRequestsAndDrivers', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261001032626_AddAppUsersTable') THEN
    CREATE TABLE app_users (
        id uuid NOT NULL,
        email character varying(255) NOT NULL,
        password_hash character varying(255) NOT NULL,
        full_name character varying(100) NOT NULL,
        phone_number character varying(20),
        role character varying(20) NOT NULL,
        is_active boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_app_users" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261001032626_AddAppUsersTable') THEN
    CREATE UNIQUE INDEX "IX_app_users_email" ON app_users (email);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261001032626_AddAppUsersTable') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261001032626_AddAppUsersTable', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE TABLE car_insurances (
        id uuid NOT NULL,
        car_id uuid NOT NULL,
        provider character varying(150) NOT NULL,
        start_date timestamp with time zone NOT NULL,
        end_date timestamp with time zone NOT NULL,
        insurance_type character varying(50) NOT NULL,
        policy_number character varying(100) NOT NULL,
        coverage_summary text,
        deductible_amount numeric NOT NULL,
        premium_amount numeric NOT NULL,
        certificate_image_url text,
        status character varying(50) NOT NULL,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_car_insurances" PRIMARY KEY (id),
        CONSTRAINT "FK_car_insurances_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE TABLE handover_protocols (
        id uuid NOT NULL,
        protocol_number character varying(50),
        rental_request_id uuid,
        contract_id uuid,
        staff_id uuid,
        staff_name character varying(100) NOT NULL,
        customer_name character varying(100),
        customer_phone character varying(20),
        start_km integer NOT NULL,
        fuel_level integer NOT NULL,
        damages_desc text,
        images text,
        exterior_condition text,
        interior_condition text,
        tire_condition text,
        accessories_checklist text,
        staff_notes text,
        staff_signature text,
        status character varying(50) NOT NULL,
        handover_date timestamp with time zone NOT NULL,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_handover_protocols" PRIMARY KEY (id),
        CONSTRAINT "FK_handover_protocols_rental_contracts_contract_id" FOREIGN KEY (contract_id) REFERENCES rental_contracts (id),
        CONSTRAINT "FK_handover_protocols_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE TABLE incident_reports (
        id uuid NOT NULL,
        incident_code character varying(50),
        rental_request_id uuid NOT NULL,
        car_id uuid NOT NULL,
        customer_id uuid,
        customer_name character varying(100) NOT NULL,
        customer_phone character varying(20) NOT NULL,
        incident_type character varying(50) NOT NULL,
        severity character varying(50) NOT NULL,
        location text NOT NULL,
        description text NOT NULL,
        photo_urls text,
        has_injuries boolean NOT NULL,
        status character varying(50) NOT NULL,
        resolution_action character varying(50),
        replacement_car_id uuid,
        estimated_damage_cost numeric(18,2) NOT NULL,
        insurance_coverage_status character varying(50),
        customer_pay_amount numeric(18,2) NOT NULL,
        company_pay_amount numeric(18,2) NOT NULL,
        staff_notes text,
        handled_by_staff_name character varying(100),
        created_at timestamp with time zone NOT NULL,
        resolved_at timestamp with time zone,
        CONSTRAINT "PK_incident_reports" PRIMARY KEY (id),
        CONSTRAINT "FK_incident_reports_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
        CONSTRAINT "FK_incident_reports_cars_replacement_car_id" FOREIGN KEY (replacement_car_id) REFERENCES cars (id),
        CONSTRAINT "FK_incident_reports_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE TABLE maintenance_records (
        id uuid NOT NULL,
        maintenance_code character varying(50),
        car_id uuid NOT NULL,
        maintenance_type character varying(50) NOT NULL,
        title character varying(200) NOT NULL,
        garage_name character varying(150) NOT NULL,
        cost numeric(18,2) NOT NULL,
        odo_at_maintenance integer NOT NULL,
        scheduled_date timestamp with time zone NOT NULL,
        completed_date timestamp with time zone,
        details text,
        next_maintenance_mileage integer,
        next_maintenance_date timestamp with time zone,
        status character varying(50) NOT NULL,
        created_at timestamp with time zone NOT NULL,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_maintenance_records" PRIMARY KEY (id),
        CONSTRAINT "FK_maintenance_records_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE TABLE rental_extensions (
        id uuid NOT NULL,
        rental_request_id uuid NOT NULL,
        old_end_time timestamp with time zone NOT NULL,
        new_end_time timestamp with time zone NOT NULL,
        extended_days integer NOT NULL,
        extended_hours integer NOT NULL,
        additional_fee numeric(18,2) NOT NULL,
        reason text NOT NULL,
        status character varying(50) NOT NULL,
        staff_notes text,
        processed_by_staff_id uuid,
        processed_by_staff_name character varying(100),
        created_at timestamp with time zone NOT NULL,
        processed_at timestamp with time zone,
        CONSTRAINT "PK_rental_extensions" PRIMARY KEY (id),
        CONSTRAINT "FK_rental_extensions_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_car_insurances_car_id" ON car_insurances (car_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_handover_protocols_contract_id" ON handover_protocols (contract_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_handover_protocols_rental_request_id" ON handover_protocols (rental_request_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_incident_reports_car_id" ON incident_reports (car_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_incident_reports_rental_request_id" ON incident_reports (rental_request_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_incident_reports_replacement_car_id" ON incident_reports (replacement_car_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_maintenance_records_car_id" ON maintenance_records (car_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    CREATE INDEX "IX_rental_extensions_rental_request_id" ON rental_extensions (rental_request_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261014060016_AddOperationalAndSprintTables') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261014060016_AddOperationalAndSprintTables', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE incident_reports DROP CONSTRAINT "FK_incident_reports_cars_car_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE incident_reports DROP CONSTRAINT "FK_incident_reports_rental_requests_rental_request_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE maintenance_records DROP CONSTRAINT "FK_maintenance_records_cars_car_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_extensions DROP CONSTRAINT "FK_rental_extensions_rental_requests_rental_request_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    DROP INDEX "IX_rental_requests_car_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    DROP INDEX "IX_payments_rental_request_id";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER INDEX "IX_rental_contracts_request_id" RENAME TO ix_rental_contracts_request_id;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_requests ADD booking_type character varying(50) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_requests ADD deposit_method character varying(50) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_requests ADD driver_license_class character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_requests ADD driver_license_expiry timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_requests ADD hold_deposit_amount numeric(18,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_requests ADD hold_expires_at timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_requests ADD is_security_deposit_paid boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE handover_protocols ADD customer_signature text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE handover_protocols ADD damage_points_json text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD driver_license_back_url text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD driver_license_class character varying(20);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD driver_license_expiry timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD driver_license_front_url text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD driver_license_number character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD id_card_back_url text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD id_card_front_url text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD id_card_number character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD kyc_note text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD kyc_reviewed_at timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD kyc_status character varying(50) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD lock_reason text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE app_users ADD trust_score integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ALTER COLUMN rental_request_id DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ALTER COLUMN license_number DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ALTER COLUMN id_card_number DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD created_at timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD date_of_birth timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD license_class text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD license_expiry timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD relationship text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD status text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD user_id uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE TABLE customer_violations (
        id uuid NOT NULL,
        user_id uuid NOT NULL,
        type character varying(100) NOT NULL,
        points_change integer NOT NULL,
        reason text NOT NULL,
        officer character varying(100) NOT NULL,
        created_at timestamp with time zone NOT NULL,
        CONSTRAINT "PK_customer_violations" PRIMARY KEY (id),
        CONSTRAINT "FK_customer_violations_app_users_user_id" FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE TABLE notifications (
        id uuid NOT NULL,
        user_id uuid NOT NULL,
        title character varying(200) NOT NULL,
        message text NOT NULL,
        type character varying(50) NOT NULL,
        reference_id character varying(100),
        action_url character varying(255),
        is_read boolean NOT NULL,
        created_at timestamp with time zone NOT NULL,
        CONSTRAINT "PK_notifications" PRIMARY KEY (id),
        CONSTRAINT "FK_notifications_app_users_user_id" FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE TABLE refresh_tokens (
        id uuid NOT NULL,
        user_id uuid NOT NULL,
        token character varying(255) NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone NOT NULL,
        revoked_at timestamp with time zone,
        replaced_by_token character varying(255),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY (id),
        CONSTRAINT "FK_refresh_tokens_app_users_user_id" FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE TABLE return_protocols (
        id uuid NOT NULL,
        protocol_number character varying(50),
        rental_request_id uuid,
        contract_id uuid,
        staff_id uuid,
        staff_name character varying(100) NOT NULL,
        customer_name character varying(100),
        customer_phone character varying(20),
        return_date timestamp with time zone NOT NULL,
        start_km integer NOT NULL,
        end_km integer NOT NULL,
        total_km_driven integer NOT NULL,
        max_km_allowed integer,
        excess_km integer NOT NULL,
        initial_fuel_level integer NOT NULL,
        fuel_level integer NOT NULL,
        fuel_difference integer NOT NULL,
        exterior_condition text,
        interior_condition text,
        tire_condition text,
        new_damages_notes text,
        damage_points_json text,
        accessories_checklist text,
        missing_accessories text,
        evidence_photo_urls text,
        staff_notes text,
        staff_signature text,
        customer_signature text,
        next_vehicle_status character varying(50) NOT NULL,
        status character varying(50) NOT NULL,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_return_protocols" PRIMARY KEY (id),
        CONSTRAINT "FK_return_protocols_rental_contracts_contract_id" FOREIGN KEY (contract_id) REFERENCES rental_contracts (id),
        CONSTRAINT "FK_return_protocols_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE TABLE system_settings (
        key character varying(100) NOT NULL,
        value text NOT NULL,
        data_type character varying(50) NOT NULL,
        description text,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_system_settings" PRIMARY KEY (key)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE TABLE rental_settlements (
        id uuid NOT NULL,
        settlement_number character varying(50),
        rental_request_id uuid,
        contract_id uuid,
        return_protocol_id uuid,
        rental_fee numeric(18,2) NOT NULL,
        deposit_amount numeric(18,2) NOT NULL,
        extra_km_fee numeric(18,2) NOT NULL,
        late_hours numeric(5,2) NOT NULL,
        late_return_fee numeric(18,2) NOT NULL,
        fuel_fee numeric(18,2) NOT NULL,
        damage_fee numeric(18,2) NOT NULL,
        cleaning_fee numeric(18,2) NOT NULL,
        other_fee numeric(18,2) NOT NULL,
        other_fee_notes text,
        total_deduction numeric(18,2) NOT NULL,
        balance_amount numeric(18,2) NOT NULL,
        settlement_type character varying(50) NOT NULL,
        refund_amount numeric(18,2) NOT NULL,
        traffic_fine_hold_amount numeric(18,2) NOT NULL,
        traffic_fine_refund_date timestamp with time zone,
        traffic_fine_refund_status character varying(50) NOT NULL,
        traffic_fine_actual_deduction numeric(18,2) NOT NULL,
        traffic_fine_actual_refund numeric(18,2) NOT NULL,
        traffic_fine_refunded_at timestamp with time zone,
        traffic_fine_transaction_code character varying(100),
        traffic_fine_notes text,
        traffic_fine_violation_proof_url text,
        additional_amount_due numeric(18,2) NOT NULL,
        refund_status character varying(50) NOT NULL,
        refund_method character varying(50) NOT NULL,
        refund_bank_name character varying(100),
        refund_account_number character varying(50),
        refund_account_name character varying(100),
        refund_transaction_code character varying(100),
        refund_proof_url text,
        refunded_at timestamp with time zone,
        staff_notes text,
        status character varying(50) NOT NULL,
        settled_at timestamp with time zone,
        created_at timestamp with time zone,
        updated_at timestamp with time zone,
        CONSTRAINT "PK_rental_settlements" PRIMARY KEY (id),
        CONSTRAINT "FK_rental_settlements_rental_contracts_contract_id" FOREIGN KEY (contract_id) REFERENCES rental_contracts (id),
        CONSTRAINT "FK_rental_settlements_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id),
        CONSTRAINT "FK_rental_settlements_return_protocols_return_protocol_id" FOREIGN KEY (return_protocol_id) REFERENCES return_protocols (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX ix_rental_requests_car_id_status_start_end ON rental_requests (car_id, status, start_time, end_time);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX ix_rental_requests_customer_email_created_at ON rental_requests (customer_email, created_at DESC);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX ix_payments_rental_request_id_type_status ON payments (rental_request_id, type, status);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE UNIQUE INDEX ix_payments_transaction_code_unique ON payments (transaction_code) WHERE transaction_code IS NOT NULL AND transaction_code <> '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX ix_car_insurances_end_date ON car_insurances (end_date);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_additional_drivers_user_id" ON additional_drivers (user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_customer_violations_user_id" ON customer_violations (user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_notifications_user_id_is_read_created_at" ON notifications (user_id, is_read, created_at);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_refresh_tokens_user_id" ON refresh_tokens (user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_rental_settlements_contract_id" ON rental_settlements (contract_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_rental_settlements_rental_request_id" ON rental_settlements (rental_request_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_rental_settlements_return_protocol_id" ON rental_settlements (return_protocol_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_return_protocols_contract_id" ON return_protocols (contract_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    CREATE INDEX "IX_return_protocols_rental_request_id" ON return_protocols (rental_request_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE additional_drivers ADD CONSTRAINT "FK_additional_drivers_app_users_user_id" FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE incident_reports ADD CONSTRAINT "FK_incident_reports_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE incident_reports ADD CONSTRAINT "FK_incident_reports_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id) ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE maintenance_records ADD CONSTRAINT "FK_maintenance_records_cars_car_id" FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    ALTER TABLE rental_extensions ADD CONSTRAINT "FK_rental_extensions_rental_requests_rental_request_id" FOREIGN KEY (rental_request_id) REFERENCES rental_requests (id) ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119064208_AddSystemSettingsAndNotifications') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261119064208_AddSystemSettingsAndNotifications', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119100000_StandardizeDatabaseAndAuditSafety') THEN
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119100000_StandardizeDatabaseAndAuditSafety') THEN

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
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119100000_StandardizeDatabaseAndAuditSafety') THEN

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
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119100000_StandardizeDatabaseAndAuditSafety') THEN

                    CREATE INDEX IF NOT EXISTS ix_rental_requests_car_id_status_start_end
                        ON rental_requests (car_id, status, start_time, end_time);

                    CREATE INDEX IF NOT EXISTS ix_rental_requests_customer_email_created_at
                        ON rental_requests (customer_email, created_at DESC);

                    CREATE INDEX IF NOT EXISTS ix_rental_contracts_request_id
                        ON rental_contracts (request_id);

                    CREATE UNIQUE INDEX IF NOT EXISTS ix_payments_transaction_code_unique
                        ON payments (transaction_code)
                        WHERE transaction_code IS NOT NULL AND transaction_code <> '';

                    CREATE INDEX IF NOT EXISTS ix_payments_rental_request_id_type_status
                        ON payments (rental_request_id, type, status);

                    CREATE INDEX IF NOT EXISTS ix_car_insurances_end_date
                        ON car_insurances (end_date);
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119100000_StandardizeDatabaseAndAuditSafety') THEN

                    DROP TABLE IF EXISTS contract_extensions CASCADE;
                    DROP TABLE IF EXISTS customer_profiles CASCADE;
                    DROP TABLE IF EXISTS settlements CASCADE;
                    DROP TABLE IF EXISTS incidents CASCADE;
                    DROP TABLE IF EXISTS users CASCADE;
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261119100000_StandardizeDatabaseAndAuditSafety') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261119100000_StandardizeDatabaseAndAuditSafety', '10.0.12');
    END IF;
END $EF$;
COMMIT;

