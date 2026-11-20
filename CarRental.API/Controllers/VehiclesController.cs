using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Hybrid;
using CarRental.API.DTOs.Common;
using CarRental.API.DTOs.Vehicle;
using CarRental.API.Entities;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehiclesController : ControllerBase
    {
        private readonly IVehicleService _vehicleService;
        private readonly HybridCache _cache;

        public VehiclesController(IVehicleService vehicleService, HybridCache cache)
        {
            _vehicleService = vehicleService;
            _cache = cache;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetVehicles(
            [FromQuery] string? search,
            [FromQuery] VehicleStatus? status,
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null)
        {
            string cacheKey = $"vehicles_{search?.Trim().ToLowerInvariant()}_{status?.ToString() ?? "ALL"}";

            var allVehicles = await _cache.GetOrCreateAsync(
                cacheKey,
                async cancel => (await _vehicleService.GetAllAsync(search, status)).ToList(),
                tags: new[] { "vehicles" });

            int totalCount = allVehicles.Count;

            // Nếu truyền page hoặc pageSize -> Phân trang theo tham số
            int p = Math.Max(1, page ?? 1);
            int ps = pageSize.HasValue ? Math.Clamp(pageSize.Value, 1, 100) : (page.HasValue ? 20 : totalCount);
            var pagedItems = allVehicles.Skip((p - 1) * ps).Take(ps).ToList();

            return Ok(new PagedResultDto<VehicleResponseDto>(pagedItems, totalCount, p, ps));
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchVehicles([FromQuery] CarRental.API.DTOs.Search.VehicleSearchQueryDto query)
        {
            var results = await _vehicleService.SearchAvailableVehiclesAsync(query);
            return Ok(results);
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetVehicle(Guid id)
        {
            var vehicle = await _vehicleService.GetByIdAsync(id);
            if (vehicle == null) return NotFound();

            return Ok(vehicle);
        }

        [HttpPost]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var createdVehicle = await _vehicleService.CreateAsync(createDto);
                await _cache.RemoveByTagAsync("vehicles");
                return CreatedAtAction(nameof(GetVehicle), new { id = createdVehicle.Id }, createdVehicle);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Không thể tạo phương tiện", Details = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> UpdateVehicle(Guid id, [FromBody] UpdateVehicleDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedVehicle = await _vehicleService.UpdateAsync(id, updateDto);
            if (updatedVehicle == null) return NotFound();

            await _cache.RemoveByTagAsync("vehicles");
            return Ok(updatedVehicle);
        }

        [HttpPatch("{id:guid}/status")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> UpdateVehicleStatus(Guid id, [FromBody] UpdateVehicleStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _vehicleService.UpdateStatusAsync(id, statusDto);
            if (!success) return NotFound();

            await _cache.RemoveByTagAsync("vehicles");
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteVehicle(Guid id)
        {
            var success = await _vehicleService.DeleteAsync(id);
            if (!success) return NotFound();

            await _cache.RemoveByTagAsync("vehicles");
            return NoContent();
        }
    }
}
