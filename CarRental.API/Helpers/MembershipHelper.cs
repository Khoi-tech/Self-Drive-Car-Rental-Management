using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Settings;

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
        public string PerksText { get; set; } = string.Empty;

        // Dynamic perks from Admin config
        public int EarlyBookingDays { get; set; } = 7;
        public decimal EarlyBookingDiscountPercent { get; set; }
        public bool FreeCarWash { get; set; }
        public int BonusKmPerDay { get; set; }

        public bool HasEarlyBookingDiscount => EarlyBookingDiscountPercent > 0m;
        public bool HasFreeStandardCleaning => FreeCarWash;
    }

    /// <summary>
    /// Single Source of Truth cho công thức tính Hạng thành viên VELORA.
    /// Đọc cấu hình động từ system_settings (key: membership_tiers_config), fallback mặc định nếu chưa có.
    /// </summary>
    public static class MembershipHelper
    {
        public const string SettingKey = "membership_tiers_config";

        private static readonly string[] TierOrder = { "STANDARD", "SILVER", "GOLD", "PLATINUM" };

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        public static List<MembershipTierConfigItem> GetDefaultTiers()
        {
            return new List<MembershipTierConfigItem>
            {
                new()
                {
                    Tier = "STANDARD",
                    Label = "Thành viên Tiêu chuẩn",
                    MinCompletedTrips = 0,
                    MinTotalSpend = 0m,
                    MinTrustScore = 0,
                    EarlyBookingDays = 7,
                    EarlyBookingDiscountPercent = 0m,
                    FreeCarWash = false,
                    BonusKmPerDay = 0,
                    PerksText = "Hoàn thành 1 chuyến đầu tiên để lên hạng Silver • Ưu đãi VietQR 5% khi thanh toán trả trước • Hỗ trợ cứu hộ kỹ thuật 24/7"
                },
                new()
                {
                    Tier = "SILVER",
                    Label = "Hội viên Silver",
                    MinCompletedTrips = 1,
                    MinTotalSpend = 3_000_000m,
                    MinTrustScore = 0,
                    EarlyBookingDays = 7,
                    EarlyBookingDiscountPercent = 0m,
                    FreeCarWash = false,
                    BonusKmPerDay = 10,
                    PerksText = "Tặng thêm 10 km/ngày • Ưu đãi VietQR 5% khi thanh toán trả trước • Hỗ trợ cứu hộ kỹ thuật 24/7 toàn quốc"
                },
                new()
                {
                    Tier = "GOLD",
                    Label = "Hội viên Gold",
                    MinCompletedTrips = 5,
                    MinTotalSpend = 15_000_000m,
                    MinTrustScore = 80,
                    EarlyBookingDays = 7,
                    EarlyBookingDiscountPercent = 10m,
                    FreeCarWash = true,
                    BonusKmPerDay = 20,
                    PerksText = "Giảm 10% khi đặt xe trước ≥ 7 ngày • Miễn phí vệ sinh & rửa xe tiêu chuẩn khi trả xe • Tặng thêm 20 km/ngày"
                },
                new()
                {
                    Tier = "PLATINUM",
                    Label = "Hội viên Platinum",
                    MinCompletedTrips = 10,
                    MinTotalSpend = 35_000_000m,
                    MinTrustScore = 90,
                    EarlyBookingDays = 7,
                    EarlyBookingDiscountPercent = 10m,
                    FreeCarWash = true,
                    BonusKmPerDay = 50,
                    PerksText = "Giảm 10% khi đặt xe trước ≥ 7 ngày • Miễn phí vệ sinh & rửa xe tiêu chuẩn • Tặng thêm 50 km/ngày • Hỗ trợ Concierge VIP 24/7"
                }
            };
        }

        public static string SerializeTiers(List<MembershipTierConfigItem> tiers)
        {
            return JsonSerializer.Serialize(NormalizeTiers(tiers), JsonOptions);
        }

        public static List<MembershipTierConfigItem> ParseTiersJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return GetDefaultTiers();
            }

            try
            {
                var parsed = JsonSerializer.Deserialize<List<MembershipTierConfigItem>>(json, JsonOptions);
                if (parsed == null || parsed.Count == 0)
                {
                    return GetDefaultTiers();
                }
                return NormalizeTiers(parsed);
            }
            catch
            {
                return GetDefaultTiers();
            }
        }

        public static List<MembershipTierConfigItem> NormalizeTiers(List<MembershipTierConfigItem>? input)
        {
            var defaults = GetDefaultTiers();
            if (input == null || input.Count == 0) return defaults;

            var byTier = input
                .Where(t => !string.IsNullOrWhiteSpace(t.Tier))
                .GroupBy(t => t.Tier.Trim().ToUpperInvariant())
                .ToDictionary(g => g.Key, g => g.First());

            var result = new List<MembershipTierConfigItem>();
            foreach (var code in TierOrder)
            {
                var fallback = defaults.First(d => d.Tier == code);
                if (byTier.TryGetValue(code, out var item))
                {
                    result.Add(new MembershipTierConfigItem
                    {
                        Tier = code,
                        Label = string.IsNullOrWhiteSpace(item.Label) ? fallback.Label : item.Label.Trim(),
                        MinCompletedTrips = code == "STANDARD" ? 0 : Math.Max(0, item.MinCompletedTrips),
                        MinTotalSpend = code == "STANDARD" ? 0m : Math.Max(0m, item.MinTotalSpend),
                        MinTrustScore = Math.Clamp(item.MinTrustScore, 0, 100),
                        EarlyBookingDays = Math.Clamp(item.EarlyBookingDays <= 0 ? 7 : item.EarlyBookingDays, 1, 90),
                        EarlyBookingDiscountPercent = Math.Clamp(item.EarlyBookingDiscountPercent, 0m, 50m),
                        FreeCarWash = item.FreeCarWash,
                        BonusKmPerDay = Math.Clamp(item.BonusKmPerDay, 0, 500),
                        PerksText = string.IsNullOrWhiteSpace(item.PerksText) ? fallback.PerksText : item.PerksText.Trim()
                    });
                }
                else
                {
                    result.Add(fallback);
                }
            }

            return result;
        }

        public static MembershipInfo Evaluate(
            int completedTrips,
            decimal totalSpent,
            int trustScore,
            List<MembershipTierConfigItem>? tiersConfig = null)
        {
            completedTrips = Math.Max(0, completedTrips);
            totalSpent = Math.Max(0m, totalSpent);
            trustScore = Math.Clamp(trustScore, 0, 100);

            var tiers = NormalizeTiers(tiersConfig);
            var stdCfg = tiers[0];
            var silverCfg = tiers[1];
            var goldCfg = tiers[2];
            var platCfg = tiers[3];

            MembershipTierConfigItem matched = stdCfg;
            int matchedIndex = 0;

            if (MeetsTier(completedTrips, totalSpent, trustScore, platCfg))
            {
                matched = platCfg;
                matchedIndex = 3;
            }
            else if (MeetsTier(completedTrips, totalSpent, trustScore, goldCfg))
            {
                matched = goldCfg;
                matchedIndex = 2;
            }
            else if (MeetsTier(completedTrips, totalSpent, trustScore, silverCfg))
            {
                matched = silverCfg;
                matchedIndex = 1;
            }

            var nextCfg = matchedIndex < tiers.Count - 1 ? tiers[matchedIndex + 1] : null;
            var perksList = SplitPerks(matched.PerksText);

            return new MembershipInfo
            {
                Tier = matched.Tier,
                TierLabel = matched.Label,
                NextTier = nextCfg?.Tier,
                NextTierLabel = nextCfg?.Label,
                CompletedTrips = completedTrips,
                TotalSpent = totalSpent,
                TrustScore = trustScore,
                CompletedTripsToNextTier = nextCfg != null ? Math.Max(0, nextCfg.MinCompletedTrips - completedTrips) : 0,
                SpentToNextTier = nextCfg != null ? Math.Max(0m, nextCfg.MinTotalSpend - totalSpent) : 0m,
                RequiredTrustScoreForNextTier = nextCfg?.MinTrustScore ?? matched.MinTrustScore,
                ProgressPercent = nextCfg != null
                    ? ComputeProgress(completedTrips, nextCfg.MinCompletedTrips, totalSpent, nextCfg.MinTotalSpend)
                    : 100,
                Perks = perksList,
                PerksText = matched.PerksText,
                EarlyBookingDays = matched.EarlyBookingDays,
                EarlyBookingDiscountPercent = matched.EarlyBookingDiscountPercent,
                FreeCarWash = matched.FreeCarWash,
                BonusKmPerDay = matched.BonusKmPerDay
            };
        }

        private static bool MeetsTier(int completedTrips, decimal totalSpent, int trustScore, MembershipTierConfigItem cfg)
        {
            if (trustScore < cfg.MinTrustScore) return false;
            bool meetsTrips = cfg.MinCompletedTrips > 0 && completedTrips >= cfg.MinCompletedTrips;
            bool meetsSpend = cfg.MinTotalSpend > 0m && totalSpent >= cfg.MinTotalSpend;
            if (cfg.MinCompletedTrips == 0 && cfg.MinTotalSpend == 0m) return true;
            return meetsTrips || meetsSpend;
        }

        private static List<string> SplitPerks(string? perksText)
        {
            if (string.IsNullOrWhiteSpace(perksText)) return new List<string>();
            return perksText
                .Split(new[] { '•', '\n', '|' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .ToList();
        }

        private static int ComputeProgress(int trips, int targetTrips, decimal spent, decimal targetSpent)
        {
            double tripRatio = targetTrips > 0 ? Math.Min(1.0, (double)trips / targetTrips) : 1.0;
            double spentRatio = targetSpent > 0 ? Math.Min(1.0, (double)(spent / targetSpent)) : 1.0;
            return (int)Math.Round(Math.Max(tripRatio, spentRatio) * 100);
        }

        public static async Task<List<MembershipTierConfigItem>> LoadTiersFromDbAsync(AppDbContext context)
        {
            var setting = await context.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == SettingKey);

            return ParseTiersJson(setting?.Value);
        }

        public static async Task<MembershipInfo> ComputeForEmailAsync(
            AppDbContext context,
            string? customerEmail,
            List<MembershipTierConfigItem>? tiersConfig = null)
        {
            var tiers = tiersConfig ?? await LoadTiersFromDbAsync(context);

            if (string.IsNullOrWhiteSpace(customerEmail))
            {
                return Evaluate(0, 0m, 100, tiers);
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

            return Evaluate(completedStats?.Count ?? 0, completedStats?.TotalSpent ?? 0m, trustScore, tiers);
        }
    }
}
