using System;
using System.Threading.Tasks;
using CarRental.API.DTOs.RentalCondition;

namespace CarRental.API.Services
{
    public interface IRentalConditionService
    {
        Task<RentalConditionDto?> GetByVehicleIdAsync(Guid vehicleId);
        Task<RentalConditionDto?> CreateAsync(Guid vehicleId, CreateRentalConditionDto createDto);
        Task<RentalConditionDto?> UpdateAsync(Guid vehicleId, UpdateRentalConditionDto updateDto);
        Task<bool> DeleteAsync(Guid vehicleId);
    }
}
