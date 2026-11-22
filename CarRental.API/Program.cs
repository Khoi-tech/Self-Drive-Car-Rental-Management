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
using CarRental.API.Workers;


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
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddSignalR();
builder.Services.AddMemoryCache();

#pragma warning disable EXTEXP0018
builder.Services.AddHybridCache(options =>
{
    options.DefaultEntryOptions = new Microsoft.Extensions.Caching.Hybrid.HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(30),
        LocalCacheExpiration = TimeSpan.FromMinutes(30)
    };
});
#pragma warning restore EXTEXP0018

// Policy-based Authorization Setup
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Operations", policy =>
        policy.RequireRole("ADMIN", "MANAGER", "STAFF"));

    options.AddPolicy("Management", policy =>
        policy.RequireRole("ADMIN", "MANAGER"));

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("ADMIN"));

    options.AddPolicy("CustomerOrStaff", policy =>
        policy.RequireRole("CUSTOMER", "ADMIN", "MANAGER", "STAFF"));
});

// Dependency Injection
builder.Services.AddHttpClient<IStorageService, StorageService>();
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
builder.Services.AddScoped<ISystemSettingsService, SystemSettingsService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Background Workers
builder.Services.AddHostedService<FastHoldExpirationWorker>();
builder.Services.AddHostedService<DailyOperationalAlertsWorker>();

// Build app
var app = builder.Build();

