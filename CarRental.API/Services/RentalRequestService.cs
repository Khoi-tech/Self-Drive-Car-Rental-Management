using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.Entities;
using CarRental.API.DTOs.RentalRequest;
using CarRental.API.DTOs.PricingPolicy;

namespace CarRental.API.Services
{
    public class RentalRequestService : IRentalRequestService
    {
        private readonly AppDbContext _context;
        private readonly IPricingPolicyService _pricingService;

        public RentalRequestService(AppDbContext context, IPricingPolicyService pricingService)
        {
            _context = context;
            _pricingService = pricingService;
        }

        public async Task<RentalRequestResponseDto> CreateRequestAsync(CreateRentalRequestDto dto)
        {
            var car = await _context.Vehicles
                .FirstOrDefaultAsync(c => c.Id == dto.CarId && c.IsActive);

            if (car == null)
            {
                throw new InvalidOperationException("Xe không tồn tại hoặc đã bị vô hiệu hóa.");
            }

            // Block vehicles that are physically unavailable AND the booking starts now/soon
            var nonBookableStatuses = new[] { VehicleStatus.MAINTENANCE, VehicleStatus.REPAIR, VehicleStatus.INACTIVE };
            if (nonBookableStatuses.Contains(car.Status) && dto.StartTime <= DateTime.UtcNow.AddHours(24))
            {
                throw new InvalidOperationException("Xe hiện đang bảo dưỡng / sửa chữa và chưa sẵn sàng để thuê.");
            }

            var startUtc = dto.StartTime.Kind == DateTimeKind.Utc ? dto.StartTime : dto.StartTime.ToUniversalTime();
            var endUtc = dto.EndTime.Kind == DateTimeKind.Utc ? dto.EndTime : dto.EndTime.ToUniversalTime();

            if (startUtc < DateTime.UtcNow.AddMinutes(-15))
            {
                throw new InvalidOperationException("Thời gian bắt đầu thuê xe không thể ở quá khứ.");
            }

            if (startUtc >= endUtc)
            {
                throw new InvalidOperationException("Thời gian bắt đầu phải trước thời gian kết thúc.");
            }

            var rentalHours = (endUtc - startUtc).TotalHours;
            if (rentalHours < 4)
            {
                throw new InvalidOperationException("Thời gian thuê xe tối thiểu là 4 giờ.");
            }

            // Check for overlaps with 3-hour buffer time between consecutive bookings
            var bufferHours = 3;
            var endWithBufferUtc = endUtc.AddHours(bufferHours);
            bool hasOverlap = await _context.RentalRequests
                .AnyAsync(r => r.CarId == dto.CarId 
                    && r.Status != "CANCELLED" 
                    && r.Status != "REJECTED"
                    && r.Status != "COMPLETED"
                    && r.StartTime < endWithBufferUtc 
                    && r.EndTime.AddHours(bufferHours) > startUtc);

            if (hasOverlap)
            {
                throw new InvalidOperationException("Xe đã có lịch đặt trong khoảng thời gian này (bao gồm 3 giờ đệm giữa các chuyến).");
            }

            // Check for maintenance schedule overlaps
            bool hasMaintenanceOverlap = await _context.MaintenanceRecords
                .AnyAsync(m => m.CarId == dto.CarId
                    && m.Status == "SCHEDULED"
                    && m.ScheduledDate < dto.EndTime
                    && (m.CompletedDate == null || m.CompletedDate > dto.StartTime));

            if (hasMaintenanceOverlap)
            {
                throw new InvalidOperationException("Xe có lịch bảo dưỡng trùng với thời gian thuê bạn chọn.");
            }

            // PHASE 2: Advanced Rental Eligibility & Driver's License Validation
            if (dto.DriverLicenseExpiry.HasValue && dto.DriverLicenseExpiry.Value.Date < dto.EndTime.Date)
            {
                throw new InvalidOperationException($"Giấy phép lái xe hết hạn vào ngày {dto.DriverLicenseExpiry.Value:dd/MM/yyyy}, trước ngày dự kiến trả xe ({dto.EndTime:dd/MM/yyyy}). Vui lòng cập nhật GPLX còn hạn.");
            }

            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseClass))
            {
                if (dto.DriverLicenseClass.Equals("B1_AUTO", StringComparison.OrdinalIgnoreCase) && car.Transmission == TransmissionType.MANUAL)
                {
                    throw new InvalidOperationException($"GPLX hạng B1 số tự động không được phép điều khiển dòng xe số sàn ({car.Make} {car.Model}). Vui lòng chọn dòng xe số tự động hoặc cập nhật hạng bằng lái.");
                }

                if ((dto.DriverLicenseClass.Equals("B1_AUTO", StringComparison.OrdinalIgnoreCase) || 
                     dto.DriverLicenseClass.Equals("B1", StringComparison.OrdinalIgnoreCase) || 
                     dto.DriverLicenseClass.Equals("B2", StringComparison.OrdinalIgnoreCase)) && car.Seats > 9)
                {
                    throw new InvalidOperationException($"GPLX hạng {dto.DriverLicenseClass} chỉ cho phép điều khiển phương tiện tối đa 9 chỗ ngồi ({car.Make} {car.Model} có {car.Seats} chỗ).");
                }
            }

