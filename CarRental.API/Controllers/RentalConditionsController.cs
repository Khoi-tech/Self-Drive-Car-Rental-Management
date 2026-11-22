using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Hybrid;
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
        private readonly HybridCache _cache;

        public RentalConditionsController(
            IRentalConditionService rentalConditionService,
            IVehicleService vehicleService,
            HybridCache cache)
        {
            _rentalConditionService = rentalConditionService;
            _vehicleService = vehicleService;
            _cache = cache;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCondition(Guid vehicleId)
        {
            var effectiveCondition = await _rentalConditionService.GetEffectiveConditionAsync(vehicleId);
            if (effectiveCondition == null)
            {
                return NotFound(new { message = "Không tìm thấy xe." });
            }

            return Ok(effectiveCondition);
        }

        [HttpPost]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> CreateCondition(Guid vehicleId, [FromBody] CreateRentalConditionDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
            if (vehicle == null) return NotFound(new { message = "Không tìm thấy xe." });

            try
            {
                var result = await _rentalConditionService.CreateAsync(vehicleId, createDto);
                if (result == null) return NotFound(new { message = "Không tìm thấy xe." });
                await _cache.RemoveByTagAsync("vehicles");
                return CreatedAtAction(nameof(GetCondition), new { vehicleId = vehicleId }, result);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut]
        [Authorize(Policy = "Management")]
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

            await _cache.RemoveByTagAsync("vehicles");
            return Ok(result);
        }

        [HttpDelete]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> DeleteCondition(Guid vehicleId)
        {
            var vehicle = await _vehicleService.GetByIdAsync(vehicleId);
            if (vehicle == null) return NotFound(new { message = "Không tìm thấy xe." });

            var success = await _rentalConditionService.DeleteAsync(vehicleId);
            if (!success) return NotFound(new { message = "Chưa thiết lập điều kiện thuê cho xe này." });

            await _cache.RemoveByTagAsync("vehicles");
            return NoContent();
        }

        [HttpPost("/api/rental-conditions/bulk-apply")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> BulkApply([FromBody] BulkApplyRentalConditionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.VehicleIds == null || dto.VehicleIds.Count == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 xe để áp dụng." });
            }

            var updatedCount = await _rentalConditionService.BulkApplyAsync(dto);
            await _cache.RemoveByTagAsync("vehicles");

            return Ok(new
            {
                success = true,
                updatedCount,
                message = $"Đã áp dụng điều kiện thuê cho {updatedCount} xe thành công."
            });
        }
    }
}
