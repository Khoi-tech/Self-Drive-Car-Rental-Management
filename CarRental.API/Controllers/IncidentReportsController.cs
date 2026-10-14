using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Incidents;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/incidents")]
    public class IncidentReportsController : ControllerBase
    {
        private readonly IIncidentReportService _incidentService;

        public IncidentReportsController(IIncidentReportService incidentService)
        {
            _incidentService = incidentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? severity)
        {
            var list = await _incidentService.GetAllAsync(status, severity);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _incidentService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy hồ sơ sự cố." });
            return Ok(item);
        }

        [HttpGet("request/{requestId}")]
        public async Task<IActionResult> GetByRequestId(Guid requestId)
        {
            var list = await _incidentService.GetByRequestIdAsync(requestId);
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateIncidentReportDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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
        [Authorize(Roles = "ADMIN,STAFF")]
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
        [Authorize(Roles = "ADMIN,STAFF")]
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
