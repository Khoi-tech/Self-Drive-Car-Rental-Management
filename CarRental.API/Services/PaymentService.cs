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

        public PaymentService(AppDbContext context)
        {
            _context = context;
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

            // Check if there is an existing pending payment for this request
            var existingPayment = await _context.Payments
                .Where(p => p.RentalRequestId == dto.RentalRequestId && p.Status == "PENDING")
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingPayment != null)
            {
                return MapToDto(existingPayment, request);
            }

            // Create a new payment transaction
            string txnCode = $"TXN{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}";
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                RentalRequestId = request.Id,
                ContractId = contract?.Id ?? dto.ContractId,
                Amount = request.DepositAmount,
                Type = "DEPOSIT",
                Status = "PENDING",
                PaymentMethod = dto.PaymentMethod ?? "VIETQR",
                TransactionCode = txnCode,
                Note = $"Thanh toan tien coc xe {request.Vehicle?.Make} {request.Vehicle?.Model}",
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

            // 3. Update RentalRequest status to CONFIRMED
            if (payment.RentalRequest != null)
            {
                payment.RentalRequest.Status = "CONFIRMED";
                payment.RentalRequest.UpdatedAt = DateTime.UtcNow;

                // 4. Update Vehicle status to BOOKED
                if (payment.RentalRequest.Vehicle != null)
                {
                    payment.RentalRequest.Vehicle.Status = VehicleStatus.BOOKED;
                }
            }

            await _context.SaveChangesAsync();

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

        private PaymentResponseDto MapToDto(Payment payment, RentalRequest? request)
        {
            string shortCode = (request?.Id.ToString() ?? payment.Id.ToString())[..8].ToUpper();
            string transferContent = $"VELORA COC {shortCode}";
            long amountVnd = (long)payment.Amount;

            // VietQR Standard URL for MBBank
            string qrUrl = $"https://img.vietqr.io/image/MB-8888886688-compact2.png?amount={amountVnd}&addInfo={Uri.EscapeDataString(transferContent)}&accountName=VELORA%20CAR%20RENTAL";

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
                AccountNumber = "8888886688",
                BankName = "MBBank (Ngân hàng Quân Đội)",
                TransferContent = transferContent,
                QrCodeUrl = qrUrl
            };
        }
    }
}
