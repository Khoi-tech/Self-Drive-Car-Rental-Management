using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.ContractTemplate;

namespace CarRental.API.Services
{
    public interface IContractTemplateService
    {
        Task<IEnumerable<ContractTemplateResponseDto>> GetAllAsync(string? search = null, string? type = null, bool? isActive = null);
        Task<ContractTemplateResponseDto?> GetByIdAsync(Guid id);
        Task<ContractTemplateResponseDto> CreateAsync(CreateContractTemplateDto dto);
        Task<ContractTemplateResponseDto?> UpdateAsync(Guid id, UpdateContractTemplateDto dto);
        Task<bool> UpdateStatusAsync(Guid id, bool isActive);
        Task<bool> DeleteAsync(Guid id);
    }
}
