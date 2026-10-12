using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Extensions;

namespace CarRental.API.Services
{
    public interface IRentalExtensionService
    {
        Task<List<RentalExtensionDto>> GetAllAsync(string? status = null);
        Task<RentalExtensionDto?> GetByIdAsync(Guid id);
        Task<List<RentalExtensionDto>> GetByRequestIdAsync(Guid rentalRequestId);
        Task<RentalExtensionDto> CreateAsync(CreateRentalExtensionDto dto);
        Task<RentalExtensionDto> ApproveAsync(Guid id, ProcessRentalExtensionDto dto);
        Task<RentalExtensionDto> RejectAsync(Guid id, ProcessRentalExtensionDto dto);
    }
}
