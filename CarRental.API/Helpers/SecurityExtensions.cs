using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.Entities;

namespace CarRental.API.Helpers
{
    public static class SecurityExtensions
    {
        public static Guid? GetUserId(this ClaimsPrincipal user)
        {
            var idStr = user.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? user.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

            return Guid.TryParse(idStr, out var id) ? id : null;
        }

        public static string? GetUserEmail(this ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Email)
                   ?? user.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)
                   ?? user.FindFirstValue("email");
        }

        public static string? GetUserRole(this ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Role) ?? user.FindFirstValue("role");
        }

        public static bool IsOperations(this ClaimsPrincipal user)
        {
            return user.IsInRole("ADMIN") || user.IsInRole("MANAGER") || user.IsInRole("STAFF");
        }

        public static bool IsManagement(this ClaimsPrincipal user)
        {
            return user.IsInRole("ADMIN") || user.IsInRole("MANAGER");
        }

        public static bool IsAdmin(this ClaimsPrincipal user)
        {
            return user.IsInRole("ADMIN");
        }

        public static bool CanAccessRequest(this ClaimsPrincipal user, RentalRequest request, User? dbUser = null)
        {
            if (user.IsOperations()) return true;

            if (dbUser != null)
            {
                if (!dbUser.IsActive) return false;
                var dbEmail = dbUser.Email?.Trim();
                var dbPhone = dbUser.PhoneNumber?.Trim();
                if (!string.IsNullOrWhiteSpace(dbEmail) && string.Equals(request.CustomerEmail?.Trim(), dbEmail, StringComparison.OrdinalIgnoreCase)) return true;
                if (!string.IsNullOrWhiteSpace(dbPhone) && string.Equals(request.CustomerPhone?.Trim(), dbPhone, StringComparison.OrdinalIgnoreCase)) return true;
                return false;
            }

            var email = user.GetUserEmail();
            if (!string.IsNullOrWhiteSpace(email) &&
                string.Equals(request.CustomerEmail?.Trim(), email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        public static async Task<bool> CanAccessRequestIdAsync(this ClaimsPrincipal user, Guid? requestId, AppDbContext db)
        {
            if (!requestId.HasValue || requestId.Value == Guid.Empty) return false;
            if (user.IsOperations()) return true;

            var userId = user.GetUserId();
            if (!userId.HasValue) return false;

            // Vá triệt để IDOR: Trích xuất UserId trực tiếp từ JWT Claim (ClaimTypes.NameIdentifier)
            // và đối chiếu với bản ghi User đã xác minh trong PostgreSQL
            var dbUser = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (dbUser == null || !dbUser.IsActive) return false;

            var normalizedEmail = dbUser.Email?.Trim().ToLowerInvariant();
            var phone = dbUser.PhoneNumber?.Trim();

            return await db.RentalRequests
                .AsNoTracking()
                .AnyAsync(r => r.Id == requestId.Value && 
                    ((normalizedEmail != null && r.CustomerEmail.ToLower() == normalizedEmail) ||
                     (phone != null && r.CustomerPhone == phone)));
        }
    }
}