            // Luxury Car Rental History Requirement (DailyRate >= 1,500,000 VND)
            if (car.DailyRate >= 1500000m)
            {
                var hasDispute = await _context.RentalRequests.AnyAsync(r => 
                    (r.CustomerEmail == dto.CustomerEmail || r.CustomerIdCard == dto.CustomerIdCard) 
                    && r.Status == "DISPUTED");
                if (hasDispute)
                {
                    throw new InvalidOperationException("Khách hàng đang có hồ sơ khiếu nại tranh chấp chưa hoàn tất, tạm thời không thể đặt xe thuộc phân khúc cao cấp.");
                }

                var hasCompletedRental = await _context.RentalRequests.AnyAsync(r => 
                    (r.CustomerEmail == dto.CustomerEmail || r.CustomerIdCard == dto.CustomerIdCard) 
                    && r.Status == "COMPLETED");
                if (!hasCompletedRental)
                {
                    throw new InvalidOperationException($"Dòng xe cao cấp ({car.Make} {car.Model}) yêu cầu khách hàng phải có tối thiểu 1 chuyến đi hoàn tất tốt trên hệ thống VELORA để xác minh độ tín nhiệm.");
                }
            }

            var totalDays = (int)Math.Ceiling((dto.EndTime - dto.StartTime).TotalDays);
            if (totalDays <= 0) totalDays = 1;

            var previewDto = new PricingPreviewRequestDto { RentalDays = totalDays };
            var preview = await _pricingService.PreviewPricingAsync(dto.CarId, previewDto);

            if (preview == null)
            {
                throw new InvalidOperationException("Không thể tính giá dự kiến.");
            }

            var rentalRequest = new RentalRequest
            {
                Id = Guid.NewGuid(),
                CarId = dto.CarId,
                StartTime = startUtc,
                EndTime = endUtc,
                PickupLocation = dto.PickupLocation,
                DropoffLocation = dto.DropoffLocation,
                
                CustomerName = dto.CustomerName,
                CustomerPhone = dto.CustomerPhone,
                CustomerEmail = dto.CustomerEmail,
                CustomerIdCard = dto.CustomerIdCard,
                DriverLicenseNumber = dto.DriverLicenseNumber,
                DriverLicenseClass = dto.DriverLicenseClass,
                DriverLicenseExpiry = dto.DriverLicenseExpiry,
                IdCardFrontUrl = dto.IdCardFrontUrl,
                IdCardBackUrl = dto.IdCardBackUrl,
                DriverLicenseFrontUrl = dto.DriverLicenseFrontUrl,
                DriverLicenseBackUrl = dto.DriverLicenseBackUrl,
                Notes = dto.Notes,
                
                TotalDays = totalDays,
                DailyRate = preview.BasePrice,
                DiscountPercent = preview.DiscountPercentage,
                HolidaySurchargePercent = preview.HolidaySurcharge,
                EstimatedTotalFee = preview.RentalPrice,
                DepositAmount = car.DepositAmount,
                
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow
            };

            if (dto.AdditionalDrivers != null && dto.AdditionalDrivers.Any())
            {
                rentalRequest.AdditionalDrivers = dto.AdditionalDrivers.Select(d => new AdditionalDriver
                {
                    Id = Guid.NewGuid(),
                    FullName = d.FullName,
                    PhoneNumber = d.PhoneNumber,
                    IdCardNumber = d.IdCardNumber,
                    IdCardFrontUrl = d.IdCardFrontUrl,
                    IdCardBackUrl = d.IdCardBackUrl,
                    LicenseNumber = d.LicenseNumber,
                    DriverLicenseFrontUrl = d.DriverLicenseFrontUrl,
                    DriverLicenseBackUrl = d.DriverLicenseBackUrl,
                    DriverLicenseClass = d.DriverLicenseClass,
                    DriverLicenseExpiry = d.DriverLicenseExpiry
                }).ToList();
            }

