using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.ReturnProtocol;

namespace CarRental.API.Services
{
    public interface IReturnProtocolService
    {
        Task<IEnumerable<ReturnProtocolResponseDto>> GetAllAsync();
        Task<ReturnProtocolResponseDto?> GetByIdAsync(Guid id);
        Task<ReturnProtocolResponseDto?> GetByRequestIdAsync(Guid requestId);
        Task<ReturnProtocolResponseDto> CreateAsync(CreateReturnProtocolDto dto, Guid? staffId, string staffName);
    }
}
