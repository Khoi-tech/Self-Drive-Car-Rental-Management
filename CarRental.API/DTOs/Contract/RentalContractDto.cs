using System;

namespace CarRental.API.DTOs.Contract
{
    public class RentalContractDto
    {
        public Guid Id { get; set; }
        public Guid? RequestId { get; set; }
        public string ContractNumber { get; set; } = null!;
        public decimal TotalFee { get; set; }
        public decimal DepositAmount { get; set; }
        public int? MaxKm { get; set; }
        public string Content { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? CustomerSignature { get; set; }
        public DateTime? CustomerSignedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Rental request & Customer snapshot
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerIdCard { get; set; }
        public string? DriverLicenseNumber { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? CarLicensePlate { get; set; }
        public string? CarImageUrl { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? PickupLocation { get; set; }
        public string? DropoffLocation { get; set; }
        public int? TotalDays { get; set; }
    }
}
