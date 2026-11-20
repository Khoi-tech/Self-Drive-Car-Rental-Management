using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CarRental.API.Data;
using CarRental.API.DTOs.Payment;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            IPaymentService paymentService,
            AppDbContext context,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<PaymentsController> logger)
        {
            _paymentService = paymentService;
            _context = context;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        /// <summary>
        /// Tạo giao dịch thanh toán cọc (Fast Hold hoặc Standard/Collateral)
        /// </summary>
        [HttpPost("deposit")]
        [Authorize]
        public async Task<IActionResult> CreateDepositPayment([FromBody] CreatePaymentDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(dto.RentalRequestId, _context))
                {
                    return Forbid();
                }
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
                _logger.LogError(ex, "Lỗi khi tạo thanh toán cọc.");
                return StatusCode(500, new { Message = "Đã xảy ra lỗi khi tạo thanh toán cọc.", Details = ex.Message });
            }
        }

        /// <summary>
        /// Endpoint xác nhận thanh toán thủ công / Sandbox Simulation.
        /// Trên môi trường Production, endpoint này bị khóa đối với người dùng thông thường và chỉ cho phép nhân viên vận hành (Operations).
        /// </summary>
        [HttpPost("confirm")]
        [HttpPost("confirm/{transactionCode}")]
        [Authorize]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentDto? bodyDto, [FromRoute] string? transactionCode)
        {
            var code = !string.IsNullOrWhiteSpace(transactionCode) ? transactionCode : bodyDto?.TransactionCode;
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { Message = "Mã giao dịch transactionCode là bắt buộc." });
            }

            // Nếu trên môi trường Production, chặn khách hàng tự xác nhận Sandbox (chỉ cho phép Operations xác nhận bù nếu cần)
            if (!_environment.IsDevelopment() && !User.IsOperations())
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    Message = "Chức năng mô phỏng thanh toán Sandbox bị khóa trên môi trường Production. Vui lòng thanh toán qua cổng VietQR chính thức."
                });
            }

            // Verify payment ownership for security against unauthorized confirmation
            if (!User.IsOperations())
            {
                var payment = await _context.Payments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TransactionCode == code);

                if (payment == null)
                {
                    return NotFound(new { Message = "Không tìm thấy giao dịch thanh toán." });
                }

                if (payment.RentalRequestId.HasValue && !await User.CanAccessRequestIdAsync(payment.RentalRequestId.Value, _context))
                {
                    return Forbid();
                }
            }

            try
            {
                var payment = await _paymentService.ConfirmPaymentAsync(code);
                return Ok(new { Message = "Xác nhận thanh toán tiền cọc thành công!", Data = payment });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xác nhận thanh toán.");
                return StatusCode(500, new { Message = "Đã xảy ra lỗi khi xác nhận thanh toán.", Details = ex.Message });
            }
        }

        /// <summary>
        /// Webhook chính thức nhận thông báo chuyển khoản tự động từ cổng VietQR (SePay / Casso / PayOS).
        /// Yêu cầu xác thực chữ ký HMAC-SHA256 và đảm bảo Idempotency.
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> HandleVietQrWebhook()
        {
            // 1. Đọc Raw Body từ HttpRequest Stream
            Request.EnableBuffering();
            string rawBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            if (string.IsNullOrWhiteSpace(rawBody))
            {
                return BadRequest(new { success = false, message = "Payload webhook không được để trống." });
            }

            // 2. Lấy Webhook Secret Key từ Biến môi trường (hoặc Configuration)
            string? secretKey = Environment.GetEnvironmentVariable("PAYMENT_WEBHOOK_SECRET")
                             ?? Environment.GetEnvironmentVariable("VIETQR_WEBHOOK_SECRET")
                             ?? _configuration["Payment:WebhookSecret"];

            // 3. Trích xuất chữ ký số từ Request Header hoặc body
            string? receivedSignature = Request.Headers["X-Signature"].ToString();
            if (string.IsNullOrWhiteSpace(receivedSignature))
            {
                receivedSignature = Request.Headers["x-sepay-signature"].ToString();
            }
            if (string.IsNullOrWhiteSpace(receivedSignature))
            {
                receivedSignature = Request.Headers["secure-token"].ToString(); // Chuẩn Casso
            }

            // 4. Xác thực chữ ký HMAC-SHA256 (Bảo mật bắt buộc cho Production)
            if (!string.IsNullOrWhiteSpace(secretKey))
            {
                bool isSignatureValid = VerifySignature(rawBody, receivedSignature, secretKey);
                if (!isSignatureValid)
                {
                    _logger.LogWarning("[VIETQR WEBHOOK] Xác thực chữ ký số HMAC-SHA256 thất bại. IP: {Ip}", HttpContext.Connection.RemoteIpAddress);
                    return Unauthorized(new { success = false, message = "Chữ ký số Webhook không hợp lệ." });
                }
            }
            else
            {
                if (_environment.IsDevelopment())
                {
                    _logger.LogWarning("[VIETQR WEBHOOK] Chưa cấu hình PAYMENT_WEBHOOK_SECRET trong biến môi trường. Cho phép qua vì đang ở môi trường Development.");
                }
                else
                {
                    _logger.LogError("[VIETQR WEBHOOK BẢO MẬT] PAYMENT_WEBHOOK_SECRET chưa được thiết lập trên máy chủ Production! Từ chối nhận webhook.");
                    return StatusCode(StatusCodes.Status500InternalServerError, new
                    {
                        success = false,
                        message = "Máy chủ chưa cấu hình khóa bảo mật Webhook Secret."
                    });
                }
            }

            // 5. Deserialize Payload
            VietQrWebhookDto? webhookDto;
            try
            {
                webhookDto = JsonSerializer.Deserialize<VietQrWebhookDto>(rawBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Lỗi phân tích JSON webhook: {Message}", ex.Message);
                return BadRequest(new { success = false, message = "Cấu trúc JSON không hợp lệ." });
            }

            if (webhookDto == null)
            {
                return BadRequest(new { success = false, message = "Dữ liệu webhook rỗng." });
            }

            // 6. Xử lý thanh toán và đảm bảo Idempotency
            try
            {
                var result = await _paymentService.ProcessWebhookPaymentAsync(webhookDto);
                _logger.LogInformation(
                    "[VIETQR WEBHOOK THÀNH CÔNG] Giao dịch {TxnCode} cho đơn {RequestId} đã được xác nhận (Số tiền: {Amount:N0}đ).",
                    result.TransactionCode,
                    result.RentalRequestId,
                    result.Amount);

                return Ok(new
                {
                    success = true,
                    message = "Xử lý thanh toán webhook thành công.",
                    data = result
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("[VIETQR WEBHOOK] Lỗi nghiệp vụ khi xử lý webhook: {Message}", ex.Message);
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[VIETQR WEBHOOK] Lỗi hệ thống khi xử lý webhook: {Message}", ex.Message);
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    success = false,
                    message = "Đã xảy ra lỗi nội bộ khi xử lý webhook.",
                    details = ex.Message
                });
            }
        }

        [HttpGet("request/{requestId:guid}")]
        [Authorize]
        public async Task<IActionResult> GetPaymentByRequestId(Guid requestId)
        {
            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(requestId, _context))
                {
                    return Forbid();
                }
            }

            var payment = await _paymentService.GetPaymentByRequestIdAsync(requestId);
            if (payment == null)
            {
                return NotFound(new { Message = "Chưa có thông tin thanh toán cho đơn thuê này." });
            }
            return Ok(payment);
        }

        [HttpGet("by-request/{requestId:guid}")]
        [HttpGet("all-by-request/{requestId:guid}")]
        [Authorize]
        public async Task<IActionResult> GetAllPaymentsByRequestId(Guid requestId)
        {
            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(requestId, _context))
                {
                    return Forbid();
                }
            }

            var payments = await _paymentService.GetAllPaymentsByRequestIdAsync(requestId);
            return Ok(payments);
        }

        private static bool VerifySignature(string rawBody, string? receivedSignature, string secretKey)
        {
            if (string.IsNullOrWhiteSpace(receivedSignature))
            {
                return false;
            }

            var cleanSig = receivedSignature.Trim();

            // Trường hợp token cố định (Casso secure-token)
            if (CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(cleanSig), Encoding.UTF8.GetBytes(secretKey)))
            {
                return true;
            }

            // Trường hợp HMAC-SHA256 (SePay / PayOS / Tiêu chuẩn)
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody));
            var hexLower = Convert.ToHexStringLower(hashBytes);
            var hexUpper = Convert.ToHexString(hashBytes);
            var base64 = Convert.ToBase64String(hashBytes);

            return CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(cleanSig.ToLowerInvariant()), Encoding.UTF8.GetBytes(hexLower))
                || CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(cleanSig), Encoding.UTF8.GetBytes(hexUpper))
                || CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(cleanSig), Encoding.UTF8.GetBytes(base64));
        }
    }
}
