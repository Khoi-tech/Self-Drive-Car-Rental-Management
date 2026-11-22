using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.PricingPolicy;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class PricingPolicyService : IPricingPolicyService
    {
        private readonly AppDbContext _context;
        private readonly ISystemSettingsService _settingsService;

        public PricingPolicyService(AppDbContext context, ISystemSettingsService settingsService)
        {
            _context = context;
            _settingsService = settingsService;
        }

        public async Task<IEnumerable<PricingPolicyDto>> GetPoliciesByVehicleIdAsync(Guid vehicleId)
        {
            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == vehicleId);
            if (!vehicleExists) throw new KeyNotFoundException("Vehicle not found.");

            var policies = await _context.PricingPolicies
                .Where(p => p.VehicleId == vehicleId)
                .OrderBy(p => p.MinDays)
                .ToListAsync();

            return policies.Select(p => new PricingPolicyDto
            {
                Id = p.Id,
                VehicleId = p.VehicleId,
                MinDays = p.MinDays,
                DiscountPercentage = p.DiscountPercentage,
                HolidaySurcharge = p.HolidaySurcharge,
                CreatedAt = p.CreatedAt
            });
        }

        public async Task<PricingPolicyDto> CreatePolicyAsync(Guid vehicleId, CreatePricingPolicyDto createDto)
        {
            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == vehicleId);
            if (!vehicleExists) throw new KeyNotFoundException("Vehicle not found.");

            var duplicate = await _context.PricingPolicies.AnyAsync(p => p.VehicleId == vehicleId && p.MinDays == createDto.MinDays);
            if (duplicate) throw new InvalidOperationException("A policy with this minDays already exists for the vehicle.");

            var policy = new PricingPolicy
            {
                VehicleId = vehicleId,
                MinDays = createDto.MinDays,
                DiscountPercentage = createDto.DiscountPercentage,
                HolidaySurcharge = createDto.HolidaySurcharge
            };

            _context.PricingPolicies.Add(policy);
            await _context.SaveChangesAsync();

            return new PricingPolicyDto
            {
                Id = policy.Id,
                VehicleId = policy.VehicleId,
                MinDays = policy.MinDays,
                DiscountPercentage = policy.DiscountPercentage,
                HolidaySurcharge = policy.HolidaySurcharge,
                CreatedAt = policy.CreatedAt
            };
        }

        public async Task<PricingPolicyDto?> UpdatePolicyAsync(Guid vehicleId, Guid policyId, UpdatePricingPolicyDto updateDto)
        {
            var policy = await _context.PricingPolicies.FirstOrDefaultAsync(p => p.Id == policyId && p.VehicleId == vehicleId);
            if (policy == null) return null;

            var duplicate = await _context.PricingPolicies.AnyAsync(p => p.VehicleId == vehicleId && p.MinDays == updateDto.MinDays && p.Id != policyId);
            if (duplicate) throw new InvalidOperationException("A policy with this minDays already exists for the vehicle.");

            policy.MinDays = updateDto.MinDays;
            policy.DiscountPercentage = updateDto.DiscountPercentage;
            policy.HolidaySurcharge = updateDto.HolidaySurcharge;

            await _context.SaveChangesAsync();

            return new PricingPolicyDto
            {
                Id = policy.Id,
                VehicleId = policy.VehicleId,
                MinDays = policy.MinDays,
                DiscountPercentage = policy.DiscountPercentage,
                HolidaySurcharge = policy.HolidaySurcharge,
                CreatedAt = policy.CreatedAt
            };
        }

        public async Task<bool> DeletePolicyAsync(Guid vehicleId, Guid policyId)
        {
            var policy = await _context.PricingPolicies.FirstOrDefaultAsync(p => p.Id == policyId && p.VehicleId == vehicleId);
            if (policy == null) return false;

            _context.PricingPolicies.Remove(policy);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<PricingPolicyDto>> ApplyStandardPackageAsync(Guid vehicleId)
        {
            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == vehicleId);
            if (!vehicleExists) throw new KeyNotFoundException("Vehicle not found.");

            var standardTiers = new (int MinDays, decimal Discount, decimal Holiday)[]
            {
                (3, 5m, 20m),
                (7, 10m, 20m),
                (30, 20m, 20m)
            };

            var existingPolicies = await _context.PricingPolicies
                .Where(p => p.VehicleId == vehicleId)
                .ToListAsync();

            foreach (var tier in standardTiers)
            {
                var existing = existingPolicies.FirstOrDefault(p => p.MinDays == tier.MinDays);
                if (existing != null)
                {
                    existing.DiscountPercentage = tier.Discount;
                    existing.HolidaySurcharge = tier.Holiday;
                }
                else
                {
                    _context.PricingPolicies.Add(new PricingPolicy
                    {
                        VehicleId = vehicleId,
                        MinDays = tier.MinDays,
                        DiscountPercentage = tier.Discount,
                        HolidaySurcharge = tier.Holiday
                    });
                }
            }

            await _context.SaveChangesAsync();
            return await GetPoliciesByVehicleIdAsync(vehicleId);
        }

        public async Task<PricingPreviewResponseDto?> PreviewPricingAsync(Guid vehicleId, PricingPreviewRequestDto requestDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId);
            if (vehicle == null) return null;

            var allPolicies = await _context.PricingPolicies
                .Where(p => p.VehicleId == vehicleId)
                .OrderBy(p => p.MinDays)
                .ToListAsync();

            var selectedPolicy = allPolicies
                .Where(p => p.MinDays <= requestDto.RentalDays)
                .OrderByDescending(p => p.MinDays)
                .FirstOrDefault();

            decimal basePrice = vehicle.DailyRate;
            decimal discountPercentage = selectedPolicy?.DiscountPercentage ?? 0m;

            // Phụ thu dịp Lễ/Tết: nếu bậc hiện tại có cấu hình thì dùng, ngược lại (VD thuê 1-2 ngày khi bậc thấp nhất là 3 ngày)
            // kế thừa mức phụ thu lễ từ bậc thấp nhất có cấu hình > 0 để không bị sót phụ thu lễ.
            decimal holidaySurcharge = 0m;
            if (requestDto.IsHoliday)
            {
                if (selectedPolicy != null && selectedPolicy.HolidaySurcharge > 0m)
                {
                    holidaySurcharge = selectedPolicy.HolidaySurcharge;
                }
                else
                {
                    holidaySurcharge = allPolicies
                        .FirstOrDefault(p => p.HolidaySurcharge > 0m)?.HolidaySurcharge ?? 0m;
                }
            }

            decimal baseSubtotal = basePrice * requestDto.RentalDays;
            decimal discountAmount = Math.Round(baseSubtotal * (discountPercentage / 100m), 0);
            decimal holidaySurchargeAmount = Math.Round(baseSubtotal * (holidaySurcharge / 100m), 0);
            decimal subtotalBeforeVietQr = baseSubtotal - discountAmount + holidaySurchargeAmount;

            decimal vietQrDiscountPercentage = 0m;
            decimal vietQrDiscountAmount = 0m;
            if (requestDto.IsVietQrPrepaid)
            {
                vietQrDiscountPercentage = await _settingsService.GetSettingValueAsync("vietqr_discount_percent", 5m);
                vietQrDiscountAmount = Math.Round(subtotalBeforeVietQr * (vietQrDiscountPercentage / 100m), 0);
            }

            decimal rentalPrice = subtotalBeforeVietQr - vietQrDiscountAmount;
            decimal adjustedDailyPrice = requestDto.RentalDays > 0
                ? Math.Round(rentalPrice / requestDto.RentalDays, 0)
                : 0m;

            return new PricingPreviewResponseDto
            {
                BasePrice = basePrice,
                RentalDays = requestDto.RentalDays,
                SelectedMinDays = selectedPolicy?.MinDays,
                DiscountPercentage = discountPercentage,
                HolidaySurcharge = holidaySurcharge,
                VietQrDiscountPercentage = vietQrDiscountPercentage,
                BaseSubtotal = baseSubtotal,
                DiscountAmount = discountAmount,
                HolidaySurchargeAmount = holidaySurchargeAmount,
                VietQrDiscountAmount = vietQrDiscountAmount,
                AdjustedDailyPrice = adjustedDailyPrice,
                RentalPrice = rentalPrice
            };
        }
    }
}
