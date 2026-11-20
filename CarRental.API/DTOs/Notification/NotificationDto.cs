using System;

namespace CarRental.API.DTOs.Notification
{
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "SYSTEM";
        public string? ReferenceId { get; set; }
        public string? ActionUrl { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateNotificationDto
    {
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "SYSTEM";
        public string? ReferenceId { get; set; }
        public string? ActionUrl { get; set; }
    }
}
