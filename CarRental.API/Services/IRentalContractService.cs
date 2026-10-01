using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Contract;

namespace CarRental.API.Services
{
    public interface IRentalContractService
    {
        Task<RentalContractDto> GetOrCreateContractByRequestIdAsync(Guid requestId);
        Task<RentalContractDto?> GetContractByIdAsync(Guid contractId);
        Task<RentalContractDto> SignContractAsync(Guid contractId, SignContractRequestDto dto);
        Task<List<RentalContractDto>> GetAllContractsAsync(string? status = null);
    }
}
