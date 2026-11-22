using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Settings
{
    public class MembershipTierConfigItem
    {
        [Required]
        public string Tier { get; set; } = "STANDARD"; // STANDARD, SILVER, GOLD, PLATINUM

        public string Label { get; set; } = "Thành viên Tiêu chuẩn";

        [Range(0, 1000)]
        public int MinCompletedTrips { get; set; }

        [Range(0, 10000000000)]
        public decimal MinTotalSpend { get; set; }

        [Range(0, 100)]
        public int MinTrustScore { get; set; }

        [Range(1, 90)]
        public int EarlyBookingDays { get; set; } = 7;

        [Range(0, 50)]
        public decimal EarlyBookingDiscountPercent { get; set; }

        public bool FreeCarWash { get; set; }

        [Range(0, 500)]
        public int BonusKmPerDay { get; set; }

        public string PerksText { get; set; } = string.Empty;
    }

    public class UpdateMembershipTiersRequestDto
    {
        [Required]
        public List<MembershipTierConfigItem> Tiers { get; set; } = new();
    }
}
