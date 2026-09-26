using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.RentalCondition;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/vehicles/{vehicleId}/rental-condition")]
    public class RentalConditionsController : ControllerBase
    {
        private readonly IRentalConditionService _rentalConditionService;
        private readonly IVehicleService _vehicleService;

        public RentalConditionsController(IRentalConditionService rentalConditionService, IVehicleService vehicleService)
        {
            _rentalConditionService = rentalConditionService;
            _vehicleService = vehicleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCondition(Guid vehicleId)
        {
            var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
            if (vehicle == null) return NotFound(new { message = "Không tìm thấy xe." });

            var condition = await _rentalConditionService.GetByVehicleIdAsync(vehicleId);
            if (condition == null)
            {
                // Trả về 200 OK kèm null hoặc object empty để frontend hiểu là "Chưa thiết lập"
                return Ok(null);
            }

            return Ok(condition);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCondition(Guid vehicleId, [FromBody] CreateRentalConditionDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
            if (vehicle == null) return NotFound(new { message = "Không tìm thấy xe." });

            try
            {
                var result = await _rentalConditionService.CreateAsync(vehicleId, createDto);
                if (result == null) return NotFound(new { message = "Không tìm thấy xe." });
                return CreatedAtAction(nameof(GetCondition), new { vehicleId = vehicleId }, result);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateCondition(Guid vehicleId, [FromBody] UpdateRentalConditionDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
            if (vehicle == null) return NotFound(new { message = "Không tìm thấy xe." });

            var result = await _rentalConditionService.UpdateAsync(vehicleId, updateDto);
            if (result == null)
            {
                return NotFound(new { message = "Chưa thiết lập điều kiện thuê cho xe này." });
            }

            return Ok(result);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteCondition(Guid vehicleId)
        {
            var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
            if (vehicle == null) return NotFound(new { message = "Không tìm thấy xe." });

            var success = await _rentalConditionService.DeleteAsync(vehicleId);
            if (!success) return NotFound(new { message = "Chưa thiết lập điều kiện thuê cho xe này." });

            return NoContent();
        }
    }
}
