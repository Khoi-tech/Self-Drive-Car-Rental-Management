using System;
using System.Collections.Generic;

namespace CarRental.API.DTOs.RentalRequest
{
    public class AdditionalDriverDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string IdCardNumber { get; set; } = null!;
        public string LicenseNumber { get; set; } = null!;
    }

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
        public string? DriverLicenseClass { get; set; }
        public DateTime? DriverLicenseExpiry { get; set; }
        
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
        public string? BookingType { get; set; } = "STANDARD";
        public decimal HoldDepositAmount { get; set; } = 0;
        public bool IsSecurityDepositPaid { get; set; } = false;
        public DateTime? HoldExpiresAt { get; set; }
        public decimal RemainingSecurityDeposit => Math.Max(0, (DepositAmount > 500000 ? DepositAmount : 20000000m) - (HoldDepositAmount > 0 ? HoldDepositAmount : 500000m));
        public bool IsHoldExpired => BookingType == "FAST_HOLD" && !IsSecurityDepositPaid && HoldExpiresAt.HasValue && DateTime.UtcNow > HoldExpiresAt.Value;
        public string Status { get; set; } = null!;
        public string? RejectReason { get; set; }

        // Vehicle summary
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? CarLicensePlate { get; set; }
        public string? CarImageUrl { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public List<AdditionalDriverDto> AdditionalDrivers { get; set; } = new List<AdditionalDriverDto>();
    }
}
