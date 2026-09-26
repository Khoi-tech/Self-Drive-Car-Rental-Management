using System;
using System.Collections.Generic;
using CarRental.API.Entities;

namespace CarRental.API.DTOs.RentalRequest
{
    public class RentalRequestResponseDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string PickupLocation { get; set; } = null!;
        public string DropoffLocation { get; set; } = null!;
        
        public string CustomerName { get; set; } = null!;
        public string CustomerPhone { get; set; } = null!;
        public string CustomerEmail { get; set; } = null!;
        public string CustomerIdCard { get; set; } = null!;
        public string DriverLicenseNumber { get; set; } = null!;
        
        public string? IdCardFrontUrl { get; set; }
        public string? IdCardBackUrl { get; set; }
        public string? DriverLicenseFrontUrl { get; set; }
        public string? DriverLicenseBackUrl { get; set; }
        
        public string? Notes { get; set; }

        public int TotalDays { get; set; }
        public decimal DailyRate { get; set; }
        public decimal DiscountPercent { get; set; }
        public decimal HolidaySurchargePercent { get; set; }
        public decimal EstimatedTotalFee { get; set; }
        public decimal DepositAmount { get; set; }
        public string Status { get; set; } = null!;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Simplified vehicle details could be added here if needed, or just IDs
    }
}
