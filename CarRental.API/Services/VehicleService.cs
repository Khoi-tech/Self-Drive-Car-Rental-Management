using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Vehicle;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class VehicleService : IVehicleService
    {
        private readonly AppDbContext _context;

        public VehicleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<VehicleResponseDto>> GetAllAsync(string? search, VehicleStatus? status)
        {
            var query = _context.Vehicles.Include(v => v.PricingPolicies).Include(v => v.RentalCondition).Where(v => v.IsActive).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(v => v.Make.ToLower().Contains(searchLower) ||
                                         v.Model.ToLower().Contains(searchLower) ||
                                         v.LicensePlate.ToLower().Contains(searchLower));
            }

            if (status.HasValue)
            {
                query = query.Where(v => v.Status == status.Value);
            }

            var vehicles = await query.ToListAsync();

            return vehicles.Select(MapToResponseDto);
        }

        public async Task<VehicleResponseDto?> GetByIdAsync(Guid id)
        {
            var vehicle = await _context.Vehicles.Include(v => v.PricingPolicies).Include(v => v.RentalCondition).FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return null;

            return MapToResponseDto(vehicle);
        }

        public async Task<VehicleResponseDto> CreateAsync(CreateVehicleDto createDto)
        {
            var vehicle = new Vehicle
            {
                Make = createDto.Make,
                Model = createDto.Model,
                LicensePlate = createDto.LicensePlate,
                Seats = createDto.Seats,
                Transmission = createDto.Transmission,
                FuelType = createDto.FuelType,
                ManufactureYear = createDto.ManufactureYear,
                DailyRate = createDto.DailyRate,
                DepositAmount = createDto.DepositAmount,
                CurrentMileage = createDto.CurrentMileage,
                MileageLimit = createDto.MileageLimit,
                PickupLocation = createDto.PickupLocation,
                ImageUrl = createDto.ImageUrl,
                Status = VehicleStatus.READY,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return MapToResponseDto(vehicle);
        }

        public async Task<VehicleResponseDto?> UpdateAsync(Guid id, UpdateVehicleDto updateDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return null;

            vehicle.Seats = updateDto.Seats;
            vehicle.Transmission = updateDto.Transmission;
            vehicle.DailyRate = updateDto.DailyRate;
            vehicle.DepositAmount = updateDto.DepositAmount;
            vehicle.CurrentMileage = updateDto.CurrentMileage;
            vehicle.MileageLimit = updateDto.MileageLimit;
            vehicle.NextMaintenanceDate = updateDto.NextMaintenanceDate;
            vehicle.NextMaintenanceMileage = updateDto.NextMaintenanceMileage;
            vehicle.PickupLocation = updateDto.PickupLocation;
            vehicle.ImageUrl = updateDto.ImageUrl;
            vehicle.ExtraKmRate = updateDto.ExtraKmRate;
            if (updateDto.FuelReturnPolicy != null) {
                vehicle.FuelReturnPolicy = updateDto.FuelReturnPolicy;
            }
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponseDto(vehicle);
        }

        public async Task<bool> UpdateStatusAsync(Guid id, UpdateVehicleStatusDto statusDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return false;

            vehicle.Status = statusDto.Status;
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return false;

            // Soft delete
            vehicle.IsActive = false;
            vehicle.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        private static VehicleResponseDto MapToResponseDto(Vehicle vehicle)
        {
            return new VehicleResponseDto
            {
                Id = vehicle.Id,
                Make = vehicle.Make,
                Model = vehicle.Model,
                LicensePlate = vehicle.LicensePlate,
                Seats = vehicle.Seats,
                Transmission = vehicle.Transmission,
                FuelType = vehicle.FuelType,
                ManufactureYear = vehicle.ManufactureYear,
                DailyRate = vehicle.DailyRate,
                DepositAmount = vehicle.DepositAmount,
                CurrentMileage = vehicle.CurrentMileage,
                MileageLimit = vehicle.MileageLimit,
                NextMaintenanceDate = vehicle.NextMaintenanceDate,
                NextMaintenanceMileage = vehicle.NextMaintenanceMileage,
                PickupLocation = vehicle.PickupLocation,
                Status = vehicle.Status,
                ImageUrl = vehicle.ImageUrl,
                IsActive = vehicle.IsActive,
                CreatedAt = vehicle.CreatedAt,
                UpdatedAt = vehicle.UpdatedAt,
                ExtraKmRate = vehicle.ExtraKmRate,
                FuelReturnPolicy = vehicle.FuelReturnPolicy,
                PricingPoliciesCount = vehicle.PricingPolicies?.Count ?? 0,
                HasRentalCondition = vehicle.RentalCondition != null,
                RentalConditionMinAge = vehicle.RentalCondition?.MinAge,
                RentalConditionRequireDrivingYears = vehicle.RentalCondition?.RequireDrivingYears
            };
        }
    }
}
