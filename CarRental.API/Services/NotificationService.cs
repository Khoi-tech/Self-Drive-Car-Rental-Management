using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Common;
using CarRental.API.DTOs.Notification;
using CarRental.API.Entities;
using CarRental.API.Hubs;

namespace CarRental.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task<NotificationDto> CreateNotificationAsync(
            Guid userId, 
            string title, 
            string message, 
            string type = "SYSTEM", 
            string? referenceId = null, 
            string? actionUrl = null)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = string.IsNullOrWhiteSpace(type) ? "SYSTEM" : type.ToUpperInvariant(),
                ReferenceId = referenceId,
                ActionUrl = actionUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            var dto = new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                ReferenceId = notification.ReferenceId,
                ActionUrl = notification.ActionUrl,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };

            // Broadcast real-time event to the user's active client(s)
            try
            {
                var userGroup = $"User_{userId}";
                await _hubContext.Clients.Group(userGroup).SendAsync("ReceiveNotification", dto);
                await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", dto);

                var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
                await _hubContext.Clients.Group(userGroup).SendAsync("UnreadCountUpdated", unreadCount);
                await _hubContext.Clients.User(userId.ToString()).SendAsync("UnreadCountUpdated", unreadCount);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SignalR Notification Broadcast Notice]: {ex.Message}");
            }

            return dto;
        }

        public async Task<PagedResultDto<NotificationDto>> GetUserNotificationsAsync(
            Guid userId, 
            int page = 1, 
            int pageSize = 20, 
            string? type = null, 
            bool? unreadOnly = null)
        {
            var query = _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId);

            if (!string.IsNullOrWhiteSpace(type) && type != "ALL")
            {
                query = query.Where(n => n.Type == type.ToUpperInvariant());
            }

            if (unreadOnly.HasValue && unreadOnly.Value)
            {
                query = query.Where(n => !n.IsRead);
            }

            int totalCount = await query.CountAsync();
            int p = Math.Max(1, page);
            int ps = Math.Clamp(pageSize, 1, 100);

            var items = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((p - 1) * ps)
                .Take(ps)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    UserId = n.UserId,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    ReferenceId = n.ReferenceId,
                    ActionUrl = n.ActionUrl,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();

            return new PagedResultDto<NotificationDto>(items, totalCount, p, ps);
        }

        public async Task<int> GetUnreadCountAsync(Guid userId)
        {
            return await _context.Notifications
                .AsNoTracking()
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null) return false;

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();

                try
                {
                    var userGroup = $"User_{userId}";
                    var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
                    await _hubContext.Clients.Group(userGroup).SendAsync("UnreadCountUpdated", unreadCount);
                    await _hubContext.Clients.User(userId.ToString()).SendAsync("UnreadCountUpdated", unreadCount);
                }
                catch { }
            }

            return true;
        }

        public async Task<int> MarkAllAsReadAsync(Guid userId)
        {
            var unreadList = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (unreadList.Count == 0) return 0;

            foreach (var n in unreadList)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();

            try
            {
                var userGroup = $"User_{userId}";
                await _hubContext.Clients.Group(userGroup).SendAsync("UnreadCountUpdated", 0);
                await _hubContext.Clients.User(userId.ToString()).SendAsync("UnreadCountUpdated", 0);
            }
            catch { }

            return unreadList.Count;
        }

        public async Task<bool> DeleteNotificationAsync(Guid notificationId, Guid userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null) return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            try
            {
                var userGroup = $"User_{userId}";
                var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
                await _hubContext.Clients.Group(userGroup).SendAsync("UnreadCountUpdated", unreadCount);
                await _hubContext.Clients.User(userId.ToString()).SendAsync("UnreadCountUpdated", unreadCount);
            }
            catch { }

            return true;
        }
    }
}
