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
        Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeTokenAsync(string? refreshToken, Guid? userId);
        Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
    }
}
