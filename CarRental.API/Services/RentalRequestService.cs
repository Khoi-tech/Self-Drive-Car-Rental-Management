using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using CarRental.API.Common;
using CarRental.API.Data;
using CarRental.API.Entities;
using CarRental.API.DTOs.RentalRequest;
using CarRental.API.DTOs.PricingPolicy;
using CarRental.API.Helpers;

namespace CarRental.API.Services
{
    public class RentalRequestService : IRentalRequestService
    {
        private readonly AppDbContext _context;
        private readonly IPricingPolicyService _pricingService;
        private readonly IStorageService _storageService;
        private readonly ISystemSettingsService _settingsService;
        private readonly INotificationService _notificationService;

        public RentalRequestService(
            AppDbContext context, 
            IPricingPolicyService pricingService, 
            IStorageService storageService,
            ISystemSettingsService settingsService,
            INotificationService notificationService)
        {
            _context = context;
            _pricingService = pricingService;
            _storageService = storageService;
            _settingsService = settingsService;
            _notificationService = notificationService;
        }

        public async Task<RentalRequestResponseDto> CreateRequestAsync(CreateRentalRequestDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!string.IsNullOrWhiteSpace(dto.CustomerEmail))
                {
                    var normalizedEmail = dto.CustomerEmail.Trim().ToLowerInvariant();
                    var customerAccount = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

                    if (customerAccount != null && !customerAccount.IsActive)
                    {
                        var reasonText = string.IsNullOrWhiteSpace(customerAccount.LockReason)
                            ? "Tài khoản đang bị tạm khóa đặt xe mới theo yêu cầu kiểm soát rủi ro."
                            : customerAccount.LockReason;
                        throw new InvalidOperationException($"Tài khoản của bạn đang bị TẠM KHÓA quyền đặt xe mới ({reasonText}). Các hợp đồng đang lưu hành (nếu có) vẫn hoạt động bình thường. Vui lòng liên hệ Hotline 1900 8888 để được hỗ trợ.");
                    }
                }

                var car = await _context.Vehicles
                    .FirstOrDefaultAsync(c => c.Id == dto.CarId && c.IsActive);

                if (car == null)
                {
                    throw new InvalidOperationException("Xe không tồn tại hoặc đã bị vô hiệu hóa.");
                }

                // Block vehicles that are physically unavailable AND the booking starts now/soon
                var nonBookableStatuses = new[] { VehicleStatus.MAINTENANCE, VehicleStatus.REPAIR, VehicleStatus.INACTIVE };
                if (nonBookableStatuses.Contains(car.Status))
                {
                    throw new InvalidOperationException("Xe hiện đang trong kỳ bảo dưỡng / sửa chữa / kiểm định và chưa sẵn sàng để thuê.");
                }

                var startUtc = dto.StartTime.ToUtc();
                var endUtc = dto.EndTime.ToUtc();

                // Block vehicles that are currently rented out to another customer
                if (car.Status == VehicleStatus.RENTED)
                {
                    var activeRental = await _context.RentalRequests
                        .Where(r => r.CarId == dto.CarId && (r.Status == "ACTIVE" || r.Status == "CONFIRMED"))
                        .OrderByDescending(r => r.EndTime)
                        .FirstOrDefaultAsync();

                    if (activeRental != null)
                    {
                        var earliestAvailable = activeRental.EndTime.AddHours(3);
                        if (startUtc < earliestAvailable)
                        {
                            throw new InvalidOperationException($"Xe hiện đang trong hành trình lưu hành với khách hàng (dự kiến hoàn trả lúc {activeRental.EndTime:dd/MM/yyyy HH:mm}). Vui lòng chọn thời gian nhận xe sau {earliestAvailable:dd/MM/yyyy HH:mm} hoặc chọn dòng xe khác.");
                        }
                    }
                    else
                    {
                        throw new InvalidOperationException("Xe hiện đang ở trạng thái cho thuê và chưa được nghiệm thu trả xe về bãi. Không thể tạo đơn mới cho xe này.");
                    }
                }

