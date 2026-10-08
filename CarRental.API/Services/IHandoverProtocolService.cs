using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Handover;

namespace CarRental.API.Services
{
    public interface IHandoverProtocolService
    {
        Task<List<HandoverProtocolDto>> GetAllAsync(string? status = null);
        Task<HandoverProtocolDto?> GetByIdAsync(Guid id);
        Task<HandoverProtocolDto?> GetByRequestIdAsync(Guid requestId);
        Task<HandoverProtocolDto> CreateAsync(CreateHandoverProtocolDto dto);
        Task<HandoverProtocolDto> UpdateAsync(Guid id, UpdateHandoverProtocolDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
