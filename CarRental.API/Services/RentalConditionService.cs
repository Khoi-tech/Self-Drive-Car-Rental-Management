using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.RentalCondition;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class RentalConditionService : IRentalConditionService
    {
        private readonly AppDbContext _context;

        public RentalConditionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RentalConditionDto?> GetByVehicleIdAsync(Guid vehicleId)
        {
            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == vehicleId && v.IsActive);
            if (!vehicleExists) return null; // Can distinguish between vehicle not found and condition not found in controller. Actually, returning null here is ambiguous. Let's handle it in controller or throw. Wait, I'll just return null if no condition, and controller will check vehicle existence if needed. Or better, check here and throw if vehicle doesn't exist.

            // Wait, the interface says Task<RentalConditionDto?>.
            // Let's just fetch the condition directly.
            var condition = await _context.RentalConditions.FirstOrDefaultAsync(c => c.CarId == vehicleId);
            if (condition == null) return null;

            return new RentalConditionDto
            {
                Id = condition.Id,
                CarId = condition.CarId,
                MinAge = condition.MinAge,
                RequireDrivingYears = condition.RequireDrivingYears,
                OtherConditions = condition.OtherConditions
            };
        }

        public async Task<RentalConditionDto?> CreateAsync(Guid vehicleId, CreateRentalConditionDto createDto)
        {
            var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == vehicleId && v.IsActive);
            if (!vehicleExists) return null; // Will result in 404 in controller

            var existingCondition = await _context.RentalConditions.AnyAsync(c => c.CarId == vehicleId);
            if (existingCondition)
            {
                throw new InvalidOperationException("Rental condition already exists for this vehicle.");
            }

            var condition = new RentalCondition
            {
                Id = Guid.NewGuid(),
                CarId = vehicleId,
                MinAge = createDto.MinAge,
                RequireDrivingYears = createDto.RequireDrivingYears,
                OtherConditions = createDto.OtherConditions
            };

            _context.RentalConditions.Add(condition);
            await _context.SaveChangesAsync();

            return new RentalConditionDto
            {
                Id = condition.Id,
                CarId = condition.CarId,
                MinAge = condition.MinAge,
                RequireDrivingYears = condition.RequireDrivingYears,
                OtherConditions = condition.OtherConditions
            };
        }

        public async Task<RentalConditionDto?> UpdateAsync(Guid vehicleId, UpdateRentalConditionDto updateDto)
        {
            var condition = await _context.RentalConditions.FirstOrDefaultAsync(c => c.CarId == vehicleId);
            if (condition == null) return null;

            condition.MinAge = updateDto.MinAge;
            condition.RequireDrivingYears = updateDto.RequireDrivingYears;
            condition.OtherConditions = updateDto.OtherConditions;

            await _context.SaveChangesAsync();

            return new RentalConditionDto
            {
                Id = condition.Id,
                CarId = condition.CarId,
                MinAge = condition.MinAge,
                RequireDrivingYears = condition.RequireDrivingYears,
                OtherConditions = condition.OtherConditions
            };
        }

        public async Task<bool> DeleteAsync(Guid vehicleId)
        {
            var condition = await _context.RentalConditions.FirstOrDefaultAsync(c => c.CarId == vehicleId);
            if (condition == null) return false;

            _context.RentalConditions.Remove(condition);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
