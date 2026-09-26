using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("pricing_policies")]
    public class PricingPolicy
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("car_id")]
        public Guid VehicleId { get; set; }

        [ForeignKey("VehicleId")]
        public Vehicle? Vehicle { get; set; }

        [Required]
        [Range(1, 1000)]
        [Column("min_days")]
        public int MinDays { get; set; }

        [Required]
        [Range(0, 100)]
        [Column("discount_percentage", TypeName = "decimal(5,2)")]
        public decimal DiscountPercentage { get; set; }

        [Required]
        [Range(0, 100)]
        [Column("holiday_surcharge", TypeName = "decimal(5,2)")]
        public decimal HolidaySurcharge { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
