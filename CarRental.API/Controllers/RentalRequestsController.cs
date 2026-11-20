using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Common;
using CarRental.API.Data;
using CarRental.API.DTOs.Common;
using CarRental.API.DTOs.RentalRequest;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/rental-requests")]
    public class RentalRequestsController : ControllerBase
    {
        private readonly IRentalRequestService _rentalRequestService;
        private readonly AppDbContext _context;

        public RentalRequestsController(IRentalRequestService rentalRequestService, AppDbContext context)
        {
            _rentalRequestService = rentalRequestService;
            _context = context;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> CreateRequest([FromBody] CreateRentalRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _rentalRequestService.CreateRequestAsync(dto);
                return CreatedAtAction(nameof(GetRequest), new { id = response.Id }, response);
            }
            catch (ConflictException ex)
            {
                return StatusCode(StatusCodes.Status409Conflict, new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> GetAllRequests(
            [FromQuery] string? status,
            [FromQuery] string? customerEmail,
            [FromQuery] string? customerPhone,
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null)
        {
            IEnumerable<RentalRequestResponseDto> list;
            if (!string.IsNullOrWhiteSpace(customerEmail) || !string.IsNullOrWhiteSpace(customerPhone))
            {
                list = await _rentalRequestService.GetByCustomerAsync(customerEmail, customerPhone);
                if (!string.IsNullOrWhiteSpace(status))
                {
                    list = list.Where(r => r.Status == status);
                }
            }
            else
            {
                list = await _rentalRequestService.GetAllAsync(status);
            }

            var allItems = list.ToList();
            int totalCount = allItems.Count;
            int p = Math.Max(1, page ?? 1);
            int ps = pageSize.HasValue ? Math.Clamp(pageSize.Value, 1, 100) : (page.HasValue ? 20 : totalCount);
            var pagedItems = allItems.Skip((p - 1) * ps).Take(ps).ToList();

            return Ok(new PagedResultDto<RentalRequestResponseDto>(pagedItems, totalCount, p, ps));
        }

        [HttpGet("my-requests")]
        [Authorize]
        public async Task<IActionResult> GetMyRequests([FromQuery] string? email, [FromQuery] string? phone)
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không thể xác định danh tính người dùng." });
            }

            // Fix IDOR: If user is CUSTOMER, strictly resolve identity from verified database record
            if (!User.IsOperations())
            {
                var dbUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
                if (dbUser == null)
                {
                    return Unauthorized(new { Message = "Người dùng không tồn tại trong hệ thống." });
                }

                var userRequests = await _rentalRequestService.GetByCustomerAsync(dbUser.Email, dbUser.PhoneNumber);
                return Ok(userRequests);
            }

            // For Operations roles, allow lookup by customer email or phone
            var targetEmail = !string.IsNullOrWhiteSpace(email) ? email : User.GetUserEmail();
            if (string.IsNullOrWhiteSpace(targetEmail) && string.IsNullOrWhiteSpace(phone))
            {
                return BadRequest(new { Message = "Vui lòng cung cấp email hoặc số điện thoại để tra cứu đơn thuê." });
            }

            var requests = await _rentalRequestService.GetByCustomerAsync(targetEmail, phone);
            return Ok(requests);
        }

        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> GetRequest(Guid id)
        {
            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(id, _context))
                {
                    return Forbid();
                }
            }

            var request = await _rentalRequestService.GetByIdAsync(id);
            if (request == null)
            {
                return NotFound(new { Message = "Không tìm thấy yêu cầu thuê xe" });
            }

            return Ok(request);
        }

        [HttpPut("{id:guid}/approve")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> ApproveRequest(Guid id)
        {
            try
            {
                var result = await _rentalRequestService.ApproveRequestAsync(id);
                return Ok(new { Message = "Phê duyệt yêu cầu thành công", Data = result });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpPut("{id:guid}/reject")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> RejectRequest(Guid id, [FromBody] RejectRentalRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _rentalRequestService.RejectRequestAsync(id, dto.Reason);
                return Ok(new { Message = "Từ chối yêu cầu thuê xe thành công", Data = result });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpPut("{id:guid}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelRequest(Guid id)
        {
            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(id, _context))
                {
                    return Forbid();
                }
            }

            try
            {
                var result = await _rentalRequestService.CancelRequestAsync(id);
                return Ok(new { Message = "Hủy đơn thuê xe thành công.", Data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpPut("{id:guid}/documents")]
        [Authorize]
        public async Task<IActionResult> UpdateDocuments(Guid id, [FromBody] UpdateRentalDocumentsDto dto)
        {
            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(id, _context))
                {
                    return Forbid();
                }
            }

            try
            {
                var result = await _rentalRequestService.UpdateDocumentsAsync(id, dto);
                return Ok(new { Message = "Bổ sung hồ sơ định danh thành công.", Data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpPut("{id:guid}/confirm-security-deposit")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> ConfirmSecurityDeposit(Guid id, [FromQuery] bool isPaid = true)
        {
            try
            {
                var result = await _rentalRequestService.ConfirmSecurityDepositAsync(id, isPaid);
                return Ok(new { Message = isPaid ? "Xác nhận thu tiền cọc thế chân thành công." : "Đặt lại trạng thái chưa thu cọc thế chân.", Data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }
    }
}
