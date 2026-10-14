using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Settlement;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettlementsController : ControllerBase
    {
        private readonly ISettlementService _service;

        public SettlementsController(ISettlementService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<IEnumerable<SettlementResponseDto>>> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<SettlementResponseDto>> GetById(Guid id)
        {
            var settlement = await _service.GetByIdAsync(id);
            if (settlement == null)
            {
                return NotFound(new { message = "Không tìm thấy phiếu quyết toán." });
            }
            return Ok(settlement);
        }

        [HttpGet("by-request/{requestId}")]
        [Authorize]
        public async Task<ActionResult<SettlementResponseDto>> GetByRequestId(Guid requestId)
        {
            var settlement = await _service.GetByRequestIdAsync(requestId);
            if (settlement == null)
            {
                return NotFound(new { message = "Chưa có phiếu quyết toán cho đơn thuê này." });
            }
            return Ok(settlement);
        }

        [HttpGet("preview/{requestId}")]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<PreviewSettlementDto>> PreviewSettlement(Guid requestId)
        {
            try
            {
                var preview = await _service.PreviewSettlementAsync(requestId);
                return Ok(preview);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<SettlementResponseDto>> Create([FromBody] CreateSettlementDto dto)
        {
            try
            {
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Guid? staffId = Guid.TryParse(staffIdClaim, out var parsedId) ? parsedId : null;
                var staffName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Nhân viên quyết toán VELORA";

                var result = await _service.CreateSettlementAsync(dto, staffId, staffName);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/confirm-refund")]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<SettlementResponseDto>> ConfirmRefund(Guid id, [FromBody] ConfirmRefundDto dto)
        {
            try
            {
                var result = await _service.ConfirmRefundAsync(id, dto);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/confirm-additional-payment")]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<SettlementResponseDto>> ConfirmAdditionalPayment(Guid id, [FromBody] ConfirmAdditionalPaymentDto dto)
        {
            try
            {
                var result = await _service.ConfirmAdditionalPaymentAsync(id, dto);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
