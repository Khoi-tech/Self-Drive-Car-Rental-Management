using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Maintenance
{
    public class CreateMaintenanceDto
    {
        [Required]
        public Guid CarId { get; set; }

        public string MaintenanceType { get; set; } = "ROUTINE"; // ROUTINE, REPAIR, TIRE_BRAKE, OIL_CHANGE, INSPECTION

        [Required]
        public string Title { get; set; } = null!;

        public string GarageName { get; set; } = "Gara chính hãng VELORA Care";

        public decimal Cost { get; set; } = 0;

        public int OdoAtMaintenance { get; set; }

        public DateTime ScheduledDate { get; set; } = DateTime.UtcNow;

        public string? Details { get; set; }
    }

    public class CompleteMaintenanceDto
    {
        public decimal ActualCost { get; set; }
        public DateTime CompletedDate { get; set; } = DateTime.UtcNow;
        public string? Details { get; set; }
        public int? NextMaintenanceMileage { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
    }

    public class MaintenanceRecordDto
    {
        public Guid Id { get; set; }
        public string? MaintenanceCode { get; set; }
        public Guid CarId { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? CarLicensePlate { get; set; }
        public string? CarImageUrl { get; set; }
        public int CurrentMileage { get; set; }

        public string MaintenanceType { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string GarageName { get; set; } = null!;
        public decimal Cost { get; set; }
        public int OdoAtMaintenance { get; set; }
        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Details { get; set; }
        public int? NextMaintenanceMileage { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public string Status { get; set; } = null!; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
        public DateTime CreatedAt { get; set; }
    }

    public class MaintenanceAlertDto
    {
        public Guid CarId { get; set; }
        public string CarMake { get; set; } = null!;
        public string CarModel { get; set; } = null!;
        public string CarLicensePlate { get; set; } = null!;
        public string? CarImageUrl { get; set; }
        public string CarStatus { get; set; } = null!;
        public int CurrentMileage { get; set; }
        public int? NextMaintenanceMileage { get; set; }
        public int? RemainingKmUntilMaintenance { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public int? RemainingDaysUntilMaintenance { get; set; }
        public string UrgencyLevel { get; set; } = "NORMAL"; // CRITICAL, WARNING, NORMAL
        public string AlertReason { get; set; } = null!;
    }
}
