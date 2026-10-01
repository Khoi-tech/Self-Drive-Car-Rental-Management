using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Payment;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("deposit")]
        public async Task<IActionResult> CreateDepositPayment([FromBody] CreatePaymentDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var payment = await _paymentService.CreateDepositPaymentAsync(dto);
                return Ok(payment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi khi tạo thanh toán cọc.", Details = ex.Message });
            }
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var payment = await _paymentService.ConfirmPaymentAsync(dto.TransactionCode);
                return Ok(new { Message = "Xác nhận thanh toán tiền cọc thành công!", Data = payment });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi khi xác nhận thanh toán.", Details = ex.Message });
            }
        }

        [HttpGet("request/{requestId:guid}")]
        public async Task<IActionResult> GetPaymentByRequestId(Guid requestId)
        {
            var payment = await _paymentService.GetPaymentByRequestIdAsync(requestId);
            if (payment == null)
            {
                return NotFound(new { Message = "Chưa có thông tin thanh toán cho đơn thuê này." });
            }
            return Ok(payment);
        }
    }
}
