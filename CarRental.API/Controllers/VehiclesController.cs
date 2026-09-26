using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Vehicle;
using CarRental.API.Services;
using CarRental.API.Entities;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehiclesController : ControllerBase
    {
        private readonly IVehicleService _vehicleService;

        public VehiclesController(IVehicleService vehicleService)
        {
            _vehicleService = vehicleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetVehicles([FromQuery] string? search, [FromQuery] VehicleStatus? status)
        {
            var vehicles = await _vehicleService.GetAllAsync(search, status);
            return Ok(vehicles);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchVehicles([FromQuery] CarRental.API.DTOs.Search.VehicleSearchQueryDto query)
        {
            var results = await _vehicleService.SearchAvailableVehiclesAsync(query);
            return Ok(results);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetVehicle(Guid id)
        {
            var vehicle = await _vehicleService.GetByIdAsync(id);
            if (vehicle == null) return NotFound();

            return Ok(vehicle);
        }

        [HttpPost]
        public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var createdVehicle = await _vehicleService.CreateAsync(createDto);
                return CreatedAtAction(nameof(GetVehicle), new { id = createdVehicle.Id }, createdVehicle);
            }
            catch (Exception ex)
            {
                // Simple error handling, could be expanded for duplicate license plate
                return BadRequest(new { Message = "Không thể tạo phương tiện", Details = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateVehicle(Guid id, [FromBody] UpdateVehicleDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedVehicle = await _vehicleService.UpdateAsync(id, updateDto);
            if (updatedVehicle == null) return NotFound();

            return Ok(updatedVehicle);
        }

        [HttpPatch("{id:guid}/status")]
        public async Task<IActionResult> UpdateVehicleStatus(Guid id, [FromBody] UpdateVehicleStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _vehicleService.UpdateStatusAsync(id, statusDto);
            if (!success) return NotFound();

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteVehicle(Guid id)
        {
            var success = await _vehicleService.DeleteAsync(id);
            if (!success) return NotFound();

            return NoContent();
        }
    }
}
