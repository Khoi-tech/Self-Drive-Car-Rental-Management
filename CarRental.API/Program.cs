using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using CarRental.API.Data;
using CarRental.API.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Swagger/OpenAPI setup
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database Configuration
// It will try to get the connection string from user secrets or environment variables
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Host=localhost;Database=CarRental;Username=postgres;Password=YOUR_PASSWORD";

var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
var nameTranslator = new Npgsql.NameTranslation.NpgsqlNullNameTranslator();
dataSourceBuilder.MapEnum<CarRental.API.Entities.VehicleStatus>("car_status", nameTranslator);
dataSourceBuilder.MapEnum<CarRental.API.Entities.FuelType>("fuel_type", nameTranslator);
dataSourceBuilder.MapEnum<CarRental.API.Entities.TransmissionType>("car_transmission", nameTranslator);
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(dataSource));

// Dependency Injection
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IPricingPolicyService, PricingPolicyService>();
builder.Services.AddScoped<IRentalConditionService, RentalConditionService>();
builder.Services.AddScoped<ICompensationPolicyService, CompensationPolicyService>();

// Build app
var app = builder.Build();

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
        ");
    } catch { /* Ignore if it fails due to permissions or already exists */ }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseAuthorization();
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();
