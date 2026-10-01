using System;
using System.Threading.Tasks;
using CarRental.API.DTOs.Auth;

namespace CarRental.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
        Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
        Task<UserDto?> GetProfileAsync(Guid userId);
    }
}
