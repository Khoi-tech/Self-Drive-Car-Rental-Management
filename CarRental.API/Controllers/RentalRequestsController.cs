using System;
using System.Linq;
using System.Security.Claims;
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
        public async Task<IActionResult> GetAllRequests([FromQuery] string? status, [FromQuery] string? customerEmail, [FromQuery] string? customerPhone)
        {
            if (!string.IsNullOrWhiteSpace(customerEmail) || !string.IsNullOrWhiteSpace(customerPhone))
            {
                var list = await _rentalRequestService.GetByCustomerAsync(customerEmail, customerPhone);
                if (!string.IsNullOrWhiteSpace(status))
                {
                    list = list.Where(r => r.Status == status).ToList();
                }
                return Ok(list);
            }

            var requests = await _rentalRequestService.GetAllAsync(status);
            return Ok(requests);
        }

        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests([FromQuery] string? email, [FromQuery] string? phone)
        {
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
                            ?? User.FindFirst("email")?.Value
                            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value;

            var targetEmail = !string.IsNullOrWhiteSpace(email) ? email : userEmail;

            if (string.IsNullOrWhiteSpace(targetEmail) && string.IsNullOrWhiteSpace(phone))
            {
                return BadRequest(new { Message = "Vui lòng cung cấp email hoặc số điện thoại để tra cứu đơn thuê." });
            }

            var requests = await _rentalRequestService.GetByCustomerAsync(targetEmail, phone);
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

        [HttpPut("{id:guid}/approve")]
        public async Task<IActionResult> ApproveRequest(Guid id)
        {
            try
            {
                var result = await _rentalRequestService.ApproveRequestAsync(id);
                return Ok(new { Message = "Phê duyệt yêu cầu thành công", Data = result });
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

        [HttpPut("{id:guid}/reject")]
        public async Task<IActionResult> RejectRequest(Guid id, [FromBody] RejectRentalRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _rentalRequestService.RejectRequestAsync(id, dto.Reason);
                return Ok(new { Message = "Từ chối yêu cầu thuê xe thành công", Data = result });
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
    }
}
