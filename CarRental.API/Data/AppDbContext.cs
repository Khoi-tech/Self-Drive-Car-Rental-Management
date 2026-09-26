using Microsoft.EntityFrameworkCore;
using CarRental.API.Entities;

namespace CarRental.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Vehicle> Vehicles { get; set; } = null!;
        public DbSet<PricingPolicy> PricingPolicies { get; set; } = null!;
        public DbSet<RentalCondition> RentalConditions { get; set; } = null!;
        public DbSet<CompensationPolicy> CompensationPolicies { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var nameTranslator = new Npgsql.NameTranslation.NpgsqlNullNameTranslator();
            modelBuilder.HasPostgresEnum<VehicleStatus>("public", "car_status", nameTranslator: nameTranslator);
            modelBuilder.HasPostgresEnum<FuelType>("public", "fuel_type", nameTranslator: nameTranslator);
            modelBuilder.HasPostgresEnum<TransmissionType>("public", "car_transmission", nameTranslator: nameTranslator);

            // Configure LicensePlate to be unique
            modelBuilder.Entity<Vehicle>()
                .HasIndex(v => v.LicensePlate)
                .IsUnique();

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.Transmission)
                .HasConversion<string>();

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.FuelType)
                .HasConversion<string>();

            // Configure 1-to-0..1 relationship
            modelBuilder.Entity<RentalCondition>()
                .HasOne(rc => rc.Vehicle)
                .WithOne(v => v.RentalCondition)
                .HasForeignKey<RentalCondition>(rc => rc.CarId);
        }
    }
}
