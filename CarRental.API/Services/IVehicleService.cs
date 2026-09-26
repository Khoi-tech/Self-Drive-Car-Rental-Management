using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Vehicle;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public interface IVehicleService
    {
        Task<IEnumerable<VehicleResponseDto>> GetAllAsync(string? search, VehicleStatus? status);
        Task<VehicleResponseDto?> GetByIdAsync(Guid id);
        Task<VehicleResponseDto> CreateAsync(CreateVehicleDto createDto);
        Task<VehicleResponseDto?> UpdateAsync(Guid id, UpdateVehicleDto updateDto);
        Task<bool> UpdateStatusAsync(Guid id, UpdateVehicleStatusDto statusDto);
        Task<bool> DeleteAsync(Guid id);
        Task<IEnumerable<CarRental.API.DTOs.Search.AvailableVehicleResponseDto>> SearchAvailableVehiclesAsync(CarRental.API.DTOs.Search.VehicleSearchQueryDto query);
    }
}
