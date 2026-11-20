using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private Guid? GetCurrentUserId()
        {
            var claimValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                             ?? User.FindFirst("sub")?.Value;
            if (Guid.TryParse(claimValue, out var userId))
            {
                return userId;
            }
            return null;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? type = null,
            [FromQuery] bool? unreadOnly = null)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không tìm thấy thông tin định danh người dùng." });
            }

            var result = await _notificationService.GetUserNotificationsAsync(
                userId.Value, page, pageSize, type, unreadOnly);
            return Ok(result);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không tìm thấy thông tin định danh người dùng." });
            }

            var count = await _notificationService.GetUnreadCountAsync(userId.Value);
            return Ok(new { unreadCount = count });
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không tìm thấy thông tin định danh người dùng." });
            }

            var success = await _notificationService.MarkAsReadAsync(id, userId.Value);
            if (!success)
            {
                return NotFound(new { Message = "Thông báo không tồn tại hoặc bạn không có quyền truy cập." });
            }

            return Ok(new { Success = true, Message = "Đã đánh dấu thông báo là đã đọc." });
        }

        [HttpPatch("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không tìm thấy thông tin định danh người dùng." });
            }

            var count = await _notificationService.MarkAllAsReadAsync(userId.Value);
            return Ok(new { Success = true, UpdatedCount = count, Message = "Đã đánh dấu tất cả thông báo là đã đọc." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không tìm thấy thông tin định danh người dùng." });
            }

            var success = await _notificationService.DeleteNotificationAsync(id, userId.Value);
            if (!success)
            {
                return NotFound(new { Message = "Thông báo không tồn tại hoặc bạn không có quyền xóa." });
            }

            return Ok(new { Success = true, Message = "Đã xóa thông báo." });
        }
    }
}
