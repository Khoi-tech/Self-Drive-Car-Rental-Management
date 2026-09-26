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

        [Column("other_conditions")]
        public string? OtherConditions { get; set; }

        [ForeignKey("CarId")]
        public virtual Vehicle? Vehicle { get; set; }
    }
}