            _context.RentalRequests.Add(rentalRequest);
            await _context.SaveChangesAsync();

            return MapToResponseDto(rentalRequest);
        }

        public async Task<RentalRequestResponseDto?> GetByIdAsync(Guid id)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null) return null;

            return MapToResponseDto(request);
        }

        public async Task<List<RentalRequestResponseDto>> GetAllAsync(string? status = null)
        {
            var query = _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return list.Select(MapToResponseDto).ToList();
        }

        public async Task<List<RentalRequestResponseDto>> GetByCustomerAsync(string? email, string? phone)
        {
            var query = _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .AsQueryable();

            var cleanEmail = email?.Trim().ToLower();
            var cleanPhone = phone?.Trim();

            if (!string.IsNullOrWhiteSpace(cleanEmail) && !string.IsNullOrWhiteSpace(cleanPhone))
            {
                query = query.Where(r => r.CustomerEmail.ToLower() == cleanEmail || r.CustomerPhone == cleanPhone);
            }
            else if (!string.IsNullOrWhiteSpace(cleanEmail))
            {
                query = query.Where(r => r.CustomerEmail.ToLower() == cleanEmail);
            }
            else if (!string.IsNullOrWhiteSpace(cleanPhone))
            {
                query = query.Where(r => r.CustomerPhone == cleanPhone);
            }

            var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return list.Select(MapToResponseDto).ToList();
        }

        public async Task<RentalRequestResponseDto> ApproveRequestAsync(Guid id)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
            }

            if (request.Status != "PENDING")
            {
                throw new InvalidOperationException($"Chỉ có thể duyệt yêu cầu ở trạng thái PENDING. Trạng thái hiện tại: {request.Status}");
            }

            request.Status = "APPROVED";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponseDto(request);
        }

        public async Task<RentalRequestResponseDto> RejectRequestAsync(Guid id, string reason)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
            }

            if (request.Status != "PENDING")
            {
                throw new InvalidOperationException($"Chỉ có thể từ chối yêu cầu ở trạng thái PENDING. Trạng thái hiện tại: {request.Status}");
            }

            request.Status = "REJECTED";
            request.RejectReason = reason.Trim();
            request.UpdatedAt = DateTime.UtcNow;

            // Also cancel associated contract if any exists
            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == request.Id);
            if (contract != null)
            {
                contract.Status = "CANCELLED";
                contract.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return MapToResponseDto(request);
        }

        public async Task<CancelRentalResultDto> CancelRequestAsync(Guid id)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                throw new KeyNotFoundException("Không tìm thấy yêu cầu thuê xe.");

            var cancellableStatuses = new[] { "PENDING", "APPROVED", "SIGNED", "CONFIRMED" };
            if (!cancellableStatuses.Contains(request.Status))
                throw new InvalidOperationException($"Không thể hủy đơn ở trạng thái {request.Status}. Chỉ hủy được đơn PENDING, APPROVED, SIGNED hoặc CONFIRMED.");

            bool wasConfirmed = request.Status == "CONFIRMED";
            decimal penaltyPercent = 0m;
            string penaltyReason = "Không áp dụng phí hủy.";
            decimal depositAmount = request.DepositAmount;

            // Only apply penalty if deposit was already paid (CONFIRMED)
            if (wasConfirmed)
            {
                var hoursUntilPickup = (request.StartTime - DateTime.UtcNow).TotalHours;

                if (hoursUntilPickup > 24)
                {
                    penaltyPercent = 0m;
                    penaltyReason = "Hủy trước 24 giờ nhận xe — Hoàn 100% tiền cọc.";
                }
                else if (hoursUntilPickup > 6)
                {
                    penaltyPercent = 30m;
                    penaltyReason = $"Hủy trong vòng 6–24 giờ trước giờ nhận xe — Phạt 30% tiền cọc.";
                }
                else if (hoursUntilPickup > 0)
                {
                    penaltyPercent = 50m;
                    penaltyReason = $"Hủy dưới 6 giờ trước giờ nhận xe — Phạt 50% tiền cọc.";
                }
                else
                {
                    penaltyPercent = 100m;
                    penaltyReason = "Đã quá giờ nhận xe (No-show) — Mất 100% tiền cọc.";
                }
            }

            decimal penaltyAmount = Math.Round(depositAmount * penaltyPercent / 100m, 0);
            decimal refundAmount = depositAmount - penaltyAmount;

            // Update request status
            request.Status = "CANCELLED";
            request.RejectReason = penaltyReason;
            request.UpdatedAt = DateTime.UtcNow;

            // Release vehicle back to READY if it was reserved
            if (request.Vehicle != null && 
                (request.Vehicle.Status == VehicleStatus.BOOKED || request.Vehicle.Status == VehicleStatus.RENTED))
            {
                // Only release if no other active bookings exist for this vehicle
                bool hasOtherActiveBookings = await _context.RentalRequests
                    .AnyAsync(r => r.CarId == request.CarId 
                        && r.Id != request.Id
                        && (r.Status == "CONFIRMED" || r.Status == "ACTIVE"));

                if (!hasOtherActiveBookings)
                {
                    request.Vehicle.Status = VehicleStatus.READY;
                }
            }

            // Also cancel associated contract if exists
            var requestContract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == request.Id);
            if (requestContract != null)
            {
                requestContract.Status = "CANCELLED";
                requestContract.UpdatedAt = DateTime.UtcNow;
            }

            // If deposit was paid, log refund payment for audit trail
            if (wasConfirmed && refundAmount > 0)
            {
                var refundPayment = new Payment
                {
                    Id = Guid.NewGuid(),
                    ContractId = requestContract?.Id,
                    RentalRequestId = request.Id,
                    Amount = refundAmount,
                    Type = "REFUND_CANCELLATION",
                    Status = "SUCCESS",
                    PaymentMethod = "VIETQR",
                    PaidAt = DateTime.UtcNow,
                    Note = $"Hoàn tiền cọc sau hủy đơn {request.Id.ToString()[..8].ToUpper()} ({penaltyReason})",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Payments.Add(refundPayment);
            }

            await _context.SaveChangesAsync();

            return new CancelRentalResultDto
            {
                RequestId = request.Id,
                Status = "CANCELLED",
                DepositAmount = depositAmount,
                PenaltyPercent = penaltyPercent,
                PenaltyAmount = penaltyAmount,
                RefundAmount = refundAmount,
                PenaltyReason = penaltyReason,
                CancelledAt = DateTime.UtcNow
            };
        }

        private RentalRequestResponseDto MapToResponseDto(RentalRequest request)
        {
            return new RentalRequestResponseDto
            {
                Id = request.Id,
                CarId = request.CarId,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                PickupLocation = request.PickupLocation,
                DropoffLocation = request.DropoffLocation,
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                CustomerEmail = request.CustomerEmail,
                CustomerIdCard = request.CustomerIdCard,
                DriverLicenseNumber = request.DriverLicenseNumber,
                DriverLicenseClass = request.DriverLicenseClass,
                DriverLicenseExpiry = request.DriverLicenseExpiry,
                IdCardFrontUrl = request.IdCardFrontUrl,
                IdCardBackUrl = request.IdCardBackUrl,
                DriverLicenseFrontUrl = request.DriverLicenseFrontUrl,
                DriverLicenseBackUrl = request.DriverLicenseBackUrl,
                Notes = request.Notes,
                TotalDays = request.TotalDays,
                DailyRate = request.DailyRate,
                DiscountPercent = request.DiscountPercent,
                HolidaySurchargePercent = request.HolidaySurchargePercent,
                EstimatedTotalFee = request.EstimatedTotalFee,
                DepositAmount = request.DepositAmount,
                Status = request.Status,
                RejectReason = request.RejectReason,
                CarMake = request.Vehicle?.Make,
                CarModel = request.Vehicle?.Model,
                CarLicensePlate = request.Vehicle?.LicensePlate,
                CarImageUrl = request.Vehicle?.ImageUrl,
                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
                AdditionalDrivers = request.AdditionalDrivers?.Select(ad => new AdditionalDriverDto
                {
                    Id = ad.Id,
                    FullName = ad.FullName,
                    PhoneNumber = ad.PhoneNumber,
                    IdCardNumber = ad.IdCardNumber,
                    IdCardFrontUrl = ad.IdCardFrontUrl,
                    IdCardBackUrl = ad.IdCardBackUrl,
                    LicenseNumber = ad.LicenseNumber,
                    DriverLicenseFrontUrl = ad.DriverLicenseFrontUrl,
                    DriverLicenseBackUrl = ad.DriverLicenseBackUrl,
                    DriverLicenseClass = ad.DriverLicenseClass,
                    DriverLicenseExpiry = ad.DriverLicenseExpiry
                }).ToList() ?? new List<AdditionalDriverDto>()
            };
        }
    }
}
