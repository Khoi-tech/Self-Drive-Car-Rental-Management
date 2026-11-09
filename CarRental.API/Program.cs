using System;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using CarRental.API.Data;
using CarRental.API.Entities;
using CarRental.API.Services;

// Enable legacy timestamp behavior to allow local and UTC DateTimes seamlessly with PostgreSQL
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
    });

// Swagger/OpenAPI setup with JWT Bearer Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "VELORA Self-Drive Car Rental API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập token JWT theo định dạng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
});

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Host=localhost;Database=CarRental;Username=postgres;Password=YOUR_PASSWORD";

var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
var nameTranslator = new Npgsql.NameTranslation.NpgsqlNullNameTranslator();
dataSourceBuilder.MapEnum<VehicleStatus>("car_status", nameTranslator);
dataSourceBuilder.MapEnum<FuelType>("fuel_type", nameTranslator);
dataSourceBuilder.MapEnum<TransmissionType>("car_transmission", nameTranslator);
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(dataSource));

// JWT Authentication Configuration
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException("Cấu hình khóa bí mật Jwt:Key không tồn tại hoặc chưa được thiết lập.");
}
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CarRental.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CarRental.Web";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Dependency Injection
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IPricingPolicyService, PricingPolicyService>();
builder.Services.AddScoped<IRentalConditionService, RentalConditionService>();
builder.Services.AddScoped<ICompensationPolicyService, CompensationPolicyService>();
builder.Services.AddScoped<IContractTemplateService, ContractTemplateService>();
builder.Services.AddScoped<IRentalRequestService, RentalRequestService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRentalContractService, RentalContractService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ICarInsuranceService, CarInsuranceService>();
builder.Services.AddScoped<IHandoverProtocolService, HandoverProtocolService>();
builder.Services.AddScoped<IRentalExtensionService, RentalExtensionService>();
builder.Services.AddScoped<IIncidentReportService, IncidentReportService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IReturnProtocolService, ReturnProtocolService>();
builder.Services.AddScoped<ISettlementService, SettlementService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

// Build app
var app = builder.Build();

