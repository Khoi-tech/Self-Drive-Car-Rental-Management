using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("cars")]
    public class Vehicle
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        [Column("brand")]
        public string Make { get; set; } = null!;

        [Required]
        [MaxLength(100)]
        [Column("model")]
        public string Model { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        [Column("license_plate")]
        public string LicensePlate { get; set; } = null!;

        [Range(1, 50)]
        [Column("seats")]
        public int Seats { get; set; }

        [Required]
        [Column("transmission", TypeName = "public.car_transmission")]
        public TransmissionType Transmission { get; set; }

        [Column("fuel_type", TypeName = "public.fuel_type")]
        public FuelType FuelType { get; set; }

        [Column("manufacture_year")]
        public int ManufactureYear { get; set; }

        [Column("base_price", TypeName = "decimal(18,2)")]
        public decimal DailyRate { get; set; }

        [Column("deposit_amount", TypeName = "decimal(18,2)")]
        public decimal DepositAmount { get; set; }

        [Column("current_mileage")]
        public int CurrentMileage { get; set; } = 0;

        [Column("included_km_per_day")]
        public int? MileageLimit { get; set; }

        [Column("extra_km_rate")]
        public decimal? ExtraKmRate { get; set; }

        [Column("fuel_return_policy")]
        [MaxLength(30)]
        public string FuelReturnPolicy { get; set; } = "SAME_LEVEL";

        [Column("next_maintenance_date")]
        public DateTime? NextMaintenanceDate { get; set; }

        [Column("next_maintenance_mileage")]
        public int? NextMaintenanceMileage { get; set; }

        [Column("pickup_location")]
        [MaxLength(255)]
        public string? PickupLocation { get; set; }

        [Column("status", TypeName = "public.car_status")]
        public VehicleStatus Status { get; set; } = VehicleStatus.READY;

        [Column("image_url")]
        [MaxLength(1000)]
        public string? ImageUrl { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public ICollection<PricingPolicy> PricingPolicies { get; set; } = new List<PricingPolicy>();
        public virtual RentalCondition? RentalCondition { get; set; }
    }
}
