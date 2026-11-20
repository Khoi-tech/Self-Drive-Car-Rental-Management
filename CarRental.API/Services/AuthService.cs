using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using CarRental.API.Data;
using CarRental.API.DTOs.Auth;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (existingUser != null)
            {
                throw new InvalidOperationException("Email này đã được sử dụng. Vui lòng chọn email khác.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber?.Trim(),
                Role = "CUSTOMER",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);

            var refreshToken = CreateRefreshTokenEntity(user.Id);
            _context.RefreshTokens.Add(refreshToken);

            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken.Token,
                User = MapToUserDto(user)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

            if (user == null)
            {
                throw new InvalidOperationException("Email hoặc mật khẩu không chính xác.");
            }

            if (!user.IsActive)
            {
                throw new InvalidOperationException(
                    $"Tài khoản của bạn đã bị khóa hoặc tạm dừng{(string.IsNullOrWhiteSpace(user.LockReason) ? "" : $": {user.LockReason}")}. Vui lòng liên hệ ban quản trị.");
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                throw new InvalidOperationException("Email hoặc mật khẩu không chính xác.");
            }

            var refreshToken = CreateRefreshTokenEntity(user.Id);
            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken.Token,
                User = MapToUserDto(user)
            };
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(string refreshTokenStr)
        {
            if (string.IsNullOrWhiteSpace(refreshTokenStr))
            {
                throw new InvalidOperationException("Refresh token không được để trống.");
            }

            var storedToken = await _context.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == refreshTokenStr);

            if (storedToken == null)
            {
                throw new InvalidOperationException("Refresh token không hợp lệ hoặc không tồn tại.");
            }

            if (storedToken.IsRevoked)
            {
                throw new InvalidOperationException("Refresh token này đã bị thu hồi.");
            }

            if (storedToken.IsExpired)
            {
                throw new InvalidOperationException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.");
            }

            if (storedToken.User == null || !storedToken.User.IsActive)
            {
                throw new InvalidOperationException("Tài khoản người dùng không tồn tại hoặc đã bị khóa.");
            }

            // Rotate Refresh Token
            storedToken.RevokedAt = DateTime.UtcNow;

            var newRefreshToken = CreateRefreshTokenEntity(storedToken.UserId);
            storedToken.ReplacedByToken = newRefreshToken.Token;

            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            var newAccessToken = GenerateJwtToken(storedToken.User);

            return new AuthResponseDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken.Token,
                User = MapToUserDto(storedToken.User)
            };
        }

        public async Task<bool> RevokeTokenAsync(string? refreshTokenStr, Guid? userId)
        {
            if (!string.IsNullOrWhiteSpace(refreshTokenStr))
            {
                var token = await _context.RefreshTokens
                    .FirstOrDefaultAsync(r => r.Token == refreshTokenStr);

                if (token != null && !token.IsRevoked)
                {
                    token.RevokedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }

            if (userId.HasValue)
            {
                var activeTokens = await _context.RefreshTokens
                    .Where(r => r.UserId == userId.Value && r.RevokedAt == null)
                    .ToListAsync();

                foreach (var t in activeTokens)
                {
                    t.RevokedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<bool> ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new InvalidOperationException("Tài khoản người dùng không tồn tại.");
            }

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            {
                throw new InvalidOperationException("Mật khẩu hiện tại không chính xác.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            // Revoke all active refresh tokens for security upon password change
            var activeTokens = await _context.RefreshTokens
                .Where(r => r.UserId == userId && r.RevokedAt == null)
                .ToListAsync();

            foreach (var t in activeTokens)
            {
                t.RevokedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> GetProfileAsync(Guid userId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            return MapToUserDto(user);
        }

        private string GenerateJwtToken(User user)
        {
            var keyString = _config["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(keyString))
            {
                throw new InvalidOperationException("Cấu hình khóa bí mật Jwt:Key không tồn tại hoặc chưa được thiết lập.");
            }
            var issuer = _config["Jwt:Issuer"] ?? "CarRental.API";
            var audience = _config["Jwt:Audience"] ?? "CarRental.Web";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("role", user.Role)
            };

            // Set Access Token lifetime to 30 minutes
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static RefreshToken CreateRefreshTokenEntity(Guid userId)
        {
            return new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                LockReason = user.LockReason,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
