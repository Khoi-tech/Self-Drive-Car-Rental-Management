using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.Common;
using CarRental.API.Data;
using CarRental.API.DTOs.Extensions;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/rental-extensions")]
    public class RentalExtensionsController : ControllerBase
    {
        private readonly IRentalExtensionService _extensionService;
        private readonly AppDbContext _context;

        public RentalExtensionsController(IRentalExtensionService extensionService, AppDbContext context)
        {
            _extensionService = extensionService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var list = await _extensionService.GetAllAsync(status);
            return Ok(list);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _extensionService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy yêu cầu gia hạn." });

            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(item.RentalRequestId, _context))
                {
                    return Forbid();
                }
            }

            return Ok(item);
        }

        [HttpGet("request/{requestId}")]
        [Authorize]
        public async Task<IActionResult> GetByRequestId(Guid requestId)
        {
            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(requestId, _context))
                {
                    return Forbid();
                }
            }

            var list = await _extensionService.GetByRequestIdAsync(requestId);
            return Ok(list);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateRentalExtensionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(dto.RentalRequestId, _context))
                {
                    return Forbid();
                }
            }

            try
            {
                var created = await _extensionService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> Approve(Guid id, [FromBody] ProcessRentalExtensionDto dto)
        {
            try
            {
                var staffName = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("fullName") ?? dto.StaffName ?? "Nhân viên VELORA";
                dto.StaffName = staffName;

                var approved = await _extensionService.ApproveAsync(id, dto);
                return Ok(new { message = "Đã phê duyệt gia hạn đơn thuê thành công.", data = approved });
            }
            catch (ConflictException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] ProcessRentalExtensionDto dto)
        {
            try
            {
                var staffName = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("fullName") ?? dto.StaffName ?? "Nhân viên VELORA";
                dto.StaffName = staffName;

                var rejected = await _extensionService.RejectAsync(id, dto);
                return Ok(new { message = "Đã từ chối yêu cầu gia hạn.", data = rejected });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
