using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Extensions;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/rental-extensions")]
    public class RentalExtensionsController : ControllerBase
    {
        private readonly IRentalExtensionService _extensionService;

        public RentalExtensionsController(IRentalExtensionService extensionService)
        {
            _extensionService = extensionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var list = await _extensionService.GetAllAsync(status);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _extensionService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy yêu cầu gia hạn." });
            return Ok(item);
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(Guid requestId)
        {
            var list = await _extensionService.GetByRequestIdAsync(requestId);
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRentalExtensionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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
        public async Task<IActionResult> Approve(Guid id, [FromBody] ProcessRentalExtensionDto dto)
        {
            try
            {
                var approved = await _extensionService.ApproveAsync(id, dto);
                return Ok(new { message = "Đã phê duyệt gia hạn đơn thuê thành công.", data = approved });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> Reject(Guid id, [FromBody] ProcessRentalExtensionDto dto)
        {
            try
            {
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
