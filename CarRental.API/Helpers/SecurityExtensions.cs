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

        public static bool CanAccessRequest(this ClaimsPrincipal user, RentalRequest request)
        {
            if (user.IsOperations()) return true;

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

            var email = user.GetUserEmail();
            if (string.IsNullOrWhiteSpace(email)) return false;

            var normalizedEmail = email.Trim().ToLowerInvariant();

            return await db.RentalRequests
                .AsNoTracking()
                .AnyAsync(r => r.Id == requestId.Value && r.CustomerEmail.ToLower() == normalizedEmail);
        }
    }
}
