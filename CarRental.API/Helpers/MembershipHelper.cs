using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;

namespace CarRental.API.Helpers
{
    public class MembershipInfo
    {
        public string Tier { get; set; } = "STANDARD"; // STANDARD, SILVER, GOLD, PLATINUM
        public string TierLabel { get; set; } = "Thành viên Tiêu chuẩn";
        public string? NextTier { get; set; }
        public string? NextTierLabel { get; set; }
        public int CompletedTrips { get; set; }
        public decimal TotalSpent { get; set; }
        public int TrustScore { get; set; } = 100;
        public int CompletedTripsToNextTier { get; set; }
        public decimal SpentToNextTier { get; set; }
        public int RequiredTrustScoreForNextTier { get; set; }
        public int ProgressPercent { get; set; }
        public List<string> Perks { get; set; } = new();
        public bool HasEarlyBookingDiscount => Tier == "GOLD" || Tier == "PLATINUM";
        public decimal EarlyBookingDiscountPercent => HasEarlyBookingDiscount ? 10m : 0m;
        public bool HasFreeStandardCleaning => Tier == "GOLD" || Tier == "PLATINUM";
    }

    /// <summary>
    /// Single Source of Truth cho công thức tính Hạng thành viên VELORA.
    /// Chỉ tính trên các chuyến đã COMPLETED, tổng chi tiêu thực tế của các chuyến COMPLETED và TrustScore.
    /// </summary>
    public static class MembershipHelper
    {
        public const int SilverMinTrips = 1;
        public const decimal SilverMinSpent = 3_000_000m;

        public const int GoldMinTrips = 5;
        public const decimal GoldMinSpent = 15_000_000m;
        public const int GoldMinTrustScore = 80;

        public const int PlatinumMinTrips = 10;
        public const decimal PlatinumMinSpent = 35_000_000m;
        public const int PlatinumMinTrustScore = 90;

        public static MembershipInfo Evaluate(int completedTrips, decimal totalSpent, int trustScore)
        {
            completedTrips = Math.Max(0, completedTrips);
            totalSpent = Math.Max(0m, totalSpent);
            trustScore = Math.Clamp(trustScore, 0, 100);

            string tier;
            if ((completedTrips >= PlatinumMinTrips || totalSpent >= PlatinumMinSpent) && trustScore >= PlatinumMinTrustScore)
            {
                tier = "PLATINUM";
            }
            else if ((completedTrips >= GoldMinTrips || totalSpent >= GoldMinSpent) && trustScore >= GoldMinTrustScore)
            {
                tier = "GOLD";
            }
            else if (completedTrips >= SilverMinTrips || totalSpent >= SilverMinSpent)
            {
                tier = "SILVER";
            }
            else
            {
                tier = "STANDARD";
            }

            var info = new MembershipInfo
            {
                Tier = tier,
                CompletedTrips = completedTrips,
                TotalSpent = totalSpent,
                TrustScore = trustScore
            };

            switch (tier)
            {
                case "PLATINUM":
                    info.TierLabel = "Hội viên Platinum";
                    info.NextTier = null;
                    info.NextTierLabel = null;
                    info.CompletedTripsToNextTier = 0;
                    info.SpentToNextTier = 0m;
                    info.RequiredTrustScoreForNextTier = PlatinumMinTrustScore;
                    info.ProgressPercent = 100;
                    info.Perks = new List<string>
                    {
                        "Giảm 10% khi đặt xe trước ≥ 7 ngày",
                        "Miễn phí vệ sinh & rửa xe tiêu chuẩn khi trả xe",
                        "Ưu tiên điều phối xe mới & giao xe tận nơi",
                        "Hỗ trợ Concierge VIP 24/7"
                    };
                    break;

                case "GOLD":
                    info.TierLabel = "Hội viên Gold";
                    info.NextTier = "PLATINUM";
                    info.NextTierLabel = "Platinum";
                    info.CompletedTripsToNextTier = Math.Max(0, PlatinumMinTrips - completedTrips);
                    info.SpentToNextTier = Math.Max(0m, PlatinumMinSpent - totalSpent);
                    info.RequiredTrustScoreForNextTier = PlatinumMinTrustScore;
                    info.ProgressPercent = ComputeProgress(completedTrips, PlatinumMinTrips, totalSpent, PlatinumMinSpent);
                    info.Perks = new List<string>
                    {
                        "Giảm 10% khi đặt xe trước ≥ 7 ngày",
                        "Miễn phí vệ sinh & rửa xe tiêu chuẩn khi trả xe",
                        "Ưu tiên nhận xe đời mới"
                    };
                    break;

                case "SILVER":
                    info.TierLabel = "Hội viên Silver";
                    info.NextTier = "GOLD";
                    info.NextTierLabel = "Gold";
                    info.CompletedTripsToNextTier = Math.Max(0, GoldMinTrips - completedTrips);
                    info.SpentToNextTier = Math.Max(0m, GoldMinSpent - totalSpent);
                    info.RequiredTrustScoreForNextTier = GoldMinTrustScore;
                    info.ProgressPercent = ComputeProgress(completedTrips, GoldMinTrips, totalSpent, GoldMinSpent);
                    info.Perks = new List<string>
                    {
                        "Tích lũy chuyến hoàn thành lên hạng Gold",
                        "Hỗ trợ cứu hộ kỹ thuật 24/7 toàn quốc",
                        "Ưu đãi VietQR 5% khi thanh toán trả trước"
                    };
                    break;

                default:
                    info.TierLabel = "Thành viên Tiêu chuẩn";
                    info.NextTier = "SILVER";
                    info.NextTierLabel = "Silver";
                    info.CompletedTripsToNextTier = Math.Max(0, SilverMinTrips - completedTrips);
                    info.SpentToNextTier = Math.Max(0m, SilverMinSpent - totalSpent);
                    info.RequiredTrustScoreForNextTier = 0;
                    info.ProgressPercent = ComputeProgress(completedTrips, SilverMinTrips, totalSpent, SilverMinSpent);
                    info.Perks = new List<string>
                    {
                        "Hoàn thành 1 chuyến đầu tiên để lên hạng Silver",
                        "Ưu đãi VietQR 5% khi thanh toán trả trước",
                        "Hỗ trợ cứu hộ kỹ thuật 24/7"
                    };
                    break;
            }

            return info;
        }

        private static int ComputeProgress(int trips, int targetTrips, decimal spent, decimal targetSpent)
        {
            double tripRatio = targetTrips > 0 ? Math.Min(1.0, (double)trips / targetTrips) : 1.0;
            double spentRatio = targetSpent > 0 ? Math.Min(1.0, (double)(spent / targetSpent)) : 1.0;
            return (int)Math.Round(Math.Max(tripRatio, spentRatio) * 100);
        }

        public static async Task<MembershipInfo> ComputeForEmailAsync(AppDbContext context, string? customerEmail)
        {
            if (string.IsNullOrWhiteSpace(customerEmail))
            {
                return Evaluate(0, 0m, 100);
            }

            var normEmail = customerEmail.Trim().ToLowerInvariant();
            var user = await context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normEmail);

            int trustScore = user?.TrustScore ?? 100;

            var completedStats = await context.RentalRequests
                .AsNoTracking()
                .Where(r => r.CustomerEmail.ToLower() == normEmail && r.Status == "COMPLETED")
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    Count = g.Count(),
                    TotalSpent = g.Sum(x => x.EstimatedTotalFee)
                })
                .FirstOrDefaultAsync();

            return Evaluate(completedStats?.Count ?? 0, completedStats?.TotalSpent ?? 0m, trustScore);
        }
    }
}
