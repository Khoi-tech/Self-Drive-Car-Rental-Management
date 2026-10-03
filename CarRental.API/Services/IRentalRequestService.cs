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
        Task<List<RentalRequestResponseDto>> GetByCustomerAsync(string? email, string? phone);
        Task<RentalRequestResponseDto> ApproveRequestAsync(Guid id);
        Task<RentalRequestResponseDto> RejectRequestAsync(Guid id, string reason);
    }
}
