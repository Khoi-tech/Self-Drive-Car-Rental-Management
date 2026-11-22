using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("rental_conditions")]
    public class RentalCondition
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Column("car_id")]
        public Guid? CarId { get; set; }

        [Column("min_age")]
        public int? MinAge { get; set; }

        [Column("require_driving_years")]
        public int? RequireDrivingYears { get; set; }

        [Column("required_license_class")]
        [MaxLength(20)]
        public string RequiredLicenseClass { get; set; } = "B1"; // B1, B2, C

        [Column("min_completed_trips")]
        public int MinCompletedTrips { get; set; } = 0;

        [Column("require_verified_kyc")]
        public bool RequireVerifiedKyc { get; set; } = false;

        [Column("other_conditions")]
        public string? OtherConditions { get; set; }

        [ForeignKey("CarId")]
        public virtual Vehicle? Vehicle { get; set; }
    }
}
