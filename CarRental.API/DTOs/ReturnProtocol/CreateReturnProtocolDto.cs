using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using CarRental.API.Common.JsonConverters;

namespace CarRental.API.DTOs.ReturnProtocol
{
    public class CreateReturnProtocolDto
    {
        [Required]
        public Guid RentalRequestId { get; set; }

        public Guid? ContractId { get; set; }

        public DateTime ReturnDate { get; set; } = DateTime.UtcNow;

        // Mốc ODO mới
        public int? CustomerReturnOdo { get; set; }
        public int? YardCheckinOdo { get; set; }

        // Mốc nhiên liệu mới
        public decimal? CustomerReturnFuelLevel { get; set; }
        public decimal? YardCheckinFuelLevel { get; set; }
        public string? ReturnDashPhotoUrl { get; set; }

        // Audit chiều về & Sơ đồ 2D mới
        public string? ReturnAnomalyNote { get; set; }
        public string? ReturnDamageMap { get; set; }

        // Cột cũ để tương thích ngược
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int EndOdo { get; set; }

        [JsonConverter(typeof(FlexibleFuelLevelConverter))]
        public int ReturnFuelLevel { get; set; } = 100; // 25, 50, 75, 100

        public string? ExteriorCondition { get; set; }

        public string? InteriorCondition { get; set; }

        public string? TireCondition { get; set; }

        public string? NewDamagesNotes { get; set; }

        public string? DamagePointsJson { get; set; }

        public string? AccessoriesChecklist { get; set; }

        public string? MissingAccessories { get; set; }

        public string? EvidencePhotoUrls { get; set; }

        public string? StaffNotes { get; set; }

        public string? StaffSignature { get; set; }

        public string? CustomerSignature { get; set; }

        public string NextVehicleStatus { get; set; } = "READY"; // READY, CLEANING, MAINTENANCE, REPAIR
    }
}