                if (startUtc < DateTime.UtcNow.AddMinutes(-1))
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
                    throw new ConflictException("Xe đã có khách hàng khác đặt trong khoảng thời gian này. Vui lòng chọn khung giờ khác hoặc xe khác.");
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
                // FAST_HOLD bypasses this check because Fast Hold is a reservation holding deposit!
                bool isFastHold = string.Equals(dto.BookingType, "FAST_HOLD", StringComparison.OrdinalIgnoreCase);

                if (!isFastHold && car.DailyRate >= 1500000m)
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
                        throw new InvalidOperationException($"Dòng xe cao cấp ({car.Make} {car.Model}) yêu cầu khách hàng phải có tối thiểu 1 chuyến đi hoàn tất tốt trên hệ thống VELORA để xác minh độ tín nhiệm. Bạn có thể sử dụng tính năng 'Cọc giữ xe siêu tốc 500k' để giữ chỗ xe trước!");
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

                var defaultHoldDeposit = await _settingsService.GetSettingValueAsync("fast_hold_deposit_amount", 500000m);
                var holdDeposit = isFastHold ? (dto.HoldDepositAmount.HasValue && dto.HoldDepositAmount.Value > 0 ? dto.HoldDepositAmount.Value : defaultHoldDeposit) : 0m;

                var isCash = string.Equals(dto.DepositMethod, "CASH", StringComparison.OrdinalIgnoreCase);
                var isOnlinePrepay = !isFastHold && !isCash;
                var onlineDiscountPercentSetting = await _settingsService.GetSettingValueAsync("vietqr_discount_percent", 5m);
                var onlineDiscountPercent = isOnlinePrepay ? onlineDiscountPercentSetting : 0m;
                var totalDiscountPercent = preview.DiscountPercentage + onlineDiscountPercent;
                var estimatedFee = isOnlinePrepay 
                    ? Math.Round(preview.RentalPrice * (1m - onlineDiscountPercent / 100m))
                    : preview.RentalPrice;

                // Phase 3: Auto-upload Base64 KYC documents to Supabase Storage Bucket (sensitive-docs)
                var idCardFront = dto.IdCardFrontUrl;
                if (!string.IsNullOrWhiteSpace(idCardFront) && idCardFront.StartsWith("data:image"))
                {
                    idCardFront = await _storageService.UploadBase64Async(idCardFront, "sensitive-docs", "kyc");
                }

                var idCardBack = dto.IdCardBackUrl;
                if (!string.IsNullOrWhiteSpace(idCardBack) && idCardBack.StartsWith("data:image"))
                {
                    idCardBack = await _storageService.UploadBase64Async(idCardBack, "sensitive-docs", "kyc");
                }

                var licenseFront = dto.DriverLicenseFrontUrl;
                if (!string.IsNullOrWhiteSpace(licenseFront) && licenseFront.StartsWith("data:image"))
                {
                    licenseFront = await _storageService.UploadBase64Async(licenseFront, "sensitive-docs", "kyc");
                }

                var licenseBack = dto.DriverLicenseBackUrl;
                if (!string.IsNullOrWhiteSpace(licenseBack) && licenseBack.StartsWith("data:image"))
                {
                    licenseBack = await _storageService.UploadBase64Async(licenseBack, "sensitive-docs", "kyc");
                }

                var expiryHours = await _settingsService.GetSettingValueAsync("fast_hold_expiry_hours", 4);

                var normalizedDeliveryMethod = string.Equals(dto.DeliveryMethod, "DELIVERY", StringComparison.OrdinalIgnoreCase)
                    ? "DELIVERY"
                    : "SELF_PICKUP";
                var estimatedDeliveryKm = normalizedDeliveryMethod == "DELIVERY"
                    ? Math.Max(0m, dto.EstimatedDeliveryDistanceKm ?? 0m)
                    : 0m;

