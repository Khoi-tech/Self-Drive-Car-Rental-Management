using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.Data;
using CarRental.API.DTOs.Incidents;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/incidents")]
    public class IncidentReportsController : ControllerBase
    {
        private readonly IIncidentReportService _incidentService;
        private readonly AppDbContext _context;

        public IncidentReportsController(IIncidentReportService incidentService, AppDbContext context)
        {
            _incidentService = incidentService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? severity)
        {
            var list = await _incidentService.GetAllAsync(status, severity);
            return Ok(list);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _incidentService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy hồ sơ sự cố." });

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

            var list = await _incidentService.GetByRequestIdAsync(requestId);
            return Ok(list);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateIncidentReportDto dto)
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
                var created = await _incidentService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/status")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateIncidentStatusDto dto)
        {
            try
            {
                var staffName = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("fullName") ?? dto.StaffName ?? "Nhân viên VELORA";
                dto.StaffName = staffName;

                var updated = await _incidentService.UpdateStatusAsync(id, dto);
                return Ok(new { message = "Cập nhật trạng thái sự cố thành công.", data = updated });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/resolve")]
        [HttpPut("{id}/resolve")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> Resolve(Guid id, [FromBody] ResolveIncidentDto dto)
        {
            try
            {
                var staffName = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("fullName") ?? dto.StaffName ?? "Nhân viên VELORA";
                dto.StaffName = staffName;

                var resolved = await _incidentService.ResolveAsync(id, dto);
                return Ok(new { message = "Đã giải quyết và lưu hồ sơ sự cố thành công.", data = resolved });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
