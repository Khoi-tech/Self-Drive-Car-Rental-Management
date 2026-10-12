using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("maintenance_records")]
    public class MaintenanceRecord
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("maintenance_code")]
        [MaxLength(50)]
        public string? MaintenanceCode { get; set; }

        [Required]
        [Column("car_id")]
        public Guid CarId { get; set; }

        [ForeignKey("CarId")]
        public virtual Vehicle? Vehicle { get; set; }

        [Column("maintenance_type")]
        [MaxLength(50)]
        public string MaintenanceType { get; set; } = "ROUTINE"; // ROUTINE, REPAIR, TIRE_BRAKE, OIL_CHANGE, INSPECTION

        [Column("title")]
        [MaxLength(200)]
        public string Title { get; set; } = null!;

        [Column("garage_name")]
        [MaxLength(150)]
        public string GarageName { get; set; } = "Gara chính hãng VELORA Care";

        [Column("cost", TypeName = "decimal(18,2)")]
        public decimal Cost { get; set; } = 0;

        [Column("odo_at_maintenance")]
        public int OdoAtMaintenance { get; set; }

        [Column("scheduled_date")]
        public DateTime ScheduledDate { get; set; } = DateTime.UtcNow;

        [Column("completed_date")]
        public DateTime? CompletedDate { get; set; }

        [Column("details")]
        public string? Details { get; set; }

        [Column("next_maintenance_mileage")]
        public int? NextMaintenanceMileage { get; set; }

        [Column("next_maintenance_date")]
        public DateTime? NextMaintenanceDate { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "SCHEDULED"; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
