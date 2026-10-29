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
                if (lateHours >= 5.0m)
                {
                    // Trễ từ 5 giờ trở lên tính tròn 1 ngày thuê xe (hoặc số ngày trễ tương ứng)
                    int lateDays = (int)Math.Ceiling(lateHours / 24m);
                    lateReturnFee = lateDays * (request.DailyRate > 0 ? request.DailyRate : 1000000m);
                }
                else if (lateHours >= 1.0m)
                {
                    // Trễ 1 - 5 giờ: 100,000 VND / giờ
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

            // Kế thừa phí hư hỏng từ các điểm đỏ mới (NEW) trên sơ đồ xe 2D
            if (!string.IsNullOrWhiteSpace(returnProtocol.DamagePointsJson))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(returnProtocol.DamagePointsJson);
                    foreach (var element in doc.RootElement.EnumerateArray())
                    {
                        if (element.TryGetProperty("type", out var typeProp) && typeProp.GetString() == "NEW")
                        {
                            if (element.TryGetProperty("fee", out var feeProp) && feeProp.TryGetDecimal(out var feeVal))
                            {
                                damageFee += feeVal;
                            }
                        }
                    }
                }
                catch { /* Ignore invalid JSON */ }
            }

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

            // 5. Phí vệ sinh nếu xe cần rửa / dọn nội thất
            decimal cleaningFee = 0;
            if (returnProtocol.NextVehicleStatus == "CLEANING")
            {
                cleaningFee = 200000m; // 200,000đ dọn vệ sinh khoang xe
            }

            decimal depositAmount = contract?.DepositAmount ?? request.DepositAmount;
            decimal rentalFee = contract?.TotalFee ?? request.EstimatedTotalFee;

            decimal totalDeduction = extraKmFee + lateReturnFee + fuelFee + damageFee + cleaningFee;
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
                CleaningFee = cleaningFee,
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
                settlement.TrafficFineHoldAmount = dto.TrafficFineHoldAmount;
                settlement.TrafficFineRefundDate = dto.TrafficFineRefundDate;
                if (dto.TrafficFineHoldAmount > 0 && (settlement.TrafficFineRefundStatus == "NONE" || string.IsNullOrEmpty(settlement.TrafficFineRefundStatus)))
                {
                    settlement.TrafficFineRefundStatus = "HOLDING";
                }
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
                    TrafficFineHoldAmount = dto.TrafficFineHoldAmount,
                    TrafficFineRefundDate = dto.TrafficFineRefundDate,
                    TrafficFineRefundStatus = dto.TrafficFineHoldAmount > 0 ? "HOLDING" : "NONE",
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
            request.Status = dto.TrafficFineHoldAmount > 0 ? "HOLDING" : "COMPLETED";
            request.UpdatedAt = DateTime.UtcNow;

            if (contract != null)
            {
                contract.Status = dto.TrafficFineHoldAmount > 0 ? "HOLDING" : "COMPLETED";
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
                .Include(s => s.RentalContract)
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
                .Include(s => s.RentalContract)
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
            if (settlement.TrafficFineHoldAmount > 0 && (settlement.TrafficFineRefundStatus == "NONE" || string.IsNullOrEmpty(settlement.TrafficFineRefundStatus)))
            {
                settlement.TrafficFineRefundStatus = "HOLDING";
            }
            settlement.UpdatedAt = DateTime.UtcNow;

            decimal immediateRefund = Math.Max(0, settlement.RefundAmount - (settlement.TrafficFineHoldAmount > 0 ? settlement.TrafficFineHoldAmount : 0));

            // Lưu lịch sử thanh toán hoàn cọc Đợt 1 (Payment record)
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                ContractId = settlement.ContractId,
                RentalRequestId = settlement.RentalRequestId,
                Amount = immediateRefund > 0 ? immediateRefund : settlement.RefundAmount,
                Type = "REFUND",
                Status = "SUCCESS",
                PaymentMethod = settlement.RefundMethod,
                TransactionCode = dto.RefundTransactionCode,
                PaidAt = DateTime.UtcNow,
                Note = settlement.TrafficFineHoldAmount > 0
                    ? $"Hoàn cọc Đợt 1 quyết toán {settlement.SettlementNumber} (Đã giữ lại {settlement.TrafficFineHoldAmount:N0}đ cọc phạt nguội)"
                    : $"Hoàn tiền cọc quyết toán hợp đồng {settlement.SettlementNumber}",
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);

            if (settlement.RentalRequest != null)
            {
                settlement.RentalRequest.Status = settlement.TrafficFineHoldAmount > 0 && settlement.TrafficFineRefundStatus == "HOLDING" ? "HOLDING" : "COMPLETED";
                settlement.RentalRequest.UpdatedAt = DateTime.UtcNow;
            }

            if (settlement.RentalContract != null)
            {
                settlement.RentalContract.Status = settlement.TrafficFineHoldAmount > 0 && settlement.TrafficFineRefundStatus == "HOLDING" ? "HOLDING" : "COMPLETED";
                settlement.RentalContract.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return MapToDto(settlement);
        }

        public async Task<SettlementResponseDto> ConfirmAdditionalPaymentAsync(Guid id, ConfirmAdditionalPaymentDto dto)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .Include(s => s.RentalContract)
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

        public async Task<SettlementResponseDto> ConfirmTrafficFineRefundAsync(Guid id, ConfirmTrafficFineRefundDto dto)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .Include(s => s.RentalContract)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (settlement == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin phiếu quyết toán.");
            }

            if (settlement.TrafficFineHoldAmount <= 0)
            {
                throw new InvalidOperationException("Đơn này không có quỹ giữ cọc phạt nguội.");
            }

            decimal deduction = Math.Max(0, dto.ActualDeduction);
            decimal actualRefund = Math.Max(0, settlement.TrafficFineHoldAmount - deduction);

            settlement.TrafficFineActualDeduction = deduction;
            settlement.TrafficFineActualRefund = actualRefund;
            settlement.TrafficFineRefundStatus = deduction > 0 ? (actualRefund > 0 ? "PARTIAL_REFUNDED" : "DEDUCTED") : "REFUNDED";
            settlement.TrafficFineRefundedAt = DateTime.UtcNow;
            settlement.TrafficFineTransactionCode = dto.TransactionCode;
            settlement.TrafficFineNotes = dto.ViolationNotes;
            settlement.TrafficFineViolationProofUrl = dto.ViolationProofUrl;
            settlement.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(dto.StaffNotes))
            {
                settlement.StaffNotes = string.IsNullOrWhiteSpace(settlement.StaffNotes)
                    ? dto.StaffNotes
                    : $"{settlement.StaffNotes}\n[ĐỐI SOÁT PHẠT NGUỘI]: {dto.StaffNotes}";
            }

            // Ghi nhận Payment hoàn cọc Đợt 2 (nếu có hoàn tiền)
            if (actualRefund > 0)
            {
                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    ContractId = settlement.ContractId,
                    RentalRequestId = settlement.RentalRequestId,
                    Amount = actualRefund,
                    Type = "REFUND_TRAFFIC_FINE",
                    Status = "SUCCESS",
                    PaymentMethod = "VIETQR",
                    TransactionCode = dto.TransactionCode,
                    PaidAt = DateTime.UtcNow,
                    Note = $"Hoàn trả cọc phạt nguội Đợt 2 phiếu quyết toán {settlement.SettlementNumber}{(deduction > 0 ? $" (Đã khấu trừ {deduction:N0}đ vi phạm)" : "")}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Payments.Add(payment);
            }

            if (settlement.RentalRequest != null)
            {
                settlement.RentalRequest.Status = (settlement.TrafficFineHoldAmount > 0 && settlement.TrafficFineRefundStatus == "HOLDING")
                    ? "HOLDING"
                    : "COMPLETED";
                settlement.RentalRequest.UpdatedAt = DateTime.UtcNow;
            }

            if (settlement.RentalContract != null)
            {
                settlement.RentalContract.Status = (settlement.TrafficFineHoldAmount > 0 && settlement.TrafficFineRefundStatus == "HOLDING")
                    ? "HOLDING"
                    : "COMPLETED";
                settlement.RentalContract.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return MapToDto(settlement);
        }

        public async Task<SettlementResponseDto> DisputeSettlementAsync(Guid id, string reason)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .Include(s => s.RentalContract)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (settlement == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin phiếu quyết toán.");
            }

            settlement.Status = "DISPUTED";
            settlement.StaffNotes = string.IsNullOrWhiteSpace(settlement.StaffNotes)
                ? $"[KHIẾU NẠI KHÁCH HÀNG {DateTime.UtcNow:dd/MM/yyyy HH:mm}]: {reason}"
                : $"{settlement.StaffNotes}\n[KHIẾU NẠI KHÁCH HÀNG {DateTime.UtcNow:dd/MM/yyyy HH:mm}]: {reason}";
            settlement.UpdatedAt = DateTime.UtcNow;

            if (settlement.RentalRequest != null)
            {
                settlement.RentalRequest.Status = "DISPUTED";
                settlement.RentalRequest.UpdatedAt = DateTime.UtcNow;
            }

            if (settlement.RentalContract != null)
            {
                settlement.RentalContract.Status = "DISPUTED";
                settlement.RentalContract.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return MapToDto(settlement);
        }

        public async Task<SettlementResponseDto> ResolveDisputeAsync(Guid id, ResolveDisputeDto dto, string adminName)
        {
            var settlement = await _context.RentalSettlements
                .Include(s => s.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .Include(s => s.RentalContract)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (settlement == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin phiếu quyết toán.");
            }

            decimal adjustedAmount = Math.Max(0, dto.AdjustedRefundAmount);
            string actionText = dto.ResolutionAction switch
            {
                "ACCEPT_REFUND" => $"CHẤP NHẬN KHIẾU NẠI VÀ HOÀN THÊM {adjustedAmount:N0}đ",
                "COMPROMISE" => $"THỎA THUẬN HÒA GIẢI VÀ ĐIỀU CHỈNH HOÀN {adjustedAmount:N0}đ",
                "REJECT" => "BÁC BỎ KHIẾU NẠI (GIỮ NGUYÊN QUYẾT ĐỊNH)",
                _ => dto.ResolutionAction
            };

            settlement.Status = "SETTLED";
            settlement.StaffNotes = string.IsNullOrWhiteSpace(settlement.StaffNotes)
                ? $"[PHÂN XỬ QUẢN TRỊ VIÊN {DateTime.UtcNow:dd/MM/yyyy HH:mm} - {adminName}]: {actionText}. Lý do: {dto.ResolutionNotes}"
                : $"{settlement.StaffNotes}\n[PHÂN XỬ QUẢN TRỊ VIÊN {DateTime.UtcNow:dd/MM/yyyy HH:mm} - {adminName}]: {actionText}. Lý do: {dto.ResolutionNotes}";

            // Nếu có hoàn thêm tiền cho khách
            if (adjustedAmount > 0)
            {
                settlement.RefundAmount += adjustedAmount;
                settlement.TotalDeduction = Math.Max(0, settlement.TotalDeduction - adjustedAmount);

                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    ContractId = settlement.ContractId,
                    RentalRequestId = settlement.RentalRequestId,
                    Amount = adjustedAmount,
                    Type = "REFUND_DISPUTE_ADJUSTMENT",
                    Status = "SUCCESS",
                    PaymentMethod = "VIETQR",
                    TransactionCode = dto.TransactionCode ?? $"TXN-ADJ-{DateTime.UtcNow:HHmmss}",
                    PaidAt = DateTime.UtcNow,
                    Note = $"Hoàn tiền điều chỉnh sau khiếu nại phiếu {settlement.SettlementNumber}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Payments.Add(payment);
            }

            settlement.UpdatedAt = DateTime.UtcNow;

            if (settlement.RentalRequest != null)
            {
                settlement.RentalRequest.Status = (settlement.TrafficFineHoldAmount > 0 && settlement.TrafficFineRefundStatus == "HOLDING") ? "HOLDING" : "COMPLETED";
                settlement.RentalRequest.UpdatedAt = DateTime.UtcNow;
            }

            if (settlement.RentalContract != null)
            {
                settlement.RentalContract.Status = (settlement.TrafficFineHoldAmount > 0 && settlement.TrafficFineRefundStatus == "HOLDING") ? "HOLDING" : "COMPLETED";
                settlement.RentalContract.UpdatedAt = DateTime.UtcNow;
            }

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
                TrafficFineHoldAmount = entity.TrafficFineHoldAmount,
                TrafficFineRefundDate = entity.TrafficFineRefundDate,
                TrafficFineRefundStatus = (string.IsNullOrEmpty(entity.TrafficFineRefundStatus) || entity.TrafficFineRefundStatus == "NONE") && entity.TrafficFineHoldAmount > 0
                    ? "HOLDING"
                    : (entity.TrafficFineRefundStatus ?? "NONE"),
                TrafficFineActualDeduction = entity.TrafficFineActualDeduction,
                TrafficFineActualRefund = entity.TrafficFineActualRefund,
                TrafficFineRefundedAt = entity.TrafficFineRefundedAt,
                TrafficFineTransactionCode = entity.TrafficFineTransactionCode,
                TrafficFineNotes = entity.TrafficFineNotes,
                TrafficFineViolationProofUrl = entity.TrafficFineViolationProofUrl,
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
