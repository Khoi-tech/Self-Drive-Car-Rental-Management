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

        public PricingPolicyService(AppDbContext context)
        {
            _context = context;
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

        public async Task<PricingPreviewResponseDto?> PreviewPricingAsync(Guid vehicleId, PricingPreviewRequestDto requestDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId);
            if (vehicle == null) return null;

            var policies = await _context.PricingPolicies
                .Where(p => p.VehicleId == vehicleId && p.MinDays <= requestDto.RentalDays)
                .OrderByDescending(p => p.MinDays)
                .ToListAsync();

            var selectedPolicy = policies.FirstOrDefault();

            decimal basePrice = vehicle.DailyRate;
            decimal discountPercentage = selectedPolicy?.DiscountPercentage ?? 0m;
            decimal holidaySurcharge = selectedPolicy?.HolidaySurcharge ?? 0m;

            // AdjustedDailyPrice = BasePrice * (1 - Discount + HolidaySurcharge)
            decimal multiplier = 1m - (discountPercentage / 100m) + (holidaySurcharge / 100m);
            decimal adjustedDailyPrice = basePrice * multiplier;
            decimal rentalPrice = adjustedDailyPrice * requestDto.RentalDays;

            return new PricingPreviewResponseDto
            {
                BasePrice = basePrice,
                RentalDays = requestDto.RentalDays,
                SelectedMinDays = selectedPolicy?.MinDays,
                DiscountPercentage = discountPercentage,
                HolidaySurcharge = holidaySurcharge,
                AdjustedDailyPrice = adjustedDailyPrice,
                RentalPrice = rentalPrice
            };
        }
    }
}