// Database initialization & Seeding
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try {
        db.Database.ExecuteSqlRaw(@"
            -- Extension
            CREATE EXTENSION IF NOT EXISTS btree_gist;

            -- 1. app_users columns
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS kyc_status character varying(20) NOT NULL DEFAULT 'NOT_SUBMITTED';
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamp with time zone NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS kyc_note character varying(500) NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_number character varying(50) NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_class character varying(20) NULL DEFAULT 'B2';
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_expiry timestamp with time zone NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS id_card_front_url text NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS id_card_back_url text NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_front_url text NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS driver_license_back_url text NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS id_card_number character varying(50) NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 100;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NULL;

            -- 2. refresh_tokens
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id uuid NOT NULL,
                user_id uuid NOT NULL,
                token character varying(500) NOT NULL,
                expires_at timestamp with time zone NOT NULL,
                created_at timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                revoked_at timestamp with time zone NULL,
                replaced_by_token character varying(255) NULL,
                CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
                CONSTRAINT fk_refresh_tokens_users_user_id FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
            );
            ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NULL;
            ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone NULL;
            ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS replaced_by_token character varying(255) NULL;
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'jwt_id') THEN
                    ALTER TABLE refresh_tokens ALTER COLUMN jwt_id DROP NOT NULL;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'expiry_date') THEN
                    ALTER TABLE refresh_tokens ALTER COLUMN expiry_date DROP NOT NULL;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'is_used') THEN
                    ALTER TABLE refresh_tokens ALTER COLUMN is_used DROP NOT NULL;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'is_revoked') THEN
                    ALTER TABLE refresh_tokens ALTER COLUMN is_revoked DROP NOT NULL;
                END IF;
            END $$;
            CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token ON refresh_tokens (token);
            CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id);

            -- 3. customer_violations
            CREATE TABLE IF NOT EXISTS customer_violations (
                id uuid NOT NULL,
                user_id uuid NULL,
                customer_id uuid NULL,
                date timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                type character varying(100) NOT NULL,
                reason text NULL,
                description text NULL,
                officer character varying(100) NULL DEFAULT 'Hệ thống',
                points_change integer NOT NULL DEFAULT 0,
                fine numeric(18,2) NOT NULL DEFAULT 0,
                severity character varying(20) NOT NULL DEFAULT 'MINOR',
                created_at timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                CONSTRAINT pk_customer_violations PRIMARY KEY (id)
            );
            ALTER TABLE customer_violations ADD COLUMN IF NOT EXISTS user_id uuid NULL;
            ALTER TABLE customer_violations ADD COLUMN IF NOT EXISTS points_change integer NOT NULL DEFAULT 0;
            ALTER TABLE customer_violations ADD COLUMN IF NOT EXISTS reason text NULL;
            ALTER TABLE customer_violations ADD COLUMN IF NOT EXISTS officer character varying(100) NULL DEFAULT 'Hệ thống';
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_violations' AND column_name = 'customer_id') THEN
                    UPDATE customer_violations SET user_id = customer_id WHERE user_id IS NULL;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_violations' AND column_name = 'description') THEN
                    UPDATE customer_violations SET reason = description WHERE reason IS NULL;
                END IF;
            END $$;
            CREATE INDEX IF NOT EXISTS ix_customer_violations_user_id ON customer_violations (user_id);

            -- 3b. additional_drivers
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS user_id uuid NULL;
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS rental_request_id uuid NULL;
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS id_card_number character varying(50) NULL;
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS license_number character varying(50) NULL;
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS relationship character varying(50) NULL;
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS date_of_birth timestamp with time zone NULL;
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS license_class character varying(20) NULL DEFAULT 'B2';
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS license_expiry timestamp with time zone NULL;
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS status character varying(50) NOT NULL DEFAULT 'VERIFIED';
            ALTER TABLE additional_drivers ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc');
            CREATE INDEX IF NOT EXISTS ix_additional_drivers_user_id ON additional_drivers (user_id);

            -- 4. system_settings
            CREATE TABLE IF NOT EXISTS system_settings (
                key character varying(100) NOT NULL,
                value text NOT NULL,
                data_type character varying(20) NOT NULL DEFAULT 'string',
                description character varying(255) NULL,
                updated_at timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                CONSTRAINT pk_system_settings PRIMARY KEY (key)
            );

            -- 5. notifications
            CREATE TABLE IF NOT EXISTS notifications (
                id uuid NOT NULL,
                user_id uuid NOT NULL,
                title character varying(200) NOT NULL,
                message text NOT NULL,
                type character varying(50) NOT NULL DEFAULT 'SYSTEM',
                reference_id character varying(100) NULL,
                action_url character varying(500) NULL,
                is_read boolean NOT NULL DEFAULT FALSE,
                created_at timestamp with time zone NOT NULL DEFAULT (now() at time zone 'utc'),
                CONSTRAINT pk_notifications PRIMARY KEY (id),
                CONSTRAINT fk_notifications_users_user_id FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS ix_notifications_user_id_is_read_created_at ON notifications (user_id, is_read, created_at);

            -- 6. rental_requests extra columns
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS booking_type character varying(50) NOT NULL DEFAULT 'STANDARD';
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS deposit_method character varying(50) NOT NULL DEFAULT 'CASH';
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS driver_license_class character varying(20) NULL DEFAULT 'B2';
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS driver_license_expiry timestamp with time zone NULL;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS hold_deposit_amount numeric(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS hold_expires_at timestamp with time zone NULL;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS delivery_method character varying(30) NOT NULL DEFAULT 'SELF_PICKUP';
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS estimated_delivery_distance_km numeric(8,2) NULL;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS declared_dob date NULL;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS declared_license_class character varying(20) NULL;
            ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS declared_license_issue_date date NULL;

            -- 6b. rental_conditions & app_users extended eligibility columns
            ALTER TABLE rental_conditions ADD COLUMN IF NOT EXISTS required_license_class character varying(20) NOT NULL DEFAULT 'B1';
            ALTER TABLE rental_conditions ADD COLUMN IF NOT EXISTS min_completed_trips integer NOT NULL DEFAULT 0;
            ALTER TABLE rental_conditions ADD COLUMN IF NOT EXISTS require_verified_kyc boolean NOT NULL DEFAULT FALSE;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS date_of_birth date NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS license_class character varying(20) NULL;
            ALTER TABLE app_users ADD COLUMN IF NOT EXISTS license_issue_date date NULL;

            -- 6c. Default system_settings for rental conditions fallback
            INSERT INTO system_settings (key, value, data_type, description, updated_at)
            VALUES
                ('default_min_age', '21', 'INTEGER', 'Độ tuổi tối thiểu mặc định hệ thống khi xe chưa thiết lập điều kiện riêng', NOW() AT TIME ZONE 'utc'),
                ('default_min_driving_years', '1', 'INTEGER', 'Số năm kinh nghiệm lái xe tối thiểu mặc định hệ thống', NOW() AT TIME ZONE 'utc'),
                ('default_required_license', 'B1', 'STRING', 'Hạng GPLX tối thiểu mặc định hệ thống (B1, B2, C)', NOW() AT TIME ZONE 'utc'),
                ('default_extra_km_rate', '5000', 'DECIMAL', 'Đơn giá phụ thu vượt hạn mức km mặc định hệ thống (VNĐ/km)', NOW() AT TIME ZONE 'utc')
            ON CONFLICT (key) DO NOTHING;

            -- 7. rental_contracts extra columns
            ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS cancellation_reason text NULL;
            ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone NULL;

            -- 8. payments extra columns
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_purpose character varying(50) NOT NULL DEFAULT 'DEPOSIT';
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_metadata text NULL;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_name character varying(100) NULL;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_account_number character varying(50) NULL;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_account_name character varying(150) NULL;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_webhook_payload text NULL;
            ALTER TABLE payments ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone NULL;

            -- 9. rental_settlements extra columns
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_hold_amount numeric(18,2) NOT NULL DEFAULT 0;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_refund_date timestamp with time zone NULL;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_settled_at timestamp with time zone NULL;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_refund_payment_id uuid NULL;
            ALTER TABLE rental_settlements ADD COLUMN IF NOT EXISTS traffic_fine_notes text NULL;

            -- 10. Mark migration as applied in history if not present
            CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                ""MigrationId"" character varying(150) NOT NULL,
                ""ProductVersion"" character varying(32) NOT NULL,
                CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
            );
            INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            VALUES ('20261119064208_AddSystemSettingsAndNotifications', '10.0.12')
            ON CONFLICT (""MigrationId"") DO NOTHING;
        ");
        Console.WriteLine("[Database Schema Sync]: Schema synchronized successfully.");
    } catch (Exception ex) {
        Console.WriteLine($"[Database Schema Sync Notice]: {ex.Message}");
    }

    try {
        db.Database.Migrate();
    } catch (Exception ex) {
        Console.WriteLine($"[Database Migration Notice]: {ex.Message}");
    }

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

        if (!db.Users.Any(u => u.Email == "hoangminh.nguyen@gmail.com"))
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = "hoangminh.nguyen@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Velora@2026"),
                FullName = "Nguyễn Hoàng Minh",
                PhoneNumber = "0912345678",
                Role = "CUSTOMER",
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

        if (!db.Users.Any(u => u.Email == "manager@velora.vn"))
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = "manager@velora.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Velora@2026"),
                FullName = "Quản lý Vận hành VELORA",
                PhoneNumber = "0908889999",
                Role = "MANAGER",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!db.Users.Any(u => u.Email == "admin@velora.vn"))
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@velora.vn",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Velora@2026"),
                FullName = "Chủ hệ thống Admin VELORA",
                PhoneNumber = "0909999999",
                Role = "ADMIN",
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

        // Seed default system settings if not existing
        try
        {
            if (!db.SystemSettings.Any())
            {
                db.SystemSettings.AddRange(
                    new SystemSetting
                    {
                        Key = "vietqr_discount_percent",
                        Value = "5",
                        DataType = "DECIMAL",
                        Description = "Tỷ lệ chiết khấu (%) khi thanh toán trực tuyến VietQR",
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SystemSetting
                    {
                        Key = "fast_hold_deposit_amount",
                        Value = "500000",
                        DataType = "DECIMAL",
                        Description = "Số tiền cọc giữ xe siêu tốc Fast Hold (VNĐ)",
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SystemSetting
                    {
                        Key = "fast_hold_expiry_hours",
                        Value = "4",
                        DataType = "INTEGER",
                        Description = "Thời hạn giữ chỗ Fast Hold (giờ) trước khi tự động hủy",
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SystemSetting
                    {
                        Key = "traffic_fine_hold_amount",
                        Value = "2000000",
                        DataType = "DECIMAL",
                        Description = "Khoản tiền giữ lại đối soát phạt nguội khi quyết toán (VNĐ)",
                        UpdatedAt = DateTime.UtcNow
                    },
                    new SystemSetting
                    {
                        Key = "traffic_fine_hold_days",
                        Value = "30",
                        DataType = "INTEGER",
                        Description = "Số ngày phong tỏa tiền cọc đối soát phạt nguội",
                        UpdatedAt = DateTime.UtcNow
                    }
                );
                db.SaveChanges();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Settings Seeding Notice]: {ex.Message}");
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

app.UseCors(x => x
    .SetIsOriginAllowed(_ => true)
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseMiddleware<CarRental.API.Middleware.UserActiveStatusMiddleware>();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();
app.MapHub<CarRental.API.Hubs.NotificationHub>("/hubs/notifications");

app.Run();
