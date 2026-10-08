using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Handover;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/handover-protocols")]
    public class HandoverProtocolsController : ControllerBase
    {
        private readonly IHandoverProtocolService _protocolService;

        public HandoverProtocolsController(IHandoverProtocolService protocolService)
        {
            _protocolService = protocolService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var list = await _protocolService.GetAllAsync(status);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _protocolService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy biên bản bàn giao." });
            return Ok(item);
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(Guid requestId)
        {
            var item = await _protocolService.GetByRequestIdAsync(requestId);
            if (item == null) return NotFound(new { message = "Chưa có biên bản bàn giao cho yêu cầu thuê này." });
            return Ok(item);
        }

        [HttpPost]
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

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _protocolService.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Không tìm thấy biên bản để xóa." });
            return Ok(new { message = "Đã xóa biên bản bàn giao thành công." });
        }
    }
}
