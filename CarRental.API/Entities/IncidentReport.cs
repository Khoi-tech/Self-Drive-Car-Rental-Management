using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("incident_reports")]
    public class IncidentReport
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("incident_code")]
        [MaxLength(50)]
        public string? IncidentCode { get; set; }

        [Required]
        [Column("rental_request_id")]
        public Guid RentalRequestId { get; set; }

        [ForeignKey("RentalRequestId")]
        public virtual RentalRequest? RentalRequest { get; set; }

        [Required]
        [Column("car_id")]
        public Guid CarId { get; set; }

        [ForeignKey("CarId")]
        public virtual Vehicle? Vehicle { get; set; }

        [Column("customer_id")]
        public Guid? CustomerId { get; set; }

        [Column("customer_name")]
        [MaxLength(100)]
        public string CustomerName { get; set; } = null!;

        [Column("customer_phone")]
        [MaxLength(20)]
        public string CustomerPhone { get; set; } = null!;

        [Column("incident_type")]
        [MaxLength(50)]
        public string IncidentType { get; set; } = "COLLISION"; // COLLISION, BREAKDOWN, FLAT_TIRE, FLOOD, OTHER

        [Column("severity")]
        [MaxLength(50)]
        public string Severity { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH

        [Column("location")]
        public string Location { get; set; } = null!;

        [Column("description")]
        public string Description { get; set; } = null!;

        [Column("photo_urls")]
        public string? PhotoUrls { get; set; }

        [Column("has_injuries")]
        public bool HasInjuries { get; set; } = false;

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "REPORTED"; // REPORTED, INVESTIGATING, RESOLVED, CANCELLED

        [Column("resolution_action")]
        [MaxLength(50)]
        public string? ResolutionAction { get; set; } // RESCUE_TOW, REPAIR_ON_SITE, REPLACE_CAR, NONE

        [Column("replacement_car_id")]
        public Guid? ReplacementCarId { get; set; }

        [ForeignKey("ReplacementCarId")]
        public virtual Vehicle? ReplacementVehicle { get; set; }

        [Column("estimated_damage_cost", TypeName = "decimal(18,2)")]
        public decimal EstimatedDamageCost { get; set; } = 0;

        [Column("insurance_coverage_status")]
        [MaxLength(50)]
        public string? InsuranceCoverageStatus { get; set; } // PENDING_CLAIM, COVERED, REJECTED, NOT_APPLICABLE

        [Column("customer_pay_amount", TypeName = "decimal(18,2)")]
        public decimal CustomerPayAmount { get; set; } = 0;

        [Column("company_pay_amount", TypeName = "decimal(18,2)")]
        public decimal CompanyPayAmount { get; set; } = 0;

        [Column("staff_notes")]
        public string? StaffNotes { get; set; }

        [Column("handled_by_staff_name")]
        [MaxLength(100)]
        public string? HandledByStaffName { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("resolved_at")]
        public DateTime? ResolvedAt { get; set; }
    }
}
