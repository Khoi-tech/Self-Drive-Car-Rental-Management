using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.ReturnProtocol;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReturnProtocolsController : ControllerBase
    {
        private readonly IReturnProtocolService _service;

        public ReturnProtocolsController(IReturnProtocolService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<IEnumerable<ReturnProtocolResponseDto>>> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<ReturnProtocolResponseDto>> GetById(Guid id)
        {
            var protocol = await _service.GetByIdAsync(id);
            if (protocol == null)
            {
                return NotFound(new { message = "Không tìm thấy biên bản hoàn trả xe." });
            }
            return Ok(protocol);
        }

        [HttpGet("by-request/{requestId}")]
        [Authorize]
        public async Task<ActionResult<ReturnProtocolResponseDto>> GetByRequestId(Guid requestId)
        {
            var protocol = await _service.GetByRequestIdAsync(requestId);
            if (protocol == null)
            {
                return NotFound(new { message = "Chưa có biên bản hoàn trả cho đơn thuê này." });
            }
            return Ok(protocol);
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN,STAFF")]
        public async Task<ActionResult<ReturnProtocolResponseDto>> Create([FromBody] CreateReturnProtocolDto dto)
        {
            try
            {
                var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Guid? staffId = Guid.TryParse(staffIdClaim, out var parsedId) ? parsedId : null;
                var staffName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Nhân viên kiểm định VELORA";

                var result = await _service.CreateAsync(dto, staffId, staffName);
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
    }
}