// Database initialization & Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try {
        db.Database.ExecuteSqlRaw(@"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_cast WHERE castsource = 'text'::regtype AND casttarget = 'car_status'::regtype) THEN
                    CREATE CAST (text AS public.car_status) WITH INOUT AS IMPLICIT;
                    CREATE CAST (character varying AS public.car_status) WITH INOUT AS IMPLICIT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_cast WHERE castsource = 'public.car_status'::regtype AND casttarget = 'text'::regtype) THEN
                    CREATE CAST (public.car_status AS text) WITH INOUT AS IMPLICIT;
                    CREATE CAST (public.car_status AS character varying) WITH INOUT AS IMPLICIT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_cast WHERE castsource = 'text'::regtype AND casttarget = 'fuel_type'::regtype) THEN
                    CREATE CAST (text AS public.fuel_type) WITH INOUT AS IMPLICIT;
                    CREATE CAST (character varying AS public.fuel_type) WITH INOUT AS IMPLICIT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_cast WHERE castsource = 'public.fuel_type'::regtype AND casttarget = 'text'::regtype) THEN
                    CREATE CAST (public.fuel_type AS text) WITH INOUT AS IMPLICIT;
                    CREATE CAST (public.fuel_type AS character varying) WITH INOUT AS IMPLICIT;
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_cast WHERE castsource = 'text'::regtype AND casttarget = 'car_transmission'::regtype) THEN
                    CREATE CAST (text AS public.car_transmission) WITH INOUT AS IMPLICIT;
                    CREATE CAST (character varying AS public.car_transmission) WITH INOUT AS IMPLICIT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_cast WHERE castsource = 'public.car_transmission'::regtype AND casttarget = 'text'::regtype) THEN
                    CREATE CAST (public.car_transmission AS text) WITH INOUT AS IMPLICIT;
                    CREATE CAST (public.car_transmission AS character varying) WITH INOUT AS IMPLICIT;
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS car_insurances (
                id UUID PRIMARY KEY,
                car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
                provider VARCHAR(150) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL
            );

            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(50) DEFAULT 'TNDS';
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS policy_number VARCHAR(100) DEFAULT '';
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS coverage_summary TEXT;
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS deductible_amount NUMERIC DEFAULT 0;
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS premium_amount NUMERIC DEFAULT 0;
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS certificate_image_url TEXT;
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE car_insurances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

            CREATE TABLE IF NOT EXISTS handover_protocols (
                id UUID PRIMARY KEY,
                contract_id UUID REFERENCES rental_contracts(id),
                staff_id UUID,
                start_km INT DEFAULT 0,
                fuel_level INT DEFAULT 100,
                damages_desc TEXT,
                images TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS protocol_number VARCHAR(50);
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS rental_request_id UUID;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS exterior_condition TEXT;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS interior_condition TEXT;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS tire_condition TEXT;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS accessories_checklist TEXT;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS staff_name VARCHAR(100);
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS staff_notes TEXT;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS staff_signature TEXT;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS customer_signature TEXT;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING_CUSTOMER';
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS handover_date TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
            ALTER TABLE handover_protocols ALTER COLUMN images TYPE TEXT USING images::text;

            -- SPRINT 4: Rental Extensions Table (US-08, US-20)
            CREATE TABLE IF NOT EXISTS rental_extensions (
                id UUID PRIMARY KEY,
                rental_request_id UUID NOT NULL REFERENCES rental_requests(id) ON DELETE CASCADE,
                old_end_time TIMESTAMPTZ NOT NULL,
                new_end_time TIMESTAMPTZ NOT NULL,
                extended_days INT NOT NULL DEFAULT 1,
                extended_hours INT NOT NULL DEFAULT 24,
                additional_fee NUMERIC(18,2) NOT NULL DEFAULT 0,
                reason TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                staff_notes TEXT,
                processed_by_staff_id UUID,
                processed_by_staff_name VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                processed_at TIMESTAMPTZ
            );

            -- SPRINT 4: Incident Reports Table (US-09, US-21)
            CREATE TABLE IF NOT EXISTS incident_reports (
                id UUID PRIMARY KEY,
                incident_code VARCHAR(50),
                rental_request_id UUID NOT NULL REFERENCES rental_requests(id) ON DELETE CASCADE,
                car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
                customer_id UUID,
                customer_name VARCHAR(100) NOT NULL,
                customer_phone VARCHAR(20) NOT NULL,
                incident_type VARCHAR(50) DEFAULT 'COLLISION',
                severity VARCHAR(50) DEFAULT 'MEDIUM',
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                photo_urls TEXT,
                has_injuries BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'REPORTED',
                resolution_action VARCHAR(50),
                replacement_car_id UUID REFERENCES cars(id),
                estimated_damage_cost NUMERIC(18,2) DEFAULT 0,
                insurance_coverage_status VARCHAR(50) DEFAULT 'PENDING_CLAIM',
                customer_pay_amount NUMERIC(18,2) DEFAULT 0,
                company_pay_amount NUMERIC(18,2) DEFAULT 0,
                staff_notes TEXT,
                handled_by_staff_name VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                resolved_at TIMESTAMPTZ
            );

            -- SPRINT 4: Maintenance Records Table (US-24)
            CREATE TABLE IF NOT EXISTS maintenance_records (
                id UUID PRIMARY KEY,
                maintenance_code VARCHAR(50),
                car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
                maintenance_type VARCHAR(50) DEFAULT 'ROUTINE',
                title VARCHAR(200) NOT NULL,
                garage_name VARCHAR(150) DEFAULT 'Gara chính hãng VELORA Care',
                cost NUMERIC(18,2) DEFAULT 0,
                odo_at_maintenance INT DEFAULT 0,
                scheduled_date TIMESTAMPTZ DEFAULT NOW(),
                completed_date TIMESTAMPTZ,
                details TEXT,
                next_maintenance_mileage INT,
                next_maintenance_date TIMESTAMPTZ,
                status VARCHAR(50) DEFAULT 'SCHEDULED',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ
            );

            -- SPRINT 5: Return Protocols Table (US-22)
            CREATE TABLE IF NOT EXISTS return_protocols (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS protocol_number VARCHAR(50);
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS rental_request_id UUID;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS contract_id UUID;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS staff_id UUID;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS staff_name VARCHAR(100) DEFAULT 'Nhân viên kiểm định VELORA';
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS return_date TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS start_km INT NOT NULL DEFAULT 0;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS end_km INT NOT NULL DEFAULT 0;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS fuel_level INT NOT NULL DEFAULT 100;
            ALTER TABLE return_protocols ALTER COLUMN end_km DROP NOT NULL;
            ALTER TABLE return_protocols ALTER COLUMN fuel_level DROP NOT NULL;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS total_km_driven INT NOT NULL DEFAULT 0;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS max_km_allowed INT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS excess_km INT NOT NULL DEFAULT 0;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS initial_fuel_level INT NOT NULL DEFAULT 100;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS return_fuel_level INT NOT NULL DEFAULT 100;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS fuel_difference INT NOT NULL DEFAULT 0;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS exterior_condition TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS interior_condition TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS tire_condition TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS new_damages_notes TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS accessories_checklist TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS missing_accessories TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS evidence_photo_urls TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS staff_notes TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS staff_signature TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS customer_signature TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS next_vehicle_status VARCHAR(50) DEFAULT 'READY';
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'COMPLETED';
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

            -- SPRINT 5: Rental Settlements Table (US-23)
            CREATE TABLE IF NOT EXISTS rental_settlements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS settlement_number VARCHAR(50);
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS rental_request_id UUID;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS contract_id UUID;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS return_protocol_id UUID;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS rental_fee NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS extra_km_fee NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS late_hours NUMERIC(5,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS late_return_fee NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS fuel_fee NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS damage_fee NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS other_fee NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS other_fee_notes TEXT;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS total_deduction NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS settlement_type VARCHAR(50) DEFAULT 'REFUND_TO_CUSTOMER';
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS additional_amount_due NUMERIC(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT 'PENDING';
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50) DEFAULT 'VIETQR';
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_bank_name VARCHAR(100);
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_account_number VARCHAR(50);
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_account_name VARCHAR(100);
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_transaction_code VARCHAR(100);
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refund_proof_url TEXT;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS staff_notes TEXT;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SETTLED';
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_hold_amount NUMERIC(18,2) DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_refund_date TIMESTAMPTZ;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_refund_status VARCHAR(50) DEFAULT 'NONE';
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_actual_deduction NUMERIC(18,2) DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_actual_refund NUMERIC(18,2) DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_refunded_at TIMESTAMPTZ;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_transaction_code VARCHAR(100);
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_notes TEXT;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_violation_proof_url TEXT;

            UPDATE rental_settlements 
            SET traffic_fine_refund_status = 'HOLDING' 
            WHERE traffic_fine_hold_amount > 0 AND (traffic_fine_refund_status IS NULL OR traffic_fine_refund_status = 'NONE');

            -- Clean up car brand whitespaces and Fast Hold columns
            UPDATE cars SET brand = TRIM(brand);
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS booking_type VARCHAR(50) DEFAULT 'STANDARD';
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS hold_deposit_amount NUMERIC DEFAULT 0;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS is_security_deposit_paid BOOLEAN DEFAULT FALSE;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;
            UPDATE rental_requests SET estimated_total_fee = 10500000, daily_rate = 3500000, deposit_amount = 20000000 WHERE id = '577f4870-b958-47d5-ae0e-72e23af6f5d6';
            UPDATE rental_requests SET deposit_amount = 20000000 WHERE booking_type = 'FAST_HOLD' AND (deposit_amount < 500000 OR deposit_amount IS NULL);

            -- PHASE 2: Advanced Rental Eligibility & 2D Vehicle Damage Mapping
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS driver_license_class VARCHAR(50);
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS driver_license_expiry TIMESTAMPTZ;
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS damage_points_json TEXT;
            ALTER TABLE return_protocols ADD COLUMN IF NOT EXISTS damage_points_json TEXT;

            -- Synchronize RentalRequest status to SIGNED for any orders whose contracts have already been signed
            UPDATE rental_requests r
            SET status = 'SIGNED', updated_at = NOW()
            FROM rental_contracts c
            WHERE c.request_id = r.id AND c.status = 'SIGNED' AND r.status = 'APPROVED';

            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20261014060016_AddOperationalAndSprintTables', '10.0.12')
            ON CONFLICT (""MigrationId"") DO NOTHING;
        ");
    } catch { /* Ignore if already exists */ }

    // Seed default users if not existing
    try {
        if (!db.Users.Any(u => u.Email == "staff@velora.vn"))
        {
            db.Users.Add(new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Email = "staff@velora.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Velora@2026"),
                FullName = "Nhân viên VELORA",
                PhoneNumber = "0901234567",
                Role = "STAFF",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!db.Users.Any(u => u.Email == "customer@velora.vn"))
        {
            db.Users.Add(new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Email = "customer@velora.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Velora@2026"),
                FullName = "Khách hàng Mẫu",
                PhoneNumber = "0987654321",
                Role = "CUSTOMER",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }
        db.SaveChanges();
    } catch (Exception ex) {
        Console.WriteLine($"Error seeding users: {ex.Message}");
    }

    // Seed default CarInsurances if empty
    try {
        if (!db.CarInsurances.Any())
        {
            var bmw = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "69H-69696");
            if (bmw != null)
            {
                db.CarInsurances.AddRange(
                    new CarInsurance
                    {
                        Id = Guid.NewGuid(),
                        CarId = bmw.Id,
                        InsuranceType = "TNDS",
                        InsuranceCompany = "Bảo hiểm Bảo Việt",
                        PolicyNumber = "BV-TNDS-2026-69696",
                        StartDate = DateTime.UtcNow.AddMonths(-3),
                        ExpiryDate = DateTime.UtcNow.AddMonths(9),
                        CoverageSummary = "Bồi thường trách nhiệm dân sự bắt buộc đối với người thứ ba (150.000.000 VNĐ/người/vụ).",
                        DeductibleAmount = 0,
                        PremiumAmount = 873400,
                        Status = "ACTIVE",
                        CreatedAt = DateTime.UtcNow
                    },
                    new CarInsurance
                    {
                        Id = Guid.NewGuid(),
                        CarId = bmw.Id,
                        InsuranceType = "PHYSICAL",
                        InsuranceCompany = "Tổng công ty Bảo hiểm PVI",
                        PolicyNumber = "PVI-VC-2026-88392",
                        StartDate = DateTime.UtcNow.AddMonths(-11),
                        ExpiryDate = DateTime.UtcNow.AddDays(15), // EXPIRING SOON!
                        CoverageSummary = "Bảo hiểm vật chất thân vỏ xe 2 chiều (va chạm, ngập nước, cháy nổ, mất cắp bộ phận). Khấu trừ 500.000 VNĐ/vụ.",
                        DeductibleAmount = 500000,
                        PremiumAmount = 14500000,
                        Status = "EXPIRING_SOON",
                        CreatedAt = DateTime.UtcNow
                    }
                );
            }

            var merc = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51K-888.88");
            if (merc != null)
            {
                db.CarInsurances.Add(new CarInsurance
                {
                    Id = Guid.NewGuid(),
                    CarId = merc.Id,
                    InsuranceType = "PHYSICAL",
                    InsuranceCompany = "Bảo hiểm Quân Đội (MIC)",
                    PolicyNumber = "MIC-LUX-2026-51K",
                    StartDate = DateTime.UtcNow.AddMonths(-2),
                    ExpiryDate = DateTime.UtcNow.AddMonths(10),
                    CoverageSummary = "Bảo hiểm vật chất toàn diện xe sang Mercedes-Benz C300.",
                    DeductibleAmount = 1000000,
                    PremiumAmount = 22000000,
                    Status = "ACTIVE",
                    CreatedAt = DateTime.UtcNow
                });
            }

            var vf8 = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "43A-777.77");
            if (vf8 != null)
            {
                db.CarInsurances.Add(new CarInsurance
                {
                    Id = Guid.NewGuid(),
                    CarId = vf8.Id,
                    InsuranceType = "TNDS",
                    InsuranceCompany = "Bảo hiểm Bưu Điện (PTI)",
                    PolicyNumber = "PTI-TNDS-2025-43A",
                    StartDate = DateTime.UtcNow.AddYears(-1).AddMonths(-1),
                    ExpiryDate = DateTime.UtcNow.AddDays(-10), // EXPIRED!
                    CoverageSummary = "Bảo hiểm bắt buộc ô tô điện VinFast VF8.",
                    DeductibleAmount = 0,
                    PremiumAmount = 873400,
                    Status = "EXPIRED",
                    CreatedAt = DateTime.UtcNow
                });
            }
            db.SaveChanges();
        }
    } catch (Exception ex) {
        Console.WriteLine($"Error seeding insurances: {ex.Message}");
    }

    // SEED TEST DATA FOR PHASE 1 & 2: Manual Cars & Complete Test Orders for both customer accounts
    try {
        // 1. Update 3 cars to MANUAL transmission so customers can test B1_AUTO vs MANUAL validation
        var vios = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51K-123.45");
        if (vios != null)
        {
            vios.Model = "Vios 1.5 MT (Số Sàn)";
            vios.Transmission = TransmissionType.MANUAL;
        }

        var innova = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51K-901.23");
        if (innova != null)
        {
            innova.Model = "Innova 2.0E MT (Số Sàn)";
            innova.Transmission = TransmissionType.MANUAL;
        }

        var xpander = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51K-334.55");
        if (xpander != null)
        {
            xpander.Model = "Xpander 1.5 MT (Số Sàn)";
            xpander.Transmission = TransmissionType.MANUAL;
        }

        db.SaveChanges();

        // 2. Prepare test customer accounts
        var targetEmails = new[] { "customer@velora.vn", "hhuynhkhoi1505@gmail.com" };
        var sampleDamageJson = "[{\"id\":\"dp_old_1\",\"view\":\"FRONT\",\"x\":48,\"y\":82,\"description\":\"Trầy xước nhẹ cản trước 4cm\",\"severity\":\"MINOR\",\"type\":\"OLD\",\"fee\":0},{\"id\":\"dp_new_1\",\"view\":\"REAR\",\"x\":52,\"y\":85,\"description\":\"Móp cản sau bên lái\",\"severity\":\"MODERATE\",\"type\":\"NEW\",\"fee\":500000}]";

        var carVios = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51K-123.45") ?? db.Vehicles.First();
        var carInnova = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51K-901.23") ?? db.Vehicles.Skip(1).First();
        var carBmw = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51H-97177") ?? db.Vehicles.Skip(2).First();
        var carMerc = db.Vehicles.FirstOrDefault(v => v.LicensePlate == "51K-888.88") ?? db.Vehicles.Skip(3).First();

        foreach (var email in targetEmails)
        {
            // Case A: CONFIRMED request -> Test Hủy Đơn (Cancel Rental & VietQR Refund)
            if (!db.RentalRequests.Any(r => r.CustomerEmail == email && r.Status == "CONFIRMED"))
            {
                db.RentalRequests.Add(new RentalRequest
                {
                    Id = Guid.NewGuid(),
                    CarId = carMerc.Id,
                    CustomerName = email.Contains("khoi") ? "Huỳnh Minh Khôi" : "Khách Hàng Mẫu",
                    CustomerPhone = "0909123456",
                    CustomerEmail = email,
                    CustomerIdCard = "079099123456",
                    DriverLicenseNumber = "790123999888",
                    DriverLicenseClass = "B2",
                    DriverLicenseExpiry = DateTime.UtcNow.AddYears(3),
                    StartTime = DateTime.UtcNow.AddHours(36), // > 24 hours away for 100% refund demo
                    EndTime = DateTime.UtcNow.AddHours(84),
                    PickupLocation = "VP VELORA (Trụ sở Tân Bình)",
                    DropoffLocation = "VP VELORA (Trụ sở Tân Bình)",
                    TotalDays = 2,
                    DailyRate = carMerc.DailyRate,
                    DepositAmount = carMerc.DepositAmount,
                    EstimatedTotalFee = carMerc.DailyRate * 2,
                    Status = "CONFIRMED",
                    Notes = "Đơn mẫu sẵn sàng test nút HỦY ĐƠN (Đợt 1)",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Case B: APPROVED request -> Test Bàn Giao Xe & Chấm Sơ Đồ 2D Vết Vàng
            if (!db.RentalRequests.Any(r => r.CustomerEmail == email && r.Status == "APPROVED"))
            {
                db.RentalRequests.Add(new RentalRequest
                {
                    Id = Guid.NewGuid(),
                    CarId = carVios.Id,
                    CustomerName = email.Contains("khoi") ? "Huỳnh Minh Khôi" : "Khách Hàng Mẫu",
                    CustomerPhone = "0909123456",
                    CustomerEmail = email,
                    CustomerIdCard = "079099123456",
                    DriverLicenseNumber = "790123999888",
                    DriverLicenseClass = "B2",
                    DriverLicenseExpiry = DateTime.UtcNow.AddYears(3),
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(3),
                    PickupLocation = "VP VELORA (Trụ sở Tân Bình)",
                    DropoffLocation = "VP VELORA (Trụ sở Tân Bình)",
                    TotalDays = 2,
                    DailyRate = carVios.DailyRate,
                    DepositAmount = carVios.DepositAmount,
                    EstimatedTotalFee = carVios.DailyRate * 2,
                    Status = "APPROVED",
                    Notes = "Đơn mẫu sẵn sàng test BÀN GIAO XE & SƠ ĐỒ 2D (Đợt 2)",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Case C: ACTIVE request -> Test Trả Xe, Chấm Vết Đỏ & Giữ Cọc Phạt Nguội
            if (!db.RentalRequests.Any(r => r.CustomerEmail == email && r.Status == "ACTIVE"))
            {
                var activeReqId = Guid.NewGuid();
                db.RentalRequests.Add(new RentalRequest
                {
                    Id = activeReqId,
                    CarId = carInnova.Id,
                    CustomerName = email.Contains("khoi") ? "Huỳnh Minh Khôi" : "Khách Hàng Mẫu",
                    CustomerPhone = "0909123456",
                    CustomerEmail = email,
                    CustomerIdCard = "079099123456",
                    DriverLicenseNumber = "790123999888",
                    DriverLicenseClass = "B2",
                    DriverLicenseExpiry = DateTime.UtcNow.AddYears(3),
                    StartTime = DateTime.UtcNow.AddDays(-2),
                    EndTime = DateTime.UtcNow.AddDays(1),
                    PickupLocation = "VP VELORA (Trụ sở Tân Bình)",
                    DropoffLocation = "VP VELORA (Trụ sở Tân Bình)",
                    TotalDays = 3,
                    DailyRate = carInnova.DailyRate,
                    DepositAmount = carInnova.DepositAmount,
                    EstimatedTotalFee = carInnova.DailyRate * 3,
                    Status = "ACTIVE",
                    Notes = "Đơn mẫu sẵn sàng test TRẢ XE & QUỸ PHẠT NGUỘI (Đợt 2)",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                });

                // Seed Handover Protocol for this active request
                db.HandoverProtocols.Add(new HandoverProtocol
                {
                    Id = Guid.NewGuid(),
                    ProtocolNumber = $"BBBG-{activeReqId.ToString()[..8].ToUpper()}",
                    RentalRequestId = activeReqId,
                    CustomerName = email.Contains("khoi") ? "Huỳnh Minh Khôi" : "Khách Hàng Mẫu",
                    CustomerPhone = "0909123456",
                    OdoAtHandover = 15000,
                    FuelLevel = 100,
                    ExteriorCondition = "Sơn bóng sạch, có 1 vết trầy xước nhẹ cản trước",
                    InteriorCondition = "Sạch sẽ nguyên vẹn",
                    TireCondition = "4 lốp áp suất tiêu chuẩn",
                    ExistingScratchesNotes = "Trầy xước nhẹ cản trước 4cm (đã chấm điểm vàng trên sơ đồ 2D)",
                    DamagePointsJson = "[{\"id\":\"dp_old_init\",\"view\":\"FRONT\",\"x\":48,\"y\":82,\"description\":\"Trầy cản trước 4cm\",\"severity\":\"MINOR\",\"type\":\"OLD\",\"fee\":0}]",
                    Status = "CONFIRMED",
                    HandoverDate = DateTime.UtcNow.AddDays(-2),
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                });
            }

            // Case D: COMPLETED request -> Test Xem Phiếu Quyết Toán, Quỹ Phạt Nguội & Nút Khiếu Nại (DISPUTED)
            if (!db.RentalRequests.Any(r => r.CustomerEmail == email && r.Status == "COMPLETED"))
            {
                var completedReqId = Guid.NewGuid();
                db.RentalRequests.Add(new RentalRequest
                {
                    Id = completedReqId,
                    CarId = carBmw.Id,
                    CustomerName = email.Contains("khoi") ? "Huỳnh Minh Khôi" : "Khách Hàng Mẫu",
                    CustomerPhone = "0909123456",
                    CustomerEmail = email,
                    CustomerIdCard = "079099123456",
                    DriverLicenseNumber = "790123999888",
                    DriverLicenseClass = "B2",
                    DriverLicenseExpiry = DateTime.UtcNow.AddYears(3),
                    StartTime = DateTime.UtcNow.AddDays(-5),
                    EndTime = DateTime.UtcNow.AddDays(-2),
                    PickupLocation = "VP VELORA (Trụ sở Tân Bình)",
                    DropoffLocation = "VP VELORA (Trụ sở Tân Bình)",
                    TotalDays = 3,
                    DailyRate = carBmw.DailyRate,
                    DepositAmount = carBmw.DepositAmount,
                    EstimatedTotalFee = carBmw.DailyRate * 3,
                    Status = "COMPLETED",
                    Notes = "Đơn mẫu sẵn sàng test XEM QUYẾT TOÁN & KHIẾU NẠI (DISPUTED)",
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                });

                var returnProtocolId = Guid.NewGuid();
                db.ReturnProtocols.Add(new ReturnProtocol
                {
                    Id = returnProtocolId,
                    ProtocolNumber = $"BBHT-{completedReqId.ToString()[..8].ToUpper()}",
                    RentalRequestId = completedReqId,
                    CustomerName = email.Contains("khoi") ? "Huỳnh Minh Khôi" : "Khách Hàng Mẫu",
                    CustomerPhone = "0909123456",
                    StartOdo = 20000,
                    EndOdo = 20380,
                    TotalKmDriven = 380,
                    InitialFuelLevel = 100,
                    ReturnFuelLevel = 100,
                    ExteriorCondition = "Có 1 vết móp mới cản sau bên lái",
                    NewDamagesNotes = "Vết móp cản sau bên lái (Phạt: 500.000 đ)",
                    DamagePointsJson = sampleDamageJson,
                    Status = "COMPLETED",
                    ReturnDate = DateTime.UtcNow.AddDays(-2),
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                });

                db.RentalSettlements.Add(new RentalSettlement
                {
                    Id = Guid.NewGuid(),
                    SettlementNumber = $"QT-{DateTime.UtcNow:yyyyMMdd}-{completedReqId.ToString()[..4].ToUpper()}",
                    RentalRequestId = completedReqId,
                    ReturnProtocolId = returnProtocolId,
                    RentalFee = carBmw.DailyRate * 3,
                    DepositAmount = carBmw.DepositAmount,
                    DamageFee = 500000,
                    TotalDeduction = 500000,
                    BalanceAmount = carBmw.DepositAmount - 500000,
                    SettlementType = "REFUND_TO_CUSTOMER",
                    RefundAmount = carBmw.DepositAmount - 500000,
                    TrafficFineHoldAmount = 2000000,
                    TrafficFineRefundDate = DateTime.UtcNow.AddDays(20),
                    RefundStatus = "REFUNDED",
                    RefundMethod = "VIETQR",
                    RefundBankName = "VCB",
                    RefundAccountNumber = "0123456789",
                    RefundAccountName = email.Contains("khoi") ? "HUYNH MINH KHOI" : "KHACH HANG MAU",
                    RefundTransactionCode = "FT26295819028",
                    StaffNotes = "Đã đối soát xong biên bản hoàn trả xe. Tạm giữ 2.000.000 VNĐ quỹ cọc phạt nguội.",
                    Status = "SETTLED",
                    SettledAt = DateTime.UtcNow.AddDays(-2),
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                });
            }
        }

        db.SaveChanges();
    } catch (Exception ex) {
        Console.WriteLine($"Error seeding test data: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();
