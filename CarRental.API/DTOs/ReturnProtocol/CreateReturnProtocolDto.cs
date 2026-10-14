using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.ReturnProtocol
{
    public class CreateReturnProtocolDto
    {
        [Required]
        public Guid RentalRequestId { get; set; }

        public Guid? ContractId { get; set; }

        public DateTime ReturnDate { get; set; } = DateTime.UtcNow;

        [Required]
        public int EndOdo { get; set; }

        public int ReturnFuelLevel { get; set; } = 100; // 25, 50, 75, 100

        public string? ExteriorCondition { get; set; }

        public string? InteriorCondition { get; set; }

        public string? TireCondition { get; set; }

        public string? NewDamagesNotes { get; set; }

        public string? AccessoriesChecklist { get; set; }

        public string? MissingAccessories { get; set; }

        public string? EvidencePhotoUrls { get; set; }

        public string? StaffNotes { get; set; }

        public string? StaffSignature { get; set; }

        public string? CustomerSignature { get; set; }

        public string NextVehicleStatus { get; set; } = "READY"; // READY, CLEANING, MAINTENANCE, REPAIR
    }
}
