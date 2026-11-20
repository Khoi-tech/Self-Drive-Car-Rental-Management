using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Payment;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ISystemSettingsService _settingsService;

        public PaymentService(
            AppDbContext context,
            INotificationService notificationService,
            ISystemSettingsService settingsService)
        {
            _context = context;
            _notificationService = notificationService;
            _settingsService = settingsService;
        }

        public async Task<PaymentResponseDto> CreateDepositPaymentAsync(CreatePaymentDto dto)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
            {
                throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
            }

            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == dto.RentalRequestId);

            bool isCollateral = string.Equals(dto.PaymentCategory, "COLLATERAL", StringComparison.OrdinalIgnoreCase) ||
                                dto.Note?.Contains("COLLATERAL", StringComparison.OrdinalIgnoreCase) == true;

            string targetType = isCollateral ? "COLLATERAL" : "DEPOSIT";

            // Check if there is an existing pending payment for this request and target type
            var existingPayment = await _context.Payments
                .Where(p => p.RentalRequestId == dto.RentalRequestId && p.Type == targetType && p.Status == "PENDING")
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingPayment != null)
            {
                return MapToDto(existingPayment, request);
            }

            // Determine deposit amount based on BookingType and PaymentCategory
            decimal chargeAmount = request.DepositAmount;
            string paymentNote = $"Thanh toan tien coc xe {request.Vehicle?.Make} {request.Vehicle?.Model}";

            if (isCollateral)
            {
                // Remaining security deposit after subtracting 500k Fast Hold deposit
                chargeAmount = Math.Max(0, request.DepositAmount - request.HoldDepositAmount);
                if (chargeAmount <= 0) chargeAmount = Math.Max(0, (request.Vehicle?.DepositAmount ?? 20000000m) - 500000m);
                paymentNote = $"Coc the chan xe {request.Vehicle?.Make} {request.Vehicle?.Model} (Da tru 500k giu cho)";
            }
            else if (string.Equals(request.BookingType, "FAST_HOLD", StringComparison.OrdinalIgnoreCase) || request.HoldDepositAmount > 0)
            {
                chargeAmount = request.HoldDepositAmount > 0 ? request.HoldDepositAmount : 500000m;
                paymentNote = $"Coc giu xe Fast Hold 500k {request.Vehicle?.Make} {request.Vehicle?.Model}";
            }

            // Create a new payment transaction
            string txnCode = $"TXN{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}";
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                RentalRequestId = request.Id,
                ContractId = contract?.Id ?? dto.ContractId,
                Amount = chargeAmount,
                Type = targetType,
                Status = "PENDING",
                PaymentMethod = dto.PaymentMethod ?? "VIETQR",
                TransactionCode = txnCode,
                Note = paymentNote,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return MapToDto(payment, request);
        }

        public async Task<PaymentResponseDto> ConfirmPaymentAsync(string transactionCode)
        {
            var payment = await _context.Payments
                .Include(p => p.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .Include(p => p.RentalContract)
                .FirstOrDefaultAsync(p => p.TransactionCode == transactionCode);

            if (payment == null)
            {
                throw new InvalidOperationException("Không tìm thấy giao dịch thanh toán.");
            }

            if (payment.Status == "SUCCESS")
            {
                return MapToDto(payment, payment.RentalRequest);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            // 1. Mark payment as SUCCESS
            payment.Status = "SUCCESS";
            payment.PaidAt = DateTime.UtcNow;

            // 2. Update Contract status to DEPOSIT_PAID
            if (payment.RentalContract != null)
            {
                payment.RentalContract.Status = "DEPOSIT_PAID";
                payment.RentalContract.UpdatedAt = DateTime.UtcNow;
            }
            else if (payment.RentalRequestId.HasValue)
            {
                var contract = await _context.RentalContracts
                    .FirstOrDefaultAsync(c => c.RequestId == payment.RentalRequestId.Value);
                if (contract != null)
                {
                    contract.Status = "DEPOSIT_PAID";
                    contract.UpdatedAt = DateTime.UtcNow;
                }
            }

            var defaultHoldDeposit = await _settingsService.GetSettingValueAsync("fast_hold_deposit_amount", 500000m);
            var defaultExpiryHours = await _settingsService.GetSettingValueAsync("fast_hold_expiry_hours", 4);

            // 3. Update RentalRequest status to CONFIRMED and handle Security Deposit flags
            if (payment.RentalRequest != null)
            {
                if (payment.Type == "COLLATERAL")
                {
                    payment.RentalRequest.IsSecurityDepositPaid = true;
                    payment.RentalRequest.Status = "CONFIRMED";
                }
                else if (string.Equals(payment.RentalRequest.BookingType, "FAST_HOLD", StringComparison.OrdinalIgnoreCase) || payment.Amount == defaultHoldDeposit)
                {
                    payment.RentalRequest.HoldDepositAmount = defaultHoldDeposit;
                    payment.RentalRequest.HoldExpiresAt = (payment.PaidAt ?? DateTime.UtcNow).AddHours(defaultExpiryHours);
                    // Fast Hold 500k deposit paid; full security deposit remains to be paid within expiry hours
                    payment.RentalRequest.IsSecurityDepositPaid = false;
                    payment.RentalRequest.Status = "CONFIRMED";
                }
                else
                {
                    payment.RentalRequest.IsSecurityDepositPaid = true;
                    payment.RentalRequest.Status = "CONFIRMED";
                }

                payment.RentalRequest.UpdatedAt = DateTime.UtcNow;

                // 4. Update Vehicle status to BOOKED
                if (payment.RentalRequest.Vehicle != null)
                {
                    payment.RentalRequest.Vehicle.Status = VehicleStatus.BOOKED;
                    payment.RentalRequest.Vehicle.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Real-time notification for customer
            try
            {
                if (payment.RentalRequest != null && !string.IsNullOrWhiteSpace(payment.RentalRequest.CustomerEmail))
                {
                    var user = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Email.ToLower() == payment.RentalRequest.CustomerEmail.ToLower());
                    if (user != null)
                    {
                        await _notificationService.CreateNotificationAsync(
                            user.Id,
                            "Xác nhận thanh toán thành công",
                            $"Giao dịch {payment.Amount:N0} VNĐ qua VietQR đã được xác nhận (Mã GD: {payment.TransactionCode}). Đơn thuê đã sẵn sàng.",
                            "PAYMENT",
                            payment.TransactionCode,
                            "/profile?tab=payments"
                        );
                    }
                }
            }
            catch { }

            return MapToDto(payment, payment.RentalRequest);
        }

        public async Task<PaymentResponseDto> ProcessWebhookPaymentAsync(VietQrWebhookDto webhookDto)
        {
            var content = webhookDto.GetTransferContent();
            var refCode = webhookDto.GetReferenceCode();
            var amount = webhookDto.GetActualAmount();

            Payment? payment = null;

            // 1. Tìm trực tiếp theo TransactionCode hoặc ReferenceCode nếu có
            if (!string.IsNullOrWhiteSpace(refCode))
            {
                payment = await _context.Payments
                    .Include(p => p.RentalRequest)
                        .ThenInclude(r => r!.Vehicle)
                    .Include(p => p.RentalContract)
                    .FirstOrDefaultAsync(p => p.TransactionCode == refCode);
            }

            // 2. Tìm mã giao dịch TXN trong nội dung chuyển khoản
            if (payment == null && !string.IsNullOrWhiteSpace(content))
            {
                var txnMatch = System.Text.RegularExpressions.Regex.Match(content, @"TXN\d+", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (txnMatch.Success)
                {
                    var code = txnMatch.Value;
                    payment = await _context.Payments
                        .Include(p => p.RentalRequest)
                            .ThenInclude(r => r!.Vehicle)
                        .Include(p => p.RentalContract)
                        .FirstOrDefaultAsync(p => p.TransactionCode == code);
                }
            }

            // 3. Tìm mã ngắn 8 ký tự theo quy ước "VELORA COC {shortCode}"
            if (payment == null && !string.IsNullOrWhiteSpace(content))
            {
                var shortMatch = System.Text.RegularExpressions.Regex.Match(content, @"(?:VELORA\s+)?(?:COC\s+)?([A-Za-z0-9]{8})", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (shortMatch.Success)
                {
                    var prefix = shortMatch.Groups[1].Value.ToLower();

                    // Tìm đơn thuê có ID bắt đầu bằng 8 ký tự này
                    var request = await _context.RentalRequests
                        .Include(r => r.Vehicle)
                        .FirstOrDefaultAsync(r => r.Id.ToString().ToLower().StartsWith(prefix));

                    if (request != null)
                    {
                        // Ưu tiên thanh toán PENDING của đơn này
                        payment = await _context.Payments
                            .Include(p => p.RentalRequest)
                                .ThenInclude(r => r!.Vehicle)
                            .Include(p => p.RentalContract)
                            .Where(p => p.RentalRequestId == request.Id)
                            .OrderByDescending(p => p.Status == "PENDING")
                            .ThenByDescending(p => p.CreatedAt)
                            .FirstOrDefaultAsync();
                    }
                    else
                    {
                        // Hoặc tìm Payment có ID bắt đầu bằng 8 ký tự này
                        payment = await _context.Payments
                            .Include(p => p.RentalRequest)
                                .ThenInclude(r => r!.Vehicle)
                            .Include(p => p.RentalContract)
                            .FirstOrDefaultAsync(p => p.Id.ToString().ToLower().StartsWith(prefix));
                    }
                }
            }

            // 4. Tìm UUID đầy đủ trong content
            if (payment == null && !string.IsNullOrWhiteSpace(content))
            {
                var guidMatch = System.Text.RegularExpressions.Regex.Match(content, @"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
                if (guidMatch.Success && Guid.TryParse(guidMatch.Value, out var parsedGuid))
                {
                    payment = await _context.Payments
                        .Include(p => p.RentalRequest)
                            .ThenInclude(r => r!.Vehicle)
                        .Include(p => p.RentalContract)
                        .Where(p => p.RentalRequestId == parsedGuid || p.Id == parsedGuid)
                        .OrderByDescending(p => p.Status == "PENDING")
                        .ThenByDescending(p => p.CreatedAt)
                        .FirstOrDefaultAsync();
                }
            }

            if (payment == null)
            {
                throw new InvalidOperationException($"Không tìm thấy giao dịch hợp lệ tương ứng với nội dung '{content}' hoặc mã '{refCode}'.");
            }

            // IDEMPOTENCY: Nếu đã SUCCESS rồi thì trả về kết quả đã xử lý ngay lập tức
            if (payment.Status == "SUCCESS")
            {
                return MapToDto(payment, payment.RentalRequest);
            }

            // Bọc Transaction an toàn cho nghiệp vụ đa bảng
            using var tx = await _context.Database.BeginTransactionAsync();

            payment.Status = "SUCCESS";
            payment.PaidAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(refCode) && payment.Note?.Contains(refCode) != true)
            {
                payment.Note = string.IsNullOrWhiteSpace(payment.Note)
                    ? $"Xác nhận tự động qua VietQR Webhook (Mã đối soát: {refCode})"
                    : $"{payment.Note} [Webhook Ref: {refCode}]";
            }

            if (payment.RentalContract != null)
            {
                payment.RentalContract.Status = "DEPOSIT_PAID";
                payment.RentalContract.UpdatedAt = DateTime.UtcNow;
            }
            else if (payment.RentalRequestId.HasValue)
            {
                var contract = await _context.RentalContracts.FirstOrDefaultAsync(c => c.RequestId == payment.RentalRequestId.Value);
                if (contract != null)
                {
                    contract.Status = "DEPOSIT_PAID";
                    contract.UpdatedAt = DateTime.UtcNow;
                }
            }

            if (payment.RentalRequest != null)
            {
                if (payment.Type == "COLLATERAL")
                {
                    payment.RentalRequest.IsSecurityDepositPaid = true;
                    payment.RentalRequest.Status = "CONFIRMED";
                }
                else if (string.Equals(payment.RentalRequest.BookingType, "FAST_HOLD", StringComparison.OrdinalIgnoreCase) || payment.Amount == 500000m)
                {
                    payment.RentalRequest.HoldDepositAmount = 500000m;
                    payment.RentalRequest.HoldExpiresAt = (payment.PaidAt ?? DateTime.UtcNow).AddHours(4);
                    payment.RentalRequest.IsSecurityDepositPaid = false;
                    payment.RentalRequest.Status = "CONFIRMED";
                }
                else
                {
                    payment.RentalRequest.IsSecurityDepositPaid = true;
                    payment.RentalRequest.Status = "CONFIRMED";
                }

                payment.RentalRequest.UpdatedAt = DateTime.UtcNow;

                if (payment.RentalRequest.Vehicle != null)
                {
                    payment.RentalRequest.Vehicle.Status = VehicleStatus.BOOKED;
                    payment.RentalRequest.Vehicle.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return MapToDto(payment, payment.RentalRequest);
        }

        public async Task<PaymentResponseDto?> GetPaymentByRequestIdAsync(Guid requestId)
        {
            var payment = await _context.Payments
                .Include(p => p.RentalRequest)
                .Where(p => p.RentalRequestId == requestId)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (payment == null) return null;

            return MapToDto(payment, payment.RentalRequest);
        }

        public async Task<System.Collections.Generic.IEnumerable<PaymentResponseDto>> GetAllPaymentsByRequestIdAsync(Guid requestId)
        {
            var payments = await _context.Payments
                .Include(p => p.RentalRequest)
                .Where(p => p.RentalRequestId == requestId)
                .OrderBy(p => p.CreatedAt)
                .ToListAsync();

            return payments.Select(p => MapToDto(p, p.RentalRequest));
        }

        private PaymentResponseDto MapToDto(Payment payment, RentalRequest? request)
        {
            string shortCode = (request?.Id.ToString() ?? payment.Id.ToString())[..8].ToUpper();
            string transferContent = $"VELORA COC {shortCode}";
            long amountVnd = (long)payment.Amount;

            // VietQR Standard URL for MBBank
            string qrUrl = $"https://img.vietqr.io/image/MB-21011501030206-compact2.png?amount={amountVnd}&addInfo={Uri.EscapeDataString(transferContent)}&accountName=VELORA%20CAR%20RENTAL";

            return new PaymentResponseDto
            {
                Id = payment.Id,
                ContractId = payment.ContractId,
                RentalRequestId = payment.RentalRequestId,
                Amount = payment.Amount,
                PaymentType = payment.Type,
                PaymentMethod = payment.PaymentMethod,
                TransactionCode = payment.TransactionCode ?? string.Empty,
                Status = payment.Status,
                PaidAt = payment.PaidAt,
                Note = payment.Note,
                CreatedAt = payment.CreatedAt ?? DateTime.UtcNow,

                AccountName = "VELORA CAR RENTAL CORP",
                AccountNumber = "21011501030206",
                BankName = "MBBank (Ngân hàng Quân Đội)",
                TransferContent = transferContent,
                QrCodeUrl = qrUrl
            };
        }
    }
}
