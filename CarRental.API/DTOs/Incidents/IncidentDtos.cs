using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Incidents
{
    public class CreateIncidentReportDto
    {
        [Required]
        public Guid RentalRequestId { get; set; }

        [Required]
        public string IncidentType { get; set; } = "COLLISION"; // COLLISION, BREAKDOWN, FLAT_TIRE, FLOOD, OTHER

        public string Severity { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH

        [Required]
        public string Location { get; set; } = null!;

        [Required]
        public string Description { get; set; } = null!;

        public string? PhotoUrls { get; set; }

        public bool HasInjuries { get; set; } = false;
    }

    public class UpdateIncidentStatusDto
    {
        [Required]
        public string Status { get; set; } = "INVESTIGATING"; // INVESTIGATING, RESOLVED, CANCELLED
        public string? StaffNotes { get; set; }
        public string? StaffName { get; set; }
    }

    public class ResolveIncidentDto
    {
        public string ResolutionAction { get; set; } = "RESCUE_TOW"; // RESCUE_TOW, REPAIR_ON_SITE, REPLACE_CAR, NONE
        public Guid? ReplacementCarId { get; set; }
        public decimal EstimatedDamageCost { get; set; } = 0;
        public string? InsuranceCoverageStatus { get; set; } = "PENDING_CLAIM"; // PENDING_CLAIM, COVERED, REJECTED, NOT_APPLICABLE
        public decimal CustomerPayAmount { get; set; } = 0;
        public decimal CompanyPayAmount { get; set; } = 0;
        public string? StaffNotes { get; set; }
        public string? StaffName { get; set; }
        public string? VehicleStatusAfterIncident { get; set; } = "REPAIR"; // READY, REPAIR, MAINTENANCE
    }

    public class IncidentReportDto
    {
        public Guid Id { get; set; }
        public string? IncidentCode { get; set; }
        public Guid RentalRequestId { get; set; }
        public Guid CarId { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? CarLicensePlate { get; set; }
        public string? CarImageUrl { get; set; }

        public Guid? CustomerId { get; set; }
        public string CustomerName { get; set; } = null!;
        public string CustomerPhone { get; set; } = null!;

        public string IncidentType { get; set; } = null!;
        public string Severity { get; set; } = null!;
        public string Location { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? PhotoUrls { get; set; }
        public bool HasInjuries { get; set; }
        public string Status { get; set; } = null!;

        public string? ResolutionAction { get; set; }
        public Guid? ReplacementCarId { get; set; }
        public string? ReplacementCarMake { get; set; }
        public string? ReplacementCarModel { get; set; }
        public string? ReplacementCarLicensePlate { get; set; }

        public decimal EstimatedDamageCost { get; set; }
        public string? InsuranceCoverageStatus { get; set; }
        public decimal CustomerPayAmount { get; set; }
        public decimal CompanyPayAmount { get; set; }
        public string? StaffNotes { get; set; }
        public string? HandledByStaffName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
