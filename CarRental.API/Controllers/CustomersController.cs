using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using CarRental.API.Data;
using CarRental.API.DTOs.Common;
using CarRental.API.Entities;
using CarRental.API.Helpers;
using CarRental.API.Middleware;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/customers")]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly IStorageService _storageService;

        public CustomersController(AppDbContext context, IMemoryCache cache, IStorageService storageService)
        {
            _context = context;
            _cache = cache;
            _storageService = storageService;
        }

        public class ViolationLogDto
        {
            public string Id { get; set; } = Guid.NewGuid().ToString();
            public string Date { get; set; } = null!;
            public string Type { get; set; } = null!;
            public int PointsChange { get; set; }
            public string Reason { get; set; } = null!;
            public string Officer { get; set; } = "Hệ thống kiểm toán";
        }

        public class CustomerBookingItemDto
        {
            public string BookingId { get; set; } = null!;
            public string CarName { get; set; } = null!;
            public string LicensePlate { get; set; } = null!;
            public string Dates { get; set; } = null!;
            public decimal TotalFee { get; set; }
            public decimal DepositAmount { get; set; }
            public string Status { get; set; } = null!;
            public string StatusLabel { get; set; } = null!;
        }

        public class AdditionalDriverItemDto
        {
            public string Id { get; set; } = null!;
            public string FullName { get; set; } = null!;
            public string Phone { get; set; } = null!;
            public string IdCard { get; set; } = null!;
            public string LicenseNumber { get; set; } = null!;
            public string LicenseClass { get; set; } = "B2";
            public string ExpiryDate { get; set; } = "15/10/2029";
            public string Status { get; set; } = "VERIFIED";
        }

        public class CustomerAdminSummaryDto
        {
            public string Id { get; set; } = null!;
            public string FullName { get; set; } = null!;
            public string Email { get; set; } = null!;
            
            // Masked fields for default view (Nghị định 13/2023/NĐ-CP)
            public string MaskedPhone { get; set; } = null!;
            public string MaskedIdCard { get; set; } = null!;
            public string MaskedLicenseNumber { get; set; } = null!;
            
            // Raw fields for unmask mode
            public string RawPhone { get; set; } = null!;
            public string RawIdCard { get; set; } = null!;
            public string RawLicenseNumber { get; set; } = null!;

            public string LicenseClass { get; set; } = "B2";
            public string LicenseExpiryDate { get; set; } = "Chưa cập nhật";
            public bool IsLicenseNearExpiry { get; set; } = false;

            public string MembershipTier { get; set; } = "Silver";
            public int TrustScore { get; set; } = 100;
            public string KycStatus { get; set; } = "VERIFIED"; // VERIFIED, PENDING, REJECTED
            public string AccountStatus { get; set; } = "ACTIVE"; // ACTIVE, SUSPENDED

            public int TotalBookings { get; set; }
            public int CompletedBookings { get; set; }
            public int ActiveBookings { get; set; }
            public int CancelledBookings { get; set; }

            public decimal TotalSpent { get; set; }
            public decimal EscrowDepositAmount { get; set; }

            public DateTime CreatedAt { get; set; }
            public DateTime? LastBookingDate { get; set; }
            public string? InternalStaffNotes { get; set; }

            // KYC Specimen URLs
            public string IdCardFrontUrl { get; set; } = "";
            public string IdCardBackUrl { get; set; } = "";
            public string DriverLicenseFrontUrl { get; set; } = "";
            public string DriverLicenseBackUrl { get; set; } = "";

            // Lists
            public List<ViolationLogDto> ViolationsHistory { get; set; } = new();
            public List<CustomerBookingItemDto> RecentBookings { get; set; } = new();
            public List<AdditionalDriverItemDto> AdditionalDrivers { get; set; } = new();
        }

        public class ToggleCustomerStatusDto
        {
            public string Status { get; set; } = "ACTIVE"; // "ACTIVE" or "SUSPENDED"
            public string? Reason { get; set; }
        }

        public class UpdateKycStatusDto
        {
            public string KycStatus { get; set; } = "VERIFIED"; // "VERIFIED" or "REJECTED"
            public string? RejectReason { get; set; }
        }

        public class AddViolationDto
        {
            public string Type { get; set; } = null!;
            public int PointsAdjustment { get; set; } // e.g. -10 or +5
            public string Notes { get; set; } = null!;
        }

        public class UpdateMyKycDto
        {
            [Required(ErrorMessage = "Vui lòng nhập số CCCD/CMND.")]
            public string IdCardNumber { get; set; } = null!;

            [Required(ErrorMessage = "Vui lòng nhập số Giấy phép lái xe.")]
            public string DriverLicenseNumber { get; set; } = null!;

            public string DriverLicenseClass { get; set; } = "B2";

            public string? DriverLicenseExpiry { get; set; }

            public string? IdCardFrontUrl { get; set; }
            public string? IdCardBackUrl { get; set; }
            public string? DriverLicenseFrontUrl { get; set; }
            public string? DriverLicenseBackUrl { get; set; }
        }

        public class CustomerDocumentDto
        {
            public string Id { get; set; } = null!;
            public string Type { get; set; } = null!; // CONTRACT, HANDOVER_PROTOCOL, RETURN_PROTOCOL, SETTLEMENT_RECEIPT
            public string TypeName { get; set; } = null!;
            public string Title { get; set; } = null!;
            public string VehicleName { get; set; } = null!;
            public string LicensePlate { get; set; } = null!;
            public string SignedDate { get; set; } = null!;
            public string Status { get; set; } = null!;
            public string StatusLabel { get; set; } = null!;
            public string FileSize { get; set; } = "1.5 MB";
            public bool IsDownloadable { get; set; } = true;
        }

        public class CustomerTransactionDto
        {
            public string Id { get; set; } = null!;
            public string Type { get; set; } = null!;
            public string Title { get; set; } = null!;
            public string Car { get; set; } = null!;
            public decimal Amount { get; set; }
            public bool IsIncome { get; set; }
            public bool IsCollateralHold { get; set; }
            public string Method { get; set; } = "VietQR Napas 247";
            public string Date { get; set; } = null!;
            public string Status { get; set; } = "SUCCESS";
            public string StatusLabel { get; set; } = "Thành công";
            public string? HoldNote { get; set; }
            public string RefNo { get; set; } = null!;
        }

        private static string MaskPhone(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw) || raw.Length < 7)
                return string.IsNullOrWhiteSpace(raw) ? "Chưa cập nhật" : raw;
            return $"{raw[..4]} *** {raw[^3..]}";
        }

        private static string MaskDoc(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw) || raw.Length < 8)
                return string.IsNullOrWhiteSpace(raw) ? "Chưa cập nhật" : raw;
            return $"{raw[..4]} **** {raw[^4..]}";
        }

        [HttpGet]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> GetCustomers(
            [FromQuery] string? search,
            [FromQuery] string? tier,
            [FromQuery] string? kycStatus,
            [FromQuery] string? status,
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null)
        {
            // Query 100% directly from PostgreSQL app_users
            var customerUsers = await _context.Users
                .AsNoTracking()
                .Where(u => u.Role == "CUSTOMER")
                .Include(u => u.Violations)
                .Include(u => u.AdditionalDrivers)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            // Load all rental requests with vehicles to compute customer metrics
            var allRequests = await _context.RentalRequests
                .AsNoTracking()
                .Include(r => r.Vehicle)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var requestsByEmail = allRequests
                .Where(r => !string.IsNullOrWhiteSpace(r.CustomerEmail))
                .GroupBy(r => r.CustomerEmail.Trim().ToLowerInvariant())
                .ToDictionary(g => g.Key, g => g.ToList());

            var customerList = new List<CustomerAdminSummaryDto>();

            foreach (var dbUser in customerUsers)
            {
                var normEmail = dbUser.Email.Trim().ToLowerInvariant();
                requestsByEmail.TryGetValue(normEmail, out var userReqs);
                userReqs ??= new List<RentalRequest>();
                var latestReq = userReqs.FirstOrDefault();

                var rawPhone = !string.IsNullOrWhiteSpace(dbUser.PhoneNumber)
                    ? dbUser.PhoneNumber
                    : (latestReq?.CustomerPhone ?? "Chưa cập nhật");
                
                var rawIdCard = !string.IsNullOrWhiteSpace(dbUser.IdCardNumber)
                    ? dbUser.IdCardNumber
                    : (latestReq?.CustomerIdCard ?? "Chưa cập nhật");

                var rawLicense = !string.IsNullOrWhiteSpace(dbUser.DriverLicenseNumber)
                    ? dbUser.DriverLicenseNumber
                    : (latestReq?.DriverLicenseNumber ?? "Chưa cập nhật");

                var licenseClass = !string.IsNullOrWhiteSpace(dbUser.DriverLicenseClass)
                    ? dbUser.DriverLicenseClass
                    : (latestReq?.DriverLicenseClass ?? "B2");

                var licenseExpiryDateObj = dbUser.DriverLicenseExpiry ?? latestReq?.DriverLicenseExpiry;
                var licenseExpiryDate = licenseExpiryDateObj?.ToString("dd/MM/yyyy") ?? "Chưa cập nhật";
                var isLicenseNearExpiry = licenseExpiryDateObj.HasValue && licenseExpiryDateObj.Value <= DateTime.UtcNow.AddDays(30);

                var userBookingCount = userReqs.Count;
                var completedCount = userReqs.Count(r => r.Status == "COMPLETED");
                var activeCount = userReqs.Count(r => r.Status == "ACTIVE" || r.Status == "CONFIRMED" || r.Status == "SIGNED" || r.Status == "HOLDING");
                var cancelledCount = userReqs.Count(r => r.Status == "CANCELLED" || r.Status == "REJECTED");
                var totalSpent = userReqs.Where(r => r.Status == "COMPLETED" || r.Status == "ACTIVE").Sum(r => r.EstimatedTotalFee);
                var escrowDeposit = userReqs.Where(r => r.Status == "ACTIVE" || r.Status == "CONFIRMED" || r.Status == "SIGNED").Sum(r => r.DepositAmount);

                var tierCalculated = userBookingCount >= 10 ? "Platinum" : (userBookingCount >= 4 ? "Gold" : "Silver");
                var currentKycStatus = dbUser.KycStatus ?? (!string.IsNullOrWhiteSpace(rawIdCard) && rawIdCard != "Chưa cập nhật" ? "VERIFIED" : "PENDING");

                var violations = dbUser.Violations.OrderByDescending(v => v.CreatedAt).Select(v => new ViolationLogDto
                {
                    Id = v.Id.ToString(),
                    Date = v.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                    Type = v.Type,
                    PointsChange = v.PointsChange,
                    Reason = v.Reason,
                    Officer = v.Officer
                }).ToList();

                var additionalDrivers = dbUser.AdditionalDrivers.Select(ad => new AdditionalDriverItemDto
                {
                    Id = ad.Id.ToString(),
                    FullName = ad.FullName,
                    Phone = ad.PhoneNumber,
                    IdCard = ad.IdCardNumber ?? "Chưa cập nhật",
                    LicenseNumber = ad.LicenseNumber ?? "Chưa cập nhật",
                    LicenseClass = ad.LicenseClass ?? "B2",
                    ExpiryDate = ad.LicenseExpiry?.ToString("dd/MM/yyyy") ?? "Chưa cập nhật",
                    Status = ad.Status
                }).ToList();

                var recentBookings = userReqs.Take(5).Select(r => new CustomerBookingItemDto
                {
                    BookingId = r.Id.ToString()[..8].ToUpperInvariant(),
                    CarName = r.Vehicle != null ? $"{r.Vehicle.Make} {r.Vehicle.Model}" : "Xe VELORA",
                    LicensePlate = r.Vehicle?.LicensePlate ?? "N/A",
                    Dates = $"{r.StartTime:dd/MM/yyyy} - {r.EndTime:dd/MM/yyyy}",
                    TotalFee = r.EstimatedTotalFee,
                    DepositAmount = r.DepositAmount,
                    Status = r.Status,
                    StatusLabel = r.Status switch
                    {
                        "ACTIVE" => "Đang lưu hành",
                        "COMPLETED" => "Hoàn tất",
                        "CONFIRMED" => "Đã xác nhận",
                        "SIGNED" => "Đã ký HĐ",
                        "PENDING" => "Chờ duyệt",
                        "HOLDING" => "Giữ chỗ 500K",
                        _ => r.Status
                    }
                }).ToList();

                var dto = new CustomerAdminSummaryDto
                {
                    Id = dbUser.Id.ToString(),
                    FullName = dbUser.FullName,
                    Email = dbUser.Email,
                    RawPhone = rawPhone,
                    MaskedPhone = MaskPhone(rawPhone),
                    RawIdCard = rawIdCard,
                    MaskedIdCard = MaskDoc(rawIdCard),
                    RawLicenseNumber = rawLicense,
                    MaskedLicenseNumber = MaskDoc(rawLicense),
                    LicenseClass = licenseClass,
                    LicenseExpiryDate = licenseExpiryDate,
                    IsLicenseNearExpiry = isLicenseNearExpiry,
                    MembershipTier = tierCalculated,
                    TrustScore = dbUser.TrustScore,
                    KycStatus = currentKycStatus,
                    AccountStatus = dbUser.IsActive ? "ACTIVE" : "SUSPENDED",
                    TotalBookings = userBookingCount,
                    CompletedBookings = completedCount,
                    ActiveBookings = activeCount,
                    CancelledBookings = cancelledCount,
                    TotalSpent = totalSpent,
                    EscrowDepositAmount = escrowDeposit,
                    CreatedAt = dbUser.CreatedAt,
                    LastBookingDate = latestReq?.CreatedAt,
                    InternalStaffNotes = !dbUser.IsActive && !string.IsNullOrWhiteSpace(dbUser.LockReason)
                        ? $"Lý do tạm khóa: {dbUser.LockReason}"
                        : (!string.IsNullOrWhiteSpace(dbUser.KycNote) ? $"Ghi chú KYC: {dbUser.KycNote}" : "Tài khoản khách hàng xác thực trên cơ sở dữ liệu VELORA."),
                    IdCardFrontUrl = dbUser.IdCardFrontUrl ?? latestReq?.IdCardFrontUrl ?? "",
                    IdCardBackUrl = dbUser.IdCardBackUrl ?? latestReq?.IdCardBackUrl ?? "",
                    DriverLicenseFrontUrl = dbUser.DriverLicenseFrontUrl ?? latestReq?.DriverLicenseFrontUrl ?? "",
                    DriverLicenseBackUrl = dbUser.DriverLicenseBackUrl ?? latestReq?.DriverLicenseBackUrl ?? "",
                    ViolationsHistory = violations,
                    RecentBookings = recentBookings,
                    AdditionalDrivers = additionalDrivers
                };

                customerList.Add(dto);
            }

            var query = customerList.AsEnumerable();

            // Search Filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var kw = search.Trim().ToLowerInvariant();
                query = query.Where(c =>
                    c.FullName.ToLowerInvariant().Contains(kw) ||
                    c.Email.ToLowerInvariant().Contains(kw) ||
                    c.Id.ToLowerInvariant().Contains(kw) ||
                    c.RawPhone.Contains(kw)
                );
            }

            // Tier Filter
            if (!string.IsNullOrWhiteSpace(tier) && tier != "ALL")
            {
                query = query.Where(c => c.MembershipTier.Equals(tier, StringComparison.OrdinalIgnoreCase));
            }

            // KYC Filter
            if (!string.IsNullOrWhiteSpace(kycStatus) && kycStatus != "ALL")
            {
                query = query.Where(c => c.KycStatus.Equals(kycStatus, StringComparison.OrdinalIgnoreCase));
            }

            // Status Filter
            if (!string.IsNullOrWhiteSpace(status) && status != "ALL")
            {
                query = query.Where(c => c.AccountStatus.Equals(status, StringComparison.OrdinalIgnoreCase));
            }

            var allFiltered = query.OrderByDescending(c => c.TotalBookings).ToList();
            int totalCount = allFiltered.Count;
            int p = Math.Max(1, page ?? 1);
            int ps = pageSize.HasValue ? Math.Clamp(pageSize.Value, 1, 100) : (page.HasValue ? 20 : totalCount);
            var pagedCustomers = allFiltered.Skip((p - 1) * ps).Take(ps).ToList();

            // Tự động sinh Signed URL có thời hạn cho giấy tờ nhạy cảm của các khách hàng được phân trang
            foreach (var c in pagedCustomers)
            {
                c.IdCardFrontUrl = await _storageService.ResolveDocUrlAsync(c.IdCardFrontUrl, "sensitive-docs", 15);
                c.IdCardBackUrl = await _storageService.ResolveDocUrlAsync(c.IdCardBackUrl, "sensitive-docs", 15);
                c.DriverLicenseFrontUrl = await _storageService.ResolveDocUrlAsync(c.DriverLicenseFrontUrl, "sensitive-docs", 15);
                c.DriverLicenseBackUrl = await _storageService.ResolveDocUrlAsync(c.DriverLicenseBackUrl, "sensitive-docs", 15);
            }

            return Ok(new PagedResultDto<CustomerAdminSummaryDto>(pagedCustomers, totalCount, p, ps));
        }

        [HttpPut("{id}/toggle-status")]
        [HttpPut("{id}/status")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> ToggleCustomerStatus(string id, [FromBody] ToggleCustomerStatusDto dto)
        {
            if (!Guid.TryParse(id, out var userGuid))
            {
                return BadRequest(new { Message = "ID khách hàng không hợp lệ." });
            }

            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userGuid);
            if (targetUser == null)
            {
                return NotFound(new { Message = "Không tìm thấy thông tin tài khoản khách hàng." });
            }

            bool isSuspending = string.Equals(dto.Status, "SUSPENDED", StringComparison.OrdinalIgnoreCase);

            targetUser.IsActive = !isSuspending;
            targetUser.LockReason = isSuspending
                ? (string.IsNullOrWhiteSpace(dto.Reason) ? "Vi phạm quy định vận hành VELORA" : dto.Reason.Trim())
                : null;
            targetUser.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Invalidate/update cache immediately to block/unblock requests in real time
            UserStatusCache.SetStatus(_cache, targetUser.Id, targetUser.IsActive, targetUser.LockReason);

            return Ok(new
            {
                Success = true,
                Message = $"Đã cập nhật trạng thái tài khoản thành công sang {dto.Status}.",
                Status = dto.Status,
                Reason = dto.Reason,
                PersistedToDatabase = true
            });
        }

        [HttpPut("{id}/kyc-status")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> UpdateKycStatus(string id, [FromBody] UpdateKycStatusDto dto)
        {
            if (!Guid.TryParse(id, out var userGuid))
            {
                return BadRequest(new { Message = "ID khách hàng không hợp lệ." });
            }

            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userGuid);
            if (targetUser == null)
            {
                return NotFound(new { Message = "Không tìm thấy thông tin tài khoản khách hàng." });
            }

            targetUser.KycStatus = dto.KycStatus;
            targetUser.KycReviewedAt = DateTime.UtcNow;
            targetUser.KycNote = dto.RejectReason;
            targetUser.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = dto.KycStatus == "VERIFIED" 
                    ? "Hồ sơ KYC đã được phê duyệt hợp lệ!" 
                    : $"Đã gửi yêu cầu cập nhật lại hồ sơ KYC: {dto.RejectReason}",
                KycStatus = dto.KycStatus
            });
        }

        [HttpPost("{id}/violations")]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> AddViolation(string id, [FromBody] AddViolationDto dto)
        {
            if (!Guid.TryParse(id, out var userGuid))
            {
                return BadRequest(new { Message = "ID khách hàng không hợp lệ." });
            }

            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userGuid);
            if (targetUser == null)
            {
                return NotFound(new { Message = "Không tìm thấy thông tin tài khoản khách hàng." });
            }

            var violation = new CustomerViolation
            {
                Id = Guid.NewGuid(),
                UserId = targetUser.Id,
                Type = dto.Type,
                PointsChange = dto.PointsAdjustment,
                Reason = dto.Notes,
                Officer = "Trưởng ca Vận hành",
                CreatedAt = DateTime.UtcNow
            };

            _context.CustomerViolations.Add(violation);
            targetUser.TrustScore = Math.Clamp(targetUser.TrustScore + dto.PointsAdjustment, 0, 100);
            targetUser.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var responseDto = new ViolationLogDto
            {
                Id = violation.Id.ToString(),
                Date = violation.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                Type = violation.Type,
                PointsChange = violation.PointsChange,
                Reason = violation.Reason,
                Officer = violation.Officer
            };

            return Ok(new
            {
                Success = true,
                Message = "Đã ghi nhận biên bản và điều chỉnh điểm tín nhiệm thành công.",
                Violation = responseDto
            });
        }

        // CUSTOMER PORTAL APIs (Authenticated via JWT)

        [HttpGet("my-documents")]
        [Authorize]
        public async Task<IActionResult> GetMyDocuments()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(new { Message = "Không thể xác định danh tính người dùng." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null) return NotFound(new { Message = "Không tìm thấy người dùng." });

            var normEmail = user.Email.Trim().ToLower();

            // Find all rental requests for this customer
            var requests = await _context.RentalRequests
                .AsNoTracking()
                .Include(r => r.Vehicle)
                .Where(r => r.CustomerEmail.ToLower() == normEmail)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var requestIds = requests.Select(r => r.Id).ToList();

            var contracts = await _context.RentalContracts
                .AsNoTracking()
                .Where(c => c.RequestId.HasValue && requestIds.Contains(c.RequestId.Value))
                .ToListAsync();

            var handovers = await _context.HandoverProtocols
                .AsNoTracking()
                .Where(h => h.RentalRequestId.HasValue && requestIds.Contains(h.RentalRequestId.Value))
                .ToListAsync();

            var returns = await _context.ReturnProtocols
                .AsNoTracking()
                .Where(r => r.RentalRequestId.HasValue && requestIds.Contains(r.RentalRequestId.Value))
                .ToListAsync();

            var settlements = await _context.RentalSettlements
                .AsNoTracking()
                .Where(s => s.RentalRequestId.HasValue && requestIds.Contains(s.RentalRequestId.Value))
                .ToListAsync();

            var docs = new List<CustomerDocumentDto>();

            // 1. Contracts
            foreach (var contract in contracts)
            {
                var req = requests.FirstOrDefault(r => r.Id == contract.RequestId);
                var carName = req?.Vehicle != null ? $"{req.Vehicle.Make} {req.Vehicle.Model}" : "Xe VELORA";
                var plate = req?.Vehicle?.LicensePlate ?? "N/A";

                docs.Add(new CustomerDocumentDto
                {
                    Id = contract.ContractNumber,
                    Type = "CONTRACT",
                    TypeName = "Hợp đồng thuê xe tự lái điện tử",
                    Title = $"Hợp đồng nguyên tắc & điều khoản giao xe {carName}",
                    VehicleName = carName,
                    LicensePlate = plate,
                    SignedDate = (contract.CustomerSignedAt ?? contract.CreatedAt ?? DateTime.UtcNow).ToString("dd/MM/yyyy"),
                    Status = contract.Status == "ACTIVE" || contract.Status == "COMPLETED" ? "SIGNED_VALID" : "PENDING_SIGN",
                    StatusLabel = contract.Status == "ACTIVE" || contract.Status == "COMPLETED" ? "Ký số hợp lệ" : "Chờ ký số",
                    FileSize = "1.4 MB",
                    IsDownloadable = true
                });
            }

            // 2. Handover Protocols
            foreach (var ho in handovers)
            {
                var req = requests.FirstOrDefault(r => r.Id == ho.RentalRequestId);
                var carName = req?.Vehicle != null ? $"{req.Vehicle.Make} {req.Vehicle.Model}" : "Xe VELORA";
                var plate = req?.Vehicle?.LicensePlate ?? "N/A";

                docs.Add(new CustomerDocumentDto
                {
                    Id = ho.ProtocolNumber,
                    Type = "HANDOVER_PROTOCOL",
                    TypeName = "Biên bản giao xe (Handover Out)",
                    Title = $"Biên bản bàn giao xe thực tế {carName}",
                    VehicleName = carName,
                    LicensePlate = plate,
                    SignedDate = ho.HandoverDate.ToString("dd/MM/yyyy"),
                    Status = "VERIFIED",
                    StatusLabel = "Giao xe (Handover Out)",
                    FileSize = "2.8 MB",
                    IsDownloadable = true
                });
            }

            // 3. Return Protocols
            foreach (var rt in returns)
            {
                var req = requests.FirstOrDefault(r => r.Id == rt.RentalRequestId);
                var carName = req?.Vehicle != null ? $"{req.Vehicle.Make} {req.Vehicle.Model}" : "Xe VELORA";
                var plate = req?.Vehicle?.LicensePlate ?? "N/A";

                docs.Add(new CustomerDocumentDto
                {
                    Id = rt.ProtocolNumber,
                    Type = "RETURN_PROTOCOL",
                    TypeName = "Biên bản nhận lại xe (Return In)",
                    Title = $"Biên bản nhận lại xe & kiểm tra tình trạng {carName}",
                    VehicleName = carName,
                    LicensePlate = plate,
                    SignedDate = rt.ReturnDate.ToString("dd/MM/yyyy"),
                    Status = "COMPLETED",
                    StatusLabel = "Nhận lại xe (Return In)",
                    FileSize = "3.1 MB",
                    IsDownloadable = true
                });
            }

            // 4. Settlement Receipts
            foreach (var st in settlements)
            {
                var req = requests.FirstOrDefault(r => r.Id == st.RentalRequestId);
                var carName = req?.Vehicle != null ? $"{req.Vehicle.Make} {req.Vehicle.Model}" : "Xe VELORA";
                var plate = req?.Vehicle?.LicensePlate ?? "N/A";

                docs.Add(new CustomerDocumentDto
                {
                    Id = st.SettlementNumber,
                    Type = "SETTLEMENT_RECEIPT",
                    TypeName = "Phiếu quyết toán & hoàn tiền cọc",
                    Title = $"Biên bản thanh lý hợp đồng & quyết toán cọc thế chân {carName}",
                    VehicleName = carName,
                    LicensePlate = plate,
                    SignedDate = (st.SettledAt ?? st.CreatedAt ?? DateTime.UtcNow).ToString("dd/MM/yyyy"),
                    Status = st.RefundStatus == "COMPLETED" || st.RefundStatus == "NOT_APPLICABLE" ? "REFUNDED" : "PROCESSING",
                    StatusLabel = st.RefundStatus == "COMPLETED" || st.RefundStatus == "NOT_APPLICABLE" ? "Đã quyết toán" : "Đang xử lý hoàn cọc",
                    FileSize = "890 KB",
                    IsDownloadable = true
                });
            }

            return Ok(docs);
        }

        [HttpGet("my-ledger")]
        [Authorize]
        public async Task<IActionResult> GetMyLedger()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(new { Message = "Không thể xác định danh tính người dùng." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null) return NotFound(new { Message = "Không tìm thấy người dùng." });

            var normEmail = user.Email.Trim().ToLower();

            // Find all rental requests for this customer
            var requests = await _context.RentalRequests
                .AsNoTracking()
                .Include(r => r.Vehicle)
                .Where(r => r.CustomerEmail.ToLower() == normEmail)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var requestIds = requests.Select(r => r.Id).ToList();

            var payments = await _context.Payments
                .AsNoTracking()
                .Where(p => p.RentalRequestId.HasValue && requestIds.Contains(p.RentalRequestId.Value))
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var settlements = await _context.RentalSettlements
                .AsNoTracking()
                .Where(s => s.RentalRequestId.HasValue && requestIds.Contains(s.RentalRequestId.Value))
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var transactions = new List<CustomerTransactionDto>();

            foreach (var p in payments)
            {
                var req = requests.FirstOrDefault(r => r.Id == p.RentalRequestId);
                var carName = req?.Vehicle != null ? $"{req.Vehicle.Make} {req.Vehicle.Model} ({req.Vehicle.LicensePlate})" : "Xe VELORA";

                string type = p.Type;
                string title = p.Type switch
                {
                    "HOLD_DEPOSIT" => "Cọc giữ xe siêu tốc 500k (Fast Hold)",
                    "RENTAL_PAYMENT" => "Thanh toán tiền thuê xe",
                    "DEPOSIT_COLLATERAL" => "Đặt cọc thế chân bàn giao xe",
                    "DEPOSIT_REFUND" => "Hoàn trả tiền cọc thế chân xe",
                    _ => p.Type
                };

                bool isIncome = p.Type == "DEPOSIT_REFUND";
                bool isCollateralHold = p.Type == "DEPOSIT_COLLATERAL" && p.Status == "COMPLETED";

                transactions.Add(new CustomerTransactionDto
                {
                    Id = p.TransactionCode ?? $"TX-{p.Id.ToString()[..8].ToUpper()}",
                    Type = type,
                    Title = title,
                    Car = carName,
                    Amount = p.Amount,
                    IsIncome = isIncome,
                    IsCollateralHold = isCollateralHold,
                    Method = p.PaymentMethod == "CASH" ? "Tiền mặt tại điểm bàn giao" : "VietQR Napas 247",
                    Date = (p.CreatedAt ?? DateTime.UtcNow).ToString("dd/MM/yyyy HH:mm"),
                    Status = p.Status,
                    StatusLabel = p.Status == "COMPLETED" ? (isCollateralHold ? "Đang giữ cọc" : "Thành công") : p.Status,
                    HoldNote = isCollateralHold ? "Dự kiến giải tỏa sau 14 ngày đối soát phạt nguội" : null,
                    RefNo = p.TransactionCode ?? p.Id.ToString()[..12].ToUpper()
                });
            }

            foreach (var st in settlements)
            {
                if (st.RefundAmount > 0)
                {
                    var req = requests.FirstOrDefault(r => r.Id == st.RentalRequestId);
                    var carName = req?.Vehicle != null ? $"{req.Vehicle.Make} {req.Vehicle.Model} ({req.Vehicle.LicensePlate})" : "Xe VELORA";

                    transactions.Add(new CustomerTransactionDto
                    {
                        Id = st.SettlementNumber,
                        Type = "DEPOSIT_REFUND",
                        Title = $"Hoàn trả tiền cọc sau quyết toán đơn {st.SettlementNumber}",
                        Car = carName,
                        Amount = st.RefundAmount,
                        IsIncome = true,
                        IsCollateralHold = false,
                        Method = "VietQR Napas 247 Hoàn cọc tự động",
                        Date = (st.SettledAt ?? st.CreatedAt ?? DateTime.UtcNow).ToString("dd/MM/yyyy HH:mm"),
                        Status = st.RefundStatus == "COMPLETED" ? "REFUNDED" : "PENDING",
                        StatusLabel = st.RefundStatus == "COMPLETED" ? "Đã hoàn cọc" : "Đang chờ hoàn cọc",
                        RefNo = st.SettlementNumber
                    });
                }
            }

            return Ok(transactions.OrderByDescending(t => t.Date).ToList());
        }

        [HttpPut("me/kyc")]
        [Authorize]
        public async Task<IActionResult> UpdateMyKyc([FromBody] UpdateMyKycDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(new { Message = "Không thể xác định danh tính người dùng." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null) return NotFound(new { Message = "Không tìm thấy người dùng." });

            DateTime? expiry = null;
            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseExpiry) && DateTime.TryParse(dto.DriverLicenseExpiry, out var parsedExpiry))
            {
                expiry = DateTime.SpecifyKind(parsedExpiry, DateTimeKind.Utc);
            }

            user.IdCardNumber = dto.IdCardNumber.Trim();
            user.DriverLicenseNumber = dto.DriverLicenseNumber.Trim();
            user.DriverLicenseClass = dto.DriverLicenseClass?.Trim() ?? "B2";
            user.DriverLicenseExpiry = expiry ?? user.DriverLicenseExpiry;
            if (!string.IsNullOrWhiteSpace(dto.IdCardFrontUrl))
            {
                user.IdCardFrontUrl = dto.IdCardFrontUrl.StartsWith("data:image/") || dto.IdCardFrontUrl.Length > 256
                    ? await _storageService.UploadBase64Async(dto.IdCardFrontUrl, "sensitive-docs", "kyc", $"cccd_front_{user.Id}")
                    : dto.IdCardFrontUrl;
            }
            if (!string.IsNullOrWhiteSpace(dto.IdCardBackUrl))
            {
                user.IdCardBackUrl = dto.IdCardBackUrl.StartsWith("data:image/") || dto.IdCardBackUrl.Length > 256
                    ? await _storageService.UploadBase64Async(dto.IdCardBackUrl, "sensitive-docs", "kyc", $"cccd_back_{user.Id}")
                    : dto.IdCardBackUrl;
            }
            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseFrontUrl))
            {
                user.DriverLicenseFrontUrl = dto.DriverLicenseFrontUrl.StartsWith("data:image/") || dto.DriverLicenseFrontUrl.Length > 256
                    ? await _storageService.UploadBase64Async(dto.DriverLicenseFrontUrl, "sensitive-docs", "kyc", $"gplx_front_{user.Id}")
                    : dto.DriverLicenseFrontUrl;
            }
            if (!string.IsNullOrWhiteSpace(dto.DriverLicenseBackUrl))
            {
                user.DriverLicenseBackUrl = dto.DriverLicenseBackUrl.StartsWith("data:image/") || dto.DriverLicenseBackUrl.Length > 256
                    ? await _storageService.UploadBase64Async(dto.DriverLicenseBackUrl, "sensitive-docs", "kyc", $"gplx_back_{user.Id}")
                    : dto.DriverLicenseBackUrl;
            }

            user.KycStatus = "PENDING"; // Send to operations team for review
            user.KycReviewedAt = null;
            user.KycNote = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Success = true,
                Message = "Đã cập nhật hồ sơ KYC thành công. Hồ sơ đang được chuyển tới Ban Thẩm định VELORA.",
                User = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.PhoneNumber,
                    user.IdCardNumber,
                    user.DriverLicenseNumber,
                    user.DriverLicenseClass,
                    user.DriverLicenseExpiry,
                    user.KycStatus
                }
            });
        }
    }
}
