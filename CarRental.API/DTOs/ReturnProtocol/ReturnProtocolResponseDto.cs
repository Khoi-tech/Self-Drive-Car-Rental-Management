using System;

namespace CarRental.API.DTOs.ReturnProtocol
{
    public class ReturnProtocolResponseDto
    {
        public Guid Id { get; set; }
        public string? ProtocolNumber { get; set; }
        public Guid? RentalRequestId { get; set; }
        public Guid? ContractId { get; set; }
        public Guid? CarId { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? LicensePlate { get; set; }
        public Guid? StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public DateTime ReturnDate { get; set; }
        public int StartOdo { get; set; }
        public int EndOdo { get; set; }
        public int TotalKmDriven { get; set; }
        public int? MaxKmAllowed { get; set; }
        public int ExcessKm { get; set; }
        public int InitialFuelLevel { get; set; }
        public int ReturnFuelLevel { get; set; }
        public int FuelDifference { get; set; }
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
        public string NextVehicleStatus { get; set; } = "READY";
        public string Status { get; set; } = "COMPLETED";
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
