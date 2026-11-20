using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Common;
using CarRental.API.DTOs.Notification;

namespace CarRental.API.Services
{
    public interface INotificationService
    {
        Task<NotificationDto> CreateNotificationAsync(
            Guid userId, 
            string title, 
            string message, 
            string type = "SYSTEM", 
            string? referenceId = null, 
            string? actionUrl = null);

        Task<PagedResultDto<NotificationDto>> GetUserNotificationsAsync(
            Guid userId, 
            int page = 1, 
            int pageSize = 20, 
            string? type = null, 
            bool? unreadOnly = null);

        Task<int> GetUnreadCountAsync(Guid userId);

        Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId);

        Task<int> MarkAllAsReadAsync(Guid userId);

        Task<bool> DeleteNotificationAsync(Guid notificationId, Guid userId);
    }
}
