using System;
using CarRental.API.Entities;

namespace CarRental.API.DTOs.Vehicle
{
    public class VehicleResponseDto
    {
        public Guid Id { get; set; }
        public string Make { get; set; } = null!;
        public string Model { get; set; } = null!;
        public string LicensePlate { get; set; } = null!;
        public int Seats { get; set; }
        public TransmissionType Transmission { get; set; }
        public FuelType FuelType { get; set; }
        public int ManufactureYear { get; set; }
        public decimal DailyRate { get; set; }
        public decimal DepositAmount { get; set; }
        public int CurrentMileage { get; set; }
        public int? MileageLimit { get; set; }
        public DateTime? NextMaintenanceDate { get; set; }
        public int? NextMaintenanceMileage { get; set; }
        public string? PickupLocation { get; set; }
        public VehicleStatus Status { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        
        public decimal? ExtraKmRate { get; set; }
        public string FuelReturnPolicy { get; set; } = null!;
        public int PricingPoliciesCount { get; set; }
        public bool HasRentalCondition { get; set; }
        public int? RentalConditionMinAge { get; set; }
        public int? RentalConditionRequireDrivingYears { get; set; }
    }
}
