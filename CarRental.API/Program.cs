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

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
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
var jwtKey = builder.Configuration["Jwt:Key"] ?? "VeloraSuperSecretKeyForJwtAuthentication2026!@#$%";
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
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING_CUSTOMER';
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS handover_date TIMESTAMPTZ DEFAULT NOW();
            ALTER TABLE handover_protocols ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
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
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();