                var rentalRequest = new RentalRequest
                {
                    Id = Guid.NewGuid(),
                    CarId = dto.CarId,
                    StartTime = startUtc,
                    EndTime = endUtc,
                    PickupLocation = dto.PickupLocation,
                    DropoffLocation = string.IsNullOrWhiteSpace(dto.DropoffLocation) ? dto.PickupLocation : dto.DropoffLocation,
                    
                    CustomerName = dto.CustomerName,
                    CustomerPhone = dto.CustomerPhone,
                    CustomerEmail = dto.CustomerEmail,
                    CustomerIdCard = !string.IsNullOrWhiteSpace(dto.CustomerIdCard) ? dto.CustomerIdCard : (isFastHold ? "CHƯA_CẬP_NHẬT" : ""),
                    DriverLicenseNumber = !string.IsNullOrWhiteSpace(dto.DriverLicenseNumber) ? dto.DriverLicenseNumber : (isFastHold ? "CHƯA_CẬP_NHẬT" : ""),
                    DriverLicenseClass = dto.DriverLicenseClass,
                    DriverLicenseExpiry = dto.DriverLicenseExpiry.ToUtc(),
                    IdCardFrontUrl = idCardFront,
                    IdCardBackUrl = idCardBack,
                    DriverLicenseFrontUrl = licenseFront,
                    DriverLicenseBackUrl = licenseBack,
                    Notes = dto.Notes,
                    DeliveryMethod = normalizedDeliveryMethod,
                    EstimatedDeliveryDistanceKm = estimatedDeliveryKm,
                    
                    TotalDays = totalDays,
                    DailyRate = preview.BasePrice,
                    DiscountPercent = totalDiscountPercent,
                    HolidaySurchargePercent = preview.HolidaySurcharge,
                    EstimatedTotalFee = estimatedFee,
                    DepositAmount = car.DepositAmount,
                    BookingType = isFastHold ? "FAST_HOLD" : "STANDARD",
                    DepositMethod = isFastHold ? "VIETQR" : (isCash ? "CASH" : "VIETQR"),
                    HoldDepositAmount = holdDeposit,
                    IsSecurityDepositPaid = false,
                    HoldExpiresAt = isFastHold ? DateTime.UtcNow.AddHours(expiryHours) : null,
                    
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
                        LicenseNumber = d.LicenseNumber
                    }).ToList();
                }

                _context.RentalRequests.Add(rentalRequest);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToResponseDto(rentalRequest);
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23P01")
            {
                await transaction.RollbackAsync();
                throw new ConflictException("Xe đã có khách hàng khác đặt trong khoảng thời gian này. Vui lòng chọn khung giờ khác hoặc xe khác.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
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
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.RentalRequests
                    .Include(r => r.Vehicle)
                    .Include(r => r.AdditionalDrivers)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (request == null)
                {
                    throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
                }

                if (request.Status != "PENDING" && request.Status != "HOLD_CONFIRMED")
                {
                    throw new InvalidOperationException($"Chỉ có thể duyệt yêu cầu ở trạng thái PENDING hoặc HOLD_CONFIRMED. Trạng thái hiện tại: {request.Status}");
                }

                request.Status = "APPROVED";
                request.UpdatedAt = DateTime.UtcNow;

                // Khóa xe sang BOOKED
                if (request.Vehicle != null)
                {
                    request.Vehicle.Status = VehicleStatus.BOOKED;
                    request.Vehicle.UpdatedAt = DateTime.UtcNow;
                }

                // Tự động sinh RentalContract ở trạng thái PENDING_SIGNATURE trong cùng Database Transaction
                var contract = await _context.RentalContracts.FirstOrDefaultAsync(c => c.RequestId == request.Id);
                if (contract == null)
                {
                    var template = await _context.ContractTemplates
                        .FirstOrDefaultAsync(t => t.IsActive && (t.TemplateType == "STANDARD" || t.TemplateType == "DAILY"));

                    string templateContent = template?.Content ?? "HỢP ĐỒNG CHO THUÊ XE TỰ LÁI VELORA";
                    int totalDays = Math.Max(1, request.TotalDays);
                    int maxKm = totalDays * (request.Vehicle?.MileageLimit ?? 300);
                    string contractNumber = $"HD-{DateTime.UtcNow:yyyyMMdd}-{request.Id.ToString()[..4].ToUpper()}";

                    contract = new RentalContract
                    {
                        Id = Guid.NewGuid(),
                        RequestId = request.Id,
                        ContractNumber = contractNumber,
                        TotalFee = request.EstimatedTotalFee,
                        DepositAmount = request.DepositAmount,
                        MaxKm = maxKm,
                        Content = templateContent,
                        Status = "PENDING_SIGNATURE",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.RentalContracts.Add(contract);
                }
                else
                {
                    contract.Status = "PENDING_SIGNATURE";
                    contract.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Real-time notification for customer
                try
                {
                    if (!string.IsNullOrWhiteSpace(request.CustomerEmail))
                    {
                        var user = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.CustomerEmail.ToLower());
                        if (user != null)
                        {
                            await _notificationService.CreateNotificationAsync(
                                user.Id,
                                "Hồ sơ thuê xe đã được phê duyệt",
                                $"Yêu cầu thuê xe {request.Vehicle?.Make} {request.Vehicle?.Model} ({request.TotalDays} ngày) đã được Ban Điều Hành phê duyệt. Vui lòng ký hợp đồng điện tử để hoàn tất.",
                                "RENTAL",
                                request.Id.ToString(),
                                "/profile?tab=documents"
                            );
                        }
                    }
                }
                catch { }

                return MapToResponseDto(request);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<RentalRequestResponseDto> RejectRequestAsync(Guid id, string reason)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var request = await _context.RentalRequests
                    .Include(r => r.Vehicle)
                    .Include(r => r.AdditionalDrivers)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (request == null)
                {
                    throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
                }

                if (request.Status != "PENDING" && request.Status != "HOLD_CONFIRMED" && request.Status != "PENDING_HOLD_PAYMENT")
                {
                    throw new InvalidOperationException($"Chỉ có thể từ chối yêu cầu ở trạng thái PENDING hoặc HOLD_CONFIRMED. Trạng thái hiện tại: {request.Status}");
                }

                request.Status = "REJECTED";
                request.RejectReason = reason.Trim();
                request.UpdatedAt = DateTime.UtcNow;

                // Giải phóng xe về READY
                if (request.Vehicle != null)
                {
                    bool hasOtherActive = await _context.RentalRequests
                        .AnyAsync(r => r.CarId == request.CarId && r.Id != request.Id && (r.Status == "CONFIRMED" || r.Status == "ACTIVE"));
                    if (!hasOtherActive)
                    {
                        request.Vehicle.Status = VehicleStatus.READY;
                        request.Vehicle.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // Chuyển hợp đồng sang VOID nếu đã tạo
                var contract = await _context.RentalContracts
                    .FirstOrDefaultAsync(c => c.RequestId == request.Id);
                if (contract != null)
                {
                    contract.Status = "VOID";
                    contract.UpdatedAt = DateTime.UtcNow;
                }

                // Nếu khách đã nộp cọc giữ xe 500k (Fast Hold), tạo phiếu hoàn lại cọc
                if (request.HoldDepositAmount > 0)
                {
                    var refundPayment = new Payment
                    {
                        Id = Guid.NewGuid(),
                        ContractId = contract?.Id,
                        RentalRequestId = request.Id,
                        Amount = request.HoldDepositAmount,
                        Type = "REFUND",
                        Status = "SUCCESS",
                        PaymentMethod = "VIETQR",
                        PaidAt = DateTime.UtcNow,
                        Note = $"Hoàn tiền cọc giữ xe 500k do đơn bị từ chối: {request.RejectReason}",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Payments.Add(refundPayment);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Real-time notification for customer
                try
                {
                    if (!string.IsNullOrWhiteSpace(request.CustomerEmail))
                    {
                        var user = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.CustomerEmail.ToLower());
                        if (user != null)
                        {
                            await _notificationService.CreateNotificationAsync(
                                user.Id,
                                "Yêu cầu thuê xe chưa được duyệt",
                                $"Yêu cầu thuê xe {request.Vehicle?.Make} {request.Vehicle?.Model} bị từ chối với lý do: {request.RejectReason}.",
                                "RENTAL",
                                request.Id.ToString(),
                                "/profile?tab=rentals"
                            );
                        }
                    }
                }
                catch { }

                return MapToResponseDto(request);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<CancelRentalResultDto> CancelRequestAsync(Guid id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
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

                // Chuyển hợp đồng liên kết sang VOID
                var requestContract = await _context.RentalContracts
                    .FirstOrDefaultAsync(c => c.RequestId == request.Id);
                if (requestContract != null)
                {
                    requestContract.Status = "VOID";
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
                await transaction.CommitAsync();

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
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<RentalRequestResponseDto> UpdateDocumentsAsync(Guid id, UpdateRentalDocumentsDto dto)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                throw new KeyNotFoundException("Không tìm thấy đơn thuê xe.");
            }

            if (!string.IsNullOrWhiteSpace(dto.CustomerIdCard))
                request.CustomerIdCard = dto.CustomerIdCard.Trim();

            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseNumber))
                request.DriverLicenseNumber = dto.DriverLicenseNumber.Trim();

            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseClass))
                request.DriverLicenseClass = dto.DriverLicenseClass.Trim();

            if (dto.DriverLicenseExpiry.HasValue)
                request.DriverLicenseExpiry = dto.DriverLicenseExpiry.Value;

            if (!string.IsNullOrWhiteSpace(dto.IdCardFrontUrl))
                request.IdCardFrontUrl = dto.IdCardFrontUrl.Trim();

            if (!string.IsNullOrWhiteSpace(dto.IdCardBackUrl))
                request.IdCardBackUrl = dto.IdCardBackUrl.Trim();

            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseFrontUrl))
                request.DriverLicenseFrontUrl = dto.DriverLicenseFrontUrl.Trim();

            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseBackUrl))
                request.DriverLicenseBackUrl = dto.DriverLicenseBackUrl.Trim();

            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponseDto(request);
        }

        public async Task<RentalRequestResponseDto> ConfirmSecurityDepositAsync(Guid id, bool isPaid = true)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                throw new KeyNotFoundException("Không tìm thấy đơn thuê xe.");
            }

            request.IsSecurityDepositPaid = isPaid;
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponseDto(request);
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
                DeliveryMethod = string.IsNullOrWhiteSpace(request.DeliveryMethod) ? "SELF_PICKUP" : request.DeliveryMethod,
                EstimatedDeliveryDistanceKm = request.EstimatedDeliveryDistanceKm,
                TotalDays = request.TotalDays,
                DailyRate = request.DailyRate,
                DiscountPercent = request.DiscountPercent,
                HolidaySurchargePercent = request.HolidaySurchargePercent,
                EstimatedTotalFee = request.EstimatedTotalFee,
                DepositAmount = request.DepositAmount,
                BookingType = request.BookingType ?? "STANDARD",
                DepositMethod = request.DepositMethod ?? "VIETQR",
                HoldDepositAmount = request.HoldDepositAmount,
                IsSecurityDepositPaid = request.IsSecurityDepositPaid,
                HoldExpiresAt = request.HoldExpiresAt ?? (request.BookingType == "FAST_HOLD" ? request.CreatedAt.AddHours(4) : null),
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
                    IdCardNumber = ad.IdCardNumber ?? string.Empty,
                    LicenseNumber = ad.LicenseNumber ?? string.Empty
                }).ToList() ?? new List<AdditionalDriverDto>()
            };
        }
    }
}
