using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.RentalRequest;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/rental-requests")]
    public class RentalRequestsController : ControllerBase
    {
        private readonly IRentalRequestService _rentalRequestService;

        public RentalRequestsController(IRentalRequestService rentalRequestService)
        {
            _rentalRequestService = rentalRequestService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateRentalRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _rentalRequestService.CreateRequestAsync(dto);
                return CreatedAtAction(nameof(GetRequest), new { id = response.Id }, response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRequests([FromQuery] string? status)
        {
            var requests = await _rentalRequestService.GetAllAsync(status);
            return Ok(requests);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetRequest(Guid id)
        {
            var request = await _rentalRequestService.GetByIdAsync(id);
            if (request == null)
            {
                return NotFound(new { Message = "Không tìm thấy yêu cầu thuê xe" });
            }

            return Ok(request);
        }
    }
}
