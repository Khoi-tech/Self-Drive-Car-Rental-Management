using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Insurance;

namespace CarRental.API.Services
{
    public interface ICarInsuranceService
    {
        Task<List<CarInsuranceDto>> GetAllAsync(Guid? carId = null, string? status = null);
        Task<CarInsuranceDto?> GetByIdAsync(Guid id);
        Task<List<CarInsuranceDto>> GetByCarIdAsync(Guid carId);
        Task<CarInsuranceDto> CreateAsync(CreateCarInsuranceDto dto);
        Task<CarInsuranceDto> UpdateAsync(Guid id, UpdateCarInsuranceDto dto);
        Task<bool> DeleteAsync(Guid id);
        Task<List<InsuranceAlertDto>> GetAlertsAsync();
    }
}
