using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.CompensationPolicy;

namespace CarRental.API.Services
{
    public interface ICompensationPolicyService
    {
        Task<IEnumerable<CompensationPolicyDto>> GetAllAsync();
        Task<CompensationPolicyDto?> GetByIdAsync(Guid id);
        Task<CompensationPolicyDto> CreateAsync(CreateCompensationPolicyDto createDto);
        Task<CompensationPolicyDto?> UpdateAsync(Guid id, UpdateCompensationPolicyDto updateDto);
        Task<bool> UpdateStatusAsync(Guid id, bool isActive);
    }
}
