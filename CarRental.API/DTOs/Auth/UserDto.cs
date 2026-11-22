using System;
using System.Collections.Generic;

namespace CarRental.API.DTOs.Auth
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = null!;
        public bool IsActive { get; set; } = true;
        public string? LockReason { get; set; }
        public string KycStatus { get; set; } = "NOT_SUBMITTED";
        public int TrustScore { get; set; } = 100;
        public DateTime? DateOfBirth { get; set; }
        public string? DriverLicenseClass { get; set; }
        public string? LicenseClass { get; set; }
        public DateTime? LicenseIssueDate { get; set; }
        public DateTime CreatedAt { get; set; }

        // Single Source of Truth Membership Tier
        public string MembershipTier { get; set; } = "STANDARD";
        public string MembershipTierLabel { get; set; } = "Thành viên Tiêu chuẩn";
        public string? NextTier { get; set; }
        public string? NextTierLabel { get; set; }
        public int CompletedTrips { get; set; }
        public decimal TotalSpent { get; set; }
        public int CompletedTripsToNextTier { get; set; }
        public decimal SpentToNextTier { get; set; }
        public int RequiredTrustScoreForNextTier { get; set; }
        public int TierProgressPercent { get; set; }
        public List<string> MembershipPerks { get; set; } = new();
    }
}
