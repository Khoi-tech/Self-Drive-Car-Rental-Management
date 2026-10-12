using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Maintenance;

namespace CarRental.API.Services
{
    public interface IMaintenanceService
    {
        Task<List<MaintenanceRecordDto>> GetAllAsync(string? status = null, Guid? carId = null);
        Task<MaintenanceRecordDto?> GetByIdAsync(Guid id);
        Task<List<MaintenanceAlertDto>> GetAlertsAsync();
        Task<MaintenanceRecordDto> CreateAsync(CreateMaintenanceDto dto);
        Task<MaintenanceRecordDto> CompleteAsync(Guid id, CompleteMaintenanceDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
