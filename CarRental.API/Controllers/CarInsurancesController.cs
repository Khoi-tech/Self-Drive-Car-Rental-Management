using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRental.API.DTOs.Insurance;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/insurances")]
    public class CarInsurancesController : ControllerBase
    {
        private readonly ICarInsuranceService _insuranceService;

        public CarInsurancesController(ICarInsuranceService insuranceService)
        {
            _insuranceService = insuranceService;
        }


        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Guid? carId, [FromQuery] string? status)
        {
            var list = await _insuranceService.GetAllAsync(carId, status);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var item = await _insuranceService.GetByIdAsync(id);
            if (item == null) return NotFound(new { message = "Không tìm thấy bảo hiểm." });
            return Ok(item);
        }

        [HttpGet("vehicle/{vehicleId}")]
        public async Task<IActionResult> GetByVehicle(Guid vehicleId)
        {
            var list = await _insuranceService.GetByCarIdAsync(vehicleId);
            return Ok(list);
        }

        [HttpGet("alerts")]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _insuranceService.GetAlertsAsync();
            return Ok(alerts);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCarInsuranceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var created = await _insuranceService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCarInsuranceDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var updated = await _insuranceService.UpdateAsync(id, dto);
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
            var deleted = await _insuranceService.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Không tìm thấy bảo hiểm để xóa." });
            return Ok(new { message = "Đã xóa bản ghi bảo hiểm thành công." });
        }
    }
}
