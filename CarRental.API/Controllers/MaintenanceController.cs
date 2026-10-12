using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Maintenance;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/maintenance")]
    public class MaintenanceController : ControllerBase
    {
        private readonly IMaintenanceService _maintenanceService;

        public MaintenanceController(IMaintenanceService maintenanceService)
        {
            _maintenanceService = maintenanceService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] Guid? carId)
        {
            var list = await _maintenanceService.GetAllAsync(status, carId);
            return Ok(list);
        }

        [HttpGet("alerts")]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _maintenanceService.GetAlertsAsync();
            return Ok(alerts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _maintenanceService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy hồ sơ bảo dưỡng." });
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMaintenanceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var created = await _maintenanceService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> Complete(Guid id, [FromBody] CompleteMaintenanceDto dto)
        {
            try
            {
                var completed = await _maintenanceService.CompleteAsync(id, dto);
                return Ok(new { message = "Hoàn tất bảo dưỡng xe thành công. Xe đã chuyển về trạng thái sẵn sàng (READY).", data = completed });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _maintenanceService.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Không tìm thấy hồ sơ để xóa." });
            return Ok(new { message = "Đã xóa hồ sơ bảo dưỡng thành công." });
        }
    }
}
