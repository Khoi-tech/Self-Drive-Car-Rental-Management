using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using CarRental.API.Data;
using CarRental.API.Helpers;

namespace CarRental.API.Middleware
{
    public class UserActiveStatusCacheItem
    {
        public bool IsActive { get; set; } = true;
        public string? LockReason { get; set; }
    }

    public static class UserStatusCache
    {
        public static string GetKey(Guid userId) => $"user_active_status_{userId}";

        public static void Invalidate(IMemoryCache cache, Guid userId)
        {
            cache.Remove(GetKey(userId));
        }

        public static void SetStatus(IMemoryCache cache, Guid userId, bool isActive, string? lockReason)
        {
            cache.Set(GetKey(userId), new UserActiveStatusCacheItem
            {
                IsActive = isActive,
                LockReason = lockReason
            }, TimeSpan.FromHours(24));
        }
    }

    public class UserActiveStatusMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly IServiceScopeFactory _scopeFactory;

        public UserActiveStatusMiddleware(RequestDelegate next, IMemoryCache cache, IServiceScopeFactory scopeFactory)
        {
            _next = next;
            _cache = cache;
            _scopeFactory = scopeFactory;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.GetUserId();
                if (userId.HasValue)
                {
                    var cacheKey = UserStatusCache.GetKey(userId.Value);

                    if (!_cache.TryGetValue(cacheKey, out UserActiveStatusCacheItem? cacheItem))
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        var dbUser = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
                        if (dbUser != null)
                        {
                            cacheItem = new UserActiveStatusCacheItem
                            {
                                IsActive = dbUser.IsActive,
                                LockReason = dbUser.LockReason
                            };
                            _cache.Set(cacheKey, cacheItem, TimeSpan.FromMinutes(10));
                        }
                    }

                    if (cacheItem != null && !cacheItem.IsActive)
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Tài khoản của bạn đã bị khóa hoặc tạm dừng quyền truy cập.",
                            lockReason = cacheItem.LockReason ?? "Vi phạm quy định vận hành của hệ thống VELORA."
                        });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}
