using System;
using System.Threading.Tasks;
using CarRental.API.DTOs.RentalRequest;

namespace CarRental.API.Services
{
    public interface IRentalRequestService
    {
        Task<RentalRequestResponseDto> CreateRequestAsync(CreateRentalRequestDto dto);
        Task<RentalRequestResponseDto?> GetByIdAsync(Guid id);
        Task<List<RentalRequestResponseDto>> GetAllAsync(string? status = null);
    }
}
