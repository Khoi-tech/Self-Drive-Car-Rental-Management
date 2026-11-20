using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.Data;
using CarRental.API.DTOs.Handover;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/handover-protocols")]
    public class HandoverProtocolsController : ControllerBase
    {
        private readonly IHandoverProtocolService _protocolService;
        private readonly AppDbContext _context;

        public HandoverProtocolsController(IHandoverProtocolService protocolService, AppDbContext context)
        {
            _protocolService = protocolService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var list = await _protocolService.GetAllAsync(status);
            return Ok(list);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _protocolService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy biên bản bàn giao." });

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

            var item = await _protocolService.GetByRequestIdAsync(requestId);
            if (item == null) return NotFound(new { message = "Chưa có biên bản bàn giao cho yêu cầu thuê này." });
            return Ok(item);
        }

        [HttpPost]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> Create([FromBody] CreateHandoverProtocolDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var created = await _protocolService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHandoverProtocolDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var updated = await _protocolService.UpdateAsync(id, dto);
                return Ok(updated);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/confirm")]
        [Authorize]
        public async Task<IActionResult> Confirm(Guid id, [FromBody] HandoverConfirmDto dto)
        {
            var item = await _protocolService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy biên bản bàn giao." });

            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(item.RentalRequestId, _context))
                {
                    return Forbid();
                }
            }

            try
            {
                var confirmed = await _protocolService.ConfirmHandoverAsync(id, dto);
                return Ok(new { message = "Xác nhận bàn giao xe thành công. Đơn thuê đã chính thức được kích hoạt (ACTIVE).", data = confirmed });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("car/{carId:guid}/latest-damages")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLatestDamagesByCar(Guid carId)
        {
            var json = await _protocolService.GetLatestDamagePointsByCarIdAsync(carId);
            return Ok(new { carId, damagePointsJson = json });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _protocolService.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Không tìm thấy biên bản để xóa." });
            return Ok(new { message = "Đã xóa biên bản bàn giao thành công." });
        }
    }
}
