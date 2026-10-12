using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Incidents;

namespace CarRental.API.Services
{
    public interface IIncidentReportService
    {
        Task<List<IncidentReportDto>> GetAllAsync(string? status = null, string? severity = null);
        Task<IncidentReportDto?> GetByIdAsync(Guid id);
        Task<List<IncidentReportDto>> GetByRequestIdAsync(Guid rentalRequestId);
        Task<IncidentReportDto> CreateAsync(CreateIncidentReportDto dto);
        Task<IncidentReportDto> UpdateStatusAsync(Guid id, UpdateIncidentStatusDto dto);
        Task<IncidentReportDto> ResolveAsync(Guid id, ResolveIncidentDto dto);
    }
}
