using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Settlement;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class SettlementService : ISettlementService
    {
        private readonly AppDbContext _context;

        public SettlementService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PreviewSettlementDto> PreviewSettlementAsync(Guid requestId)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin đơn thuê xe.");
            }

            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == requestId);

            var returnProtocol = await _context.ReturnProtocols
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(p => p.RentalRequestId == requestId);

            if (returnProtocol == null)
            {
                throw new InvalidOperationException("Chưa có biên bản hoàn trả xe. Vui lòng lập biên bản kiểm tra trả xe (US-22) trước khi quyết toán.");
            }

            // 1. Phí km vượt
            decimal extraKmRate = request.Vehicle?.ExtraKmRate ?? 5000m;
            decimal extraKmFee = returnProtocol.ExcessKm * extraKmRate;

            // 2. Phí trễ hạn
            decimal lateHours = 0;
            decimal lateReturnFee = 0;
            if (returnProtocol.ReturnDate > request.EndTime)
            {
                var diff = returnProtocol.ReturnDate - request.EndTime;
                lateHours = (decimal)Math.Round(diff.TotalHours, 1);
                if (lateHours > 1.0m) // Miễn phí trễ dưới 1 giờ
                {
                    // Đơn giá trễ: 100,000 VND / giờ
                    lateReturnFee = Math.Round(lateHours * 100000m, 0);
                }
            }

            // 3. Phí chênh lệch nhiên liệu (6,000 VND mỗi 1% chênh lệch, tương đương 150,000 VND / 25%)
            decimal fuelFee = 0;
            if (returnProtocol.FuelDifference > 0)
            {
                fuelFee = returnProtocol.FuelDifference * 6000m;
            }

            // 4. Chi phí hư hỏng từ sự cố chưa thanh toán hoặc hư hỏng mới ghi nhận
            decimal damageFee = 0;
            string? damageNotes = returnProtocol.NewDamagesNotes;

            var incidents = await _context.IncidentReports
                .Where(i => i.RentalRequestId == requestId && i.CustomerPayAmount > 0)
                .ToListAsync();

            if (incidents.Any())
            {
                damageFee += incidents.Sum(i => i.CustomerPayAmount);
                var incSummary = string.Join(", ", incidents.Select(i => $"{i.IncidentCode}: {i.CustomerPayAmount:N0}đ"));
                damageNotes = string.IsNullOrWhiteSpace(damageNotes)
                    ? $"Bồi thường sự cố: {incSummary}"
                    : $"{damageNotes}; Bồi thường sự cố: {incSummary}";
            }

            decimal depositAmount = contract?.DepositAmount ?? request.DepositAmount;
            decimal rentalFee = contract?.TotalFee ?? request.EstimatedTotalFee;

            decimal totalDeduction = extraKmFee + lateReturnFee + fuelFee + damageFee;
            decimal balance = depositAmount - totalDeduction;

            string settlementType = "REFUND_TO_CUSTOMER";
            decimal refundAmount = 0;
            decimal additionalDue = 0;

            if (balance >= 0)
            {
                settlementType = "REFUND_TO_CUSTOMER";
                refundAmount = balance;
                additionalDue = 0;
            }
            else
            {
                settlementType = "ADDITIONAL_PAYMENT_REQUIRED";
                refundAmount = 0;
                additionalDue = Math.Abs(balance);
            }

            return new PreviewSettlementDto
            {
                RentalRequestId = requestId,
                ContractId = contract?.Id,
                ReturnProtocolId = returnProtocol.Id,
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                CarName = $"{request.Vehicle?.Make} {request.Vehicle?.Model}",
                LicensePlate = request.Vehicle?.LicensePlate ?? string.Empty,
                RentalFee = rentalFee,
                DepositAmount = depositAmount,
                StartOdo = returnProtocol.StartOdo,
                EndOdo = returnProtocol.EndOdo,
                TotalKmDriven = returnProtocol.TotalKmDriven,
                MaxKmAllowed = returnProtocol.MaxKmAllowed,
                ExcessKm = returnProtocol.ExcessKm,
                ExtraKmRate = extraKmRate,
                ExtraKmFee = extraKmFee,
                ScheduledEndTime = request.EndTime,
                ActualReturnTime = returnProtocol.ReturnDate,
                LateHours = lateHours,
                LateReturnFee = lateReturnFee,
                InitialFuelLevel = returnProtocol.InitialFuelLevel,
                ReturnFuelLevel = returnProtocol.ReturnFuelLevel,
                FuelDifference = returnProtocol.FuelDifference,
                FuelFee = fuelFee,
                DamageFee = damageFee,
                DamageNotes = damageNotes,
                CleaningFee = 0,
                OtherFee = 0,
                TotalDeduction = totalDeduction,
                BalanceAmount = balance,
                SettlementType = settlementType,
                RefundAmount = refundAmount,
                AdditionalAmountDue = additionalDue
            };
        }

        public async Task<SettlementResponseDto> CreateSettlementAsync(CreateSettlementDto dto, Guid? staffId, string staffName)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin đơn thuê xe.");
            }

            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == dto.RentalRequestId);

            var returnProtocol = await _context.ReturnProtocols
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(p => p.RentalRequestId == dto.RentalRequestId);

            // Kiểm tra xem đã quyết toán chưa
            var existingSettlement = await _context.RentalSettlements
                .FirstOrDefaultAsync(s => s.RentalRequestId == dto.RentalRequestId);

            decimal totalDeduction = dto.ExtraKmFee + dto.LateReturnFee + dto.FuelFee + dto.DamageFee + dto.CleaningFee + dto.OtherFee;
            decimal balance = dto.DepositAmount - totalDeduction;

            string settlementType;
            decimal refundAmount = 0;
            decimal additionalDue = 0;
            string refundStatus = "PENDING";

            if (balance > 0)
            {
                settlementType = "REFUND_TO_CUSTOMER";
                refundAmount = balance;
                additionalDue = 0;
                refundStatus = "PENDING";
            }
            else if (balance < 0)
            {
                settlementType = "ADDITIONAL_PAYMENT_REQUIRED";
                refundAmount = 0;
                additionalDue = Math.Abs(balance);
                refundStatus = "NOT_APPLICABLE";
            }
            else
            {
                settlementType = "EVEN";
                refundAmount = 0;
                additionalDue = 0;
                refundStatus = "NOT_APPLICABLE";
            }

            RentalSettlement settlement;
            if (existingSettlement != null)
            {
                settlement = existingSettlement;
                settlement.RentalFee = dto.RentalFee;
                settlement.DepositAmount = dto.DepositAmount;
                settlement.ExtraKmFee = dto.ExtraKmFee;
                settlement.LateHours = dto.LateHours;
                settlement.LateReturnFee = dto.LateReturnFee;
                settlement.FuelFee = dto.FuelFee;
                settlement.DamageFee = dto.DamageFee;
                settlement.CleaningFee = dto.CleaningFee;
                settlement.OtherFee = dto.OtherFee;
                settlement.OtherFeeNotes = dto.OtherFeeNotes;
                settlement.TotalDeduction = totalDeduction;
                settlement.BalanceAmount = balance;
                settlement.SettlementType = settlementType;
                settlement.RefundAmount = refundAmount;
                settlement.AdditionalAmountDue = additionalDue;
                settlement.RefundStatus = refundStatus;
                settlement.RefundBankName = dto.RefundBankName;
                settlement.RefundAccountNumber = dto.RefundAccountNumber;
                settlement.RefundAccountName = dto.RefundAccountName;
                settlement.StaffNotes = dto.StaffNotes;
                settlement.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                string settlementNumber = $"QT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
                settlement = new RentalSettlement
                {
                    Id = Guid.NewGuid(),
                    SettlementNumber = settlementNumber,
                    RentalRequestId = dto.RentalRequestId,
                    ContractId = contract?.Id ?? dto.ContractId,
                    ReturnProtocolId = returnProtocol?.Id ?? dto.ReturnProtocolId,
                    RentalFee = dto.RentalFee,
                    DepositAmount = dto.DepositAmount,
                    ExtraKmFee = dto.ExtraKmFee,
                    LateHours = dto.LateHours,
                    LateReturnFee = dto.LateReturnFee,
                    FuelFee = dto.FuelFee,
                    DamageFee = dto.DamageFee,
                    CleaningFee = dto.CleaningFee,
                    OtherFee = dto.OtherFee,
                    OtherFeeNotes = dto.OtherFeeNotes,
                    TotalDeduction = totalDeduction,
                    BalanceAmount = balance,
                    SettlementType = settlementType,
                    RefundAmount = refundAmount,
                    AdditionalAmountDue = additionalDue,
                    RefundStatus = refundStatus,
                    RefundMethod = "VIETQR",
                    RefundBankName = dto.RefundBankName,
                    RefundAccountNumber = dto.RefundAccountNumber,
                    RefundAccountName = dto.RefundAccountName,
                    StaffNotes = dto.StaffNotes,
                    Status = refundStatus == "NOT_APPLICABLE" ? "SETTLED" : "PENDING",
                    SettledAt = refundStatus == "NOT_APPLICABLE" ? DateTime.UtcNow : null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.RentalSettlements.Add(settlement);
            }

            // Hoàn tất đơn thuê và hợp đồng
            request.Status = "COMPLETED";
            request.UpdatedAt = DateTime.UtcNow;

            if (contract != null)
            {
                contract.Status = "COMPLETED";
                contract.UpdatedAt = DateTime.UtcNow;
            }

            // Cập nhật trạng thái xe sau trả xe
            if (request.Vehicle != null)
            {
                string nextStatus = returnProtocol?.NextVehicleStatus ?? "READY";
                if (nextStatus == "REPAIR")
                {
                    request.Vehicle.Status = VehicleStatus.REPAIR;
                }
                else if (nextStatus == "MAINTENANCE")
                {
                    request.Vehicle.Status = VehicleStatus.MAINTENANCE;
                }
                else
                {
                    request.Vehicle.Status = VehicleStatus.READY;
                }
                request.Vehicle.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            settlement.RentalRequest = request;
            return MapToDto(settlement);
        }

        public async Task<SettlementResponseDto?> GetByIdAsync(Guid id)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(s => s.Id == id);

            return settlement != null ? MapToDto(settlement) : null;
        }

        public async Task<SettlementResponseDto?> GetByRequestIdAsync(Guid requestId)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync(s => s.RentalRequestId == requestId);

            return settlement != null ? MapToDto(settlement) : null;
        }

        public async Task<IEnumerable<SettlementResponseDto>> GetAllAsync()
        {
            var settlements = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return settlements.Select(MapToDto);
        }

        public async Task<SettlementResponseDto> ConfirmRefundAsync(Guid id, ConfirmRefundDto dto)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (settlement == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin phiếu quyết toán.");
            }

            settlement.RefundStatus = "REFUNDED";
            settlement.RefundTransactionCode = dto.RefundTransactionCode;
            settlement.RefundProofUrl = dto.RefundProofUrl;
            settlement.RefundMethod = dto.RefundMethod ?? "VIETQR";
            if (!string.IsNullOrWhiteSpace(dto.RefundBankName)) settlement.RefundBankName = dto.RefundBankName;
            if (!string.IsNullOrWhiteSpace(dto.RefundAccountNumber)) settlement.RefundAccountNumber = dto.RefundAccountNumber;
            if (!string.IsNullOrWhiteSpace(dto.RefundAccountName)) settlement.RefundAccountName = dto.RefundAccountName;
            settlement.RefundedAt = DateTime.UtcNow;
            settlement.Status = "SETTLED";
            settlement.SettledAt = DateTime.UtcNow;
            settlement.UpdatedAt = DateTime.UtcNow;

            // Lưu lịch sử thanh toán hoàn cọc (Payment record)
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                ContractId = settlement.ContractId,
                RentalRequestId = settlement.RentalRequestId,
                Amount = settlement.RefundAmount,
                Type = "REFUND",
                Status = "SUCCESS",
                PaymentMethod = settlement.RefundMethod,
                TransactionCode = dto.RefundTransactionCode,
                PaidAt = DateTime.UtcNow,
                Note = $"Hoàn tiền cọc quyết toán hợp đồng {settlement.SettlementNumber}",
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();
            return MapToDto(settlement);
        }

        public async Task<SettlementResponseDto> ConfirmAdditionalPaymentAsync(Guid id, ConfirmAdditionalPaymentDto dto)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (settlement == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin phiếu quyết toán.");
            }

            settlement.Status = "SETTLED";
            settlement.SettledAt = DateTime.UtcNow;
            settlement.UpdatedAt = DateTime.UtcNow;

            // Lưu lịch sử thanh toán bổ sung (Payment record)
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                ContractId = settlement.ContractId,
                RentalRequestId = settlement.RentalRequestId,
                Amount = settlement.AdditionalAmountDue,
                Type = "SETTLEMENT",
                Status = "SUCCESS",
                PaymentMethod = dto.PaymentMethod,
                TransactionCode = dto.TransactionCode,
                PaidAt = DateTime.UtcNow,
                Note = $"Thanh toán phụ phí quyết toán vượt cọc {settlement.SettlementNumber}",
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();
            return MapToDto(settlement);
        }

        private static SettlementResponseDto MapToDto(RentalSettlement entity)
        {
            var vehicle = entity.RentalRequest?.Vehicle;
            return new SettlementResponseDto
            {
                Id = entity.Id,
                SettlementNumber = entity.SettlementNumber,
                RentalRequestId = entity.RentalRequestId,
                ContractId = entity.ContractId,
                ReturnProtocolId = entity.ReturnProtocolId,
                CustomerName = entity.RentalRequest?.CustomerName,
                CustomerPhone = entity.RentalRequest?.CustomerPhone,
                CarMake = vehicle?.Make,
                CarModel = vehicle?.Model,
                LicensePlate = vehicle?.LicensePlate,
                RentalFee = entity.RentalFee,
                DepositAmount = entity.DepositAmount,
                ExtraKmFee = entity.ExtraKmFee,
                LateHours = entity.LateHours,
                LateReturnFee = entity.LateReturnFee,
                FuelFee = entity.FuelFee,
                DamageFee = entity.DamageFee,
                CleaningFee = entity.CleaningFee,
                OtherFee = entity.OtherFee,
                OtherFeeNotes = entity.OtherFeeNotes,
                TotalDeduction = entity.TotalDeduction,
                BalanceAmount = entity.BalanceAmount,
                SettlementType = entity.SettlementType,
                RefundAmount = entity.RefundAmount,
                AdditionalAmountDue = entity.AdditionalAmountDue,
                RefundStatus = entity.RefundStatus,
                RefundMethod = entity.RefundMethod,
                RefundBankName = entity.RefundBankName,
                RefundAccountNumber = entity.RefundAccountNumber,
                RefundAccountName = entity.RefundAccountName,
                RefundTransactionCode = entity.RefundTransactionCode,
                RefundProofUrl = entity.RefundProofUrl,
                RefundedAt = entity.RefundedAt,
                StaffNotes = entity.StaffNotes,
                Status = entity.Status,
                SettledAt = entity.SettledAt,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
