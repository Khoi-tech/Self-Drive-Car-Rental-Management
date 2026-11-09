using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.Entities;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/customers")]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomersController(AppDbContext context)
        {
            _context = context;
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
            public string LicenseExpiryDate { get; set; } = "11/11/2030";
            public bool IsLicenseNearExpiry { get; set; } = false;

            public string MembershipTier { get; set; } = "Silver";
            public int TrustScore { get; set; } = 100;
            public string KycStatus { get; set; } = "VERIFIED"; // VERIFIED, PENDING, REJECTED
            public string AccountStatus { get; set; } = "ACTIVE"; // ACTIVE, SUSPENDED

            public int TotalBookings { get; set; }
            public int CompletedBookings { get; set; }
            public int ActiveBookings { get; set; } // 0 or 1 for B2C
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

        // In-memory overrides for demo state during session
        private static readonly Dictionary<string, (string Status, string? Reason)> _statusOverrides = new();
        private static readonly Dictionary<string, (string KycStatus, string? Reason)> _kycOverrides = new();
        private static readonly Dictionary<string, List<ViolationLogDto>> _customViolations = new();

        [HttpGet]
        public async Task<IActionResult> GetCustomers(
            [FromQuery] string? search,
            [FromQuery] string? tier,
            [FromQuery] string? kycStatus,
            [FromQuery] string? status)
        {
            // Seed customer base with Vietnamese authentic profiles
            var customerList = GetSeedCustomers();

            // Apply in-memory overrides (e.g. from lock or KYC actions in UI)
            foreach (var c in customerList)
            {
                if (_statusOverrides.TryGetValue(c.Id, out var stat))
                {
                    c.AccountStatus = stat.Status;
                    if (!string.IsNullOrEmpty(stat.Reason))
                        c.InternalStaffNotes = $"Lý do điều chỉnh: {stat.Reason}";
                }

                if (_kycOverrides.TryGetValue(c.Id, out var kyc))
                {
                    c.KycStatus = kyc.KycStatus;
                    if (!string.IsNullOrEmpty(kyc.Reason))
                        c.InternalStaffNotes = $"Lý do KYC: {kyc.Reason}";
                }

                if (_customViolations.TryGetValue(c.Id, out var vios))
                {
                    c.ViolationsHistory.InsertRange(0, vios);
                    c.TrustScore = Math.Max(0, Math.Min(100, c.TrustScore + vios.Sum(v => v.PointsChange)));
                }
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

            return Ok(query.OrderByDescending(c => c.TotalBookings).ToList());
        }

        [HttpPut("{id}/toggle-status")]
        public IActionResult ToggleCustomerStatus(string id, [FromBody] ToggleCustomerStatusDto dto)
        {
            _statusOverrides[id] = (dto.Status, dto.Reason);
            return Ok(new
            {
                Success = true,
                Message = $"Đã cập nhật trạng thái tài khoản thành công sang {dto.Status}.",
                Status = dto.Status,
                Reason = dto.Reason
            });
        }

        [HttpPut("{id}/kyc-status")]
        public IActionResult UpdateKycStatus(string id, [FromBody] UpdateKycStatusDto dto)
        {
            _kycOverrides[id] = (dto.KycStatus, dto.RejectReason);
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
        public IActionResult AddViolation(string id, [FromBody] AddViolationDto dto)
        {
            if (!_customViolations.ContainsKey(id))
            {
                _customViolations[id] = new List<ViolationLogDto>();
            }

            var newLog = new ViolationLogDto
            {
                Date = DateTime.Now.ToString("dd/MM/yyyy HH:mm"),
                Type = dto.Type,
                PointsChange = dto.PointsAdjustment,
                Reason = dto.Notes,
                Officer = "Trưởng ca Vận hành"
            };

            _customViolations[id].Add(newLog);

            return Ok(new
            {
                Success = true,
                Message = "Đã ghi nhận biên bản và điều chỉnh điểm tín nhiệm thành công.",
                Violation = newLog
            });
        }

        private static List<CustomerAdminSummaryDto> GetSeedCustomers()
        {
            return new List<CustomerAdminSummaryDto>
            {
                // Customer 1: Lâm Thành An (Platinum VIP, 100/100, 1 active trip)
                new CustomerAdminSummaryDto
                {
                    Id = "CUST-001-LTA",
                    FullName = "Lâm Thành An",
                    Email = "thanhan.lam@velora.vn",
                    RawPhone = "0913569993",
                    MaskedPhone = "0913 *** 993",
                    RawIdCard = "079092004568",
                    MaskedIdCard = "0790 **** 4568",
                    RawLicenseNumber = "790184920194",
                    MaskedLicenseNumber = "7901 **** 0194",
                    LicenseClass = "B2",
                    LicenseExpiryDate = "24/11/2030",
                    IsLicenseNearExpiry = false,
                    MembershipTier = "Platinum",
                    TrustScore = 100,
                    KycStatus = "VERIFIED",
                    AccountStatus = "ACTIVE",
                    TotalBookings = 12,
                    CompletedBookings = 10,
                    ActiveBookings = 1,
                    CancelledBookings = 1,
                    TotalSpent = 94500000,
                    EscrowDepositAmount = 45000000,
                    CreatedAt = DateTime.UtcNow.AddMonths(-14),
                    LastBookingDate = DateTime.UtcNow.AddDays(-2),
                    InternalStaffNotes = "Khách hàng Thượng đỉnh VELORA Platinum. Hồ sơ thẩm định sinh trắc học chuẩn xác, luôn giữ gìn xe sạch đẹp.",
                    IdCardFrontUrl = "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80",
                    IdCardBackUrl = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
                    DriverLicenseFrontUrl = "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
                    DriverLicenseBackUrl = "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80",
                    ViolationsHistory = new List<ViolationLogDto>
                    {
                        new ViolationLogDto { Date = "01/10/2026 14:00", Type = "KHEN THƯỞNG", PointsChange = 5, Reason = "Hoàn thành 10 chuyến đi an toàn không trầy xước", Officer = "Ban Giám Đốc" },
                        new ViolationLogDto { Date = "15/09/2025 09:30", Type = "KHỞI TẠO", PointsChange = 95, Reason = "Xác minh tài khoản KYC Cấp 2 thành công", Officer = "Hệ thống" }
                    },
                    RecentBookings = new List<CustomerBookingItemDto>
                    {
                        new CustomerBookingItemDto { BookingId = "BK-9021", CarName = "Porsche Taycan 4S", LicensePlate = "30H-999.99", Dates = "08/11/2026 - 11/11/2026", TotalFee = 13500000, DepositAmount = 50000000, Status = "ACTIVE", StatusLabel = "Đang lưu hành" },
                        new CustomerBookingItemDto { BookingId = "BK-8842", CarName = "Mercedes-Benz E300 AMG", LicensePlate = "51K-234.56", Dates = "24/10/2026 - 27/10/2026", TotalFee = 8400000, DepositAmount = 45000000, Status = "COMPLETED", StatusLabel = "Hoàn tất" },
                        new CustomerBookingItemDto { BookingId = "BK-8419", CarName = "BMW 530i M Sport", LicensePlate = "51K-556.78", Dates = "14/10/2026 - 16/10/2026", TotalFee = 5200000, DepositAmount = 45000000, Status = "COMPLETED", StatusLabel = "Hoàn tất" }
                    },
                    AdditionalDrivers = new List<AdditionalDriverItemDto>
                    {
                        new AdditionalDriverItemDto { Id = "DRV-01", FullName = "Trần Thị Bích Ngọc", Phone = "0908 112 334", IdCard = "079194008892", LicenseNumber = "790184492019", LicenseClass = "B1", ExpiryDate = "15/10/2029", Status = "VERIFIED" }
                    }
                },

                // Customer 2: Nguyễn Hoàng Minh (Gold VIP, 100/100, 0 active, 1 upcoming)
                new CustomerAdminSummaryDto
                {
                    Id = "CUST-002-NHM",
                    FullName = "Nguyễn Hoàng Minh",
                    Email = "hoangminh.nguyen@gmail.com",
                    RawPhone = "0908123456",
                    MaskedPhone = "0908 *** 456",
                    RawIdCard = "079194002134",
                    MaskedIdCard = "0791 **** 2134",
                    RawLicenseNumber = "790192304918",
                    MaskedLicenseNumber = "7901 **** 4918",
                    LicenseClass = "B2",
                    LicenseExpiryDate = "15/10/2028",
                    IsLicenseNearExpiry = false,
                    MembershipTier = "Gold",
                    TrustScore = 100,
                    KycStatus = "VERIFIED",
                    AccountStatus = "ACTIVE",
                    TotalBookings = 11,
                    CompletedBookings = 6,
                    ActiveBookings = 0,
                    CancelledBookings = 4,
                    TotalSpent = 48500000,
                    EscrowDepositAmount = 15000000,
                    CreatedAt = DateTime.UtcNow.AddMonths(-11),
                    LastBookingDate = DateTime.UtcNow.AddDays(-1),
                    InternalStaffNotes = "Khách hàng thân thiết Gold Member. Chuẩn bị nhận bàn giao xe BMW 320i M Sport.",
                    IdCardFrontUrl = "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80",
                    IdCardBackUrl = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
                    DriverLicenseFrontUrl = "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
                    DriverLicenseBackUrl = "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80",
                    ViolationsHistory = new List<ViolationLogDto>
                    {
                        new ViolationLogDto { Date = "20/10/2026 10:00", Type = "KHEN THƯỞNG", PointsChange = 5, Reason = "Hoàn thành chuyến thuê đúng hạn", Officer = "Hệ thống" }
                    },
                    RecentBookings = new List<CustomerBookingItemDto>
                    {
                        new CustomerBookingItemDto { BookingId = "BK-9104", CarName = "BMW 320i SportLine", LicensePlate = "51H-888.66", Dates = "10/11/2026 - 13/11/2026", TotalFee = 6300000, DepositAmount = 15000000, Status = "CONFIRMED", StatusLabel = "Sắp nhận xe" }
                    },
                    AdditionalDrivers = new List<AdditionalDriverItemDto>()
                },

                // Customer 3: Đặng Thu Thảo (Minor violation, 75/100, late return history, ACTIVE)
                new CustomerAdminSummaryDto
                {
                    Id = "CUST-003-DTT",
                    FullName = "Đặng Thu Thảo",
                    Email = "thuthao.dang@gmail.com",
                    RawPhone = "0934889922",
                    MaskedPhone = "0934 *** 922",
                    RawIdCard = "079198007621",
                    MaskedIdCard = "0791 **** 7621",
                    RawLicenseNumber = "790184910283",
                    MaskedLicenseNumber = "7901 **** 0283",
                    LicenseClass = "B1",
                    LicenseExpiryDate = "18/04/2029",
                    IsLicenseNearExpiry = false,
                    MembershipTier = "Silver",
                    TrustScore = 75,
                    KycStatus = "VERIFIED",
                    AccountStatus = "ACTIVE",
                    TotalBookings = 4,
                    CompletedBookings = 3,
                    ActiveBookings = 0,
                    CancelledBookings = 1,
                    TotalSpent = 16200000,
                    EscrowDepositAmount = 0,
                    CreatedAt = DateTime.UtcNow.AddMonths(-6),
                    LastBookingDate = DateTime.UtcNow.AddDays(-15),
                    InternalStaffNotes = "Có 1 lần trễ hạn trả xe 2 giờ do kẹt xe cao tốc Long Thành; đã chủ động thông báo và thanh toán phụ phí.",
                    ViolationsHistory = new List<ViolationLogDto>
                    {
                        new ViolationLogDto { Date = "25/10/2026 19:15", Type = "TRỄ HẸN", PointsChange = -15, Reason = "Trả xe quá giờ 2 tiếng chưa gia hạn", Officer = "Nguyễn Văn Hùng (Điều phối)" },
                        new ViolationLogDto { Date = "20/10/2026 08:30", Type = "PHẠT NGUỘI", PointsChange = -10, Reason = "Chờ đối soát vi phạm tốc độ 65/60 km/h", Officer = "Phòng Pháp Chế" }
                    },
                    RecentBookings = new List<CustomerBookingItemDto>
                    {
                        new CustomerBookingItemDto { BookingId = "BK-8712", CarName = "VinFast VF8 Plus", LicensePlate = "51K-912.44", Dates = "23/10/2026 - 25/10/2026", TotalFee = 4600000, DepositAmount = 20000000, Status = "COMPLETED", StatusLabel = "Hoàn tất" }
                    }
                },

                // Customer 4: Vũ Hải Nam (High risk / Suspended, 45/100, SUSPENDED)
                new CustomerAdminSummaryDto
                {
                    Id = "CUST-004-VHN",
                    FullName = "Vũ Hải Nam",
                    Email = "hainam.vu@outlook.com",
                    RawPhone = "0918776655",
                    MaskedPhone = "0918 *** 655",
                    RawIdCard = "079089004312",
                    MaskedIdCard = "0790 **** 4312",
                    RawLicenseNumber = "790176523910",
                    MaskedLicenseNumber = "7901 **** 3910",
                    LicenseClass = "B2",
                    LicenseExpiryDate = "05/01/2027",
                    IsLicenseNearExpiry = false,
                    MembershipTier = "Silver",
                    TrustScore = 45,
                    KycStatus = "VERIFIED",
                    AccountStatus = "SUSPENDED",
                    TotalBookings = 3,
                    CompletedBookings = 1,
                    ActiveBookings = 0,
                    CancelledBookings = 2,
                    TotalSpent = 7800000,
                    EscrowDepositAmount = 0,
                    CreatedAt = DateTime.UtcNow.AddMonths(-4),
                    LastBookingDate = DateTime.UtcNow.AddDays(-28),
                    InternalStaffNotes = "Tạm khóa do có phát sinh va quẹt cản trước chưa chịu quyết toán phụ phí bồi thường.",
                    ViolationsHistory = new List<ViolationLogDto>
                    {
                        new ViolationLogDto { Date = "12/10/2026 16:45", Type = "THIỆT HẠI", PointsChange = -35, Reason = "Trầy xước cản trước không ký biên bản nhận trách nhiệm", Officer = "Lê Thanh Phong (Nghiệm thu)" },
                        new ViolationLogDto { Date = "15/10/2026 09:00", Type = "KHÓA TÀI KHOẢN", PointsChange = -20, Reason = "Quá hạn thanh toán bồi thường 7 ngày", Officer = "Ban Giám Đốc" }
                    },
                    RecentBookings = new List<CustomerBookingItemDto>
                    {
                        new CustomerBookingItemDto { BookingId = "BK-8290", CarName = "Toyota Camry 2.5Q", LicensePlate = "51G-829.11", Dates = "10/10/2026 - 12/10/2026", TotalFee = 3800000, DepositAmount = 15000000, Status = "COMPLETED", StatusLabel = "Tranh chấp" }
                    }
                },

                // Customer 5: Phạm Quốc Hùng (CHỜ DUYỆT KYC - For demo KYC Approval Flow!)
                new CustomerAdminSummaryDto
                {
                    Id = "CUST-005-PQH",
                    FullName = "Phạm Quốc Hùng",
                    Email = "quochung.pham@yahoo.com",
                    RawPhone = "0945112233",
                    MaskedPhone = "0945 *** 233",
                    RawIdCard = "079096008129",
                    MaskedIdCard = "0790 **** 8129",
                    RawLicenseNumber = "790198765432",
                    MaskedLicenseNumber = "7901 **** 5432",
                    LicenseClass = "B2",
                    LicenseExpiryDate = "20/12/2026",
                    IsLicenseNearExpiry = false,
                    MembershipTier = "Silver",
                    TrustScore = 90,
                    KycStatus = "PENDING", // <--- KYC PENDING for Admin Review Demo!
                    AccountStatus = "ACTIVE",
                    TotalBookings = 1,
                    CompletedBookings = 0,
                    ActiveBookings = 0,
                    CancelledBookings = 0,
                    TotalSpent = 0,
                    EscrowDepositAmount = 500000,
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    LastBookingDate = DateTime.UtcNow.AddDays(-1),
                    InternalStaffNotes = "Khách hàng mới tạo đơn cọc 500k cho xe Ford Explorer. Đang chờ duyệt hồ sơ CCCD & GPLX vừa tải lên.",
                    IdCardFrontUrl = "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80",
                    IdCardBackUrl = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
                    DriverLicenseFrontUrl = "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
                    DriverLicenseBackUrl = "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80",
                    ViolationsHistory = new List<ViolationLogDto>
                    {
                        new ViolationLogDto { Date = "08/11/2026 21:00", Type = "KHỞI TẠO", PointsChange = 90, Reason = "Đăng ký tài khoản và nộp hồ sơ KYC", Officer = "Hệ thống" }
                    },
                    RecentBookings = new List<CustomerBookingItemDto>
                    {
                        new CustomerBookingItemDto { BookingId = "BK-9301", CarName = "Ford Explorer Limited", LicensePlate = "51H-772.33", Dates = "15/11/2026 - 18/11/2026", TotalFee = 8900000, DepositAmount = 500000, Status = "PENDING", StatusLabel = "Chờ duyệt hồ sơ" }
                    }
                },

                // Customer 6: Lê Phương Linh (GPLX Sắp hết hạn < 30 ngày demo, Gold, 95/100)
                new CustomerAdminSummaryDto
                {
                    Id = "CUST-006-LPL",
                    FullName = "Lê Phương Linh",
                    Email = "phuonglinh.le@gmail.com",
                    RawPhone = "0977223344",
                    MaskedPhone = "0977 *** 344",
                    RawIdCard = "079195009182",
                    MaskedIdCard = "0791 **** 9182",
                    RawLicenseNumber = "790188223941",
                    MaskedLicenseNumber = "7901 **** 3941",
                    LicenseClass = "B1",
                    LicenseExpiryDate = "25/11/2026", // < 30 days expiry!
                    IsLicenseNearExpiry = true,
                    MembershipTier = "Gold",
                    TrustScore = 95,
                    KycStatus = "VERIFIED",
                    AccountStatus = "ACTIVE",
                    TotalBookings = 7,
                    CompletedBookings = 6,
                    ActiveBookings = 0,
                    CancelledBookings = 1,
                    TotalSpent = 31500000,
                    EscrowDepositAmount = 0,
                    CreatedAt = DateTime.UtcNow.AddMonths(-9),
                    LastBookingDate = DateTime.UtcNow.AddDays(-10),
                    InternalStaffNotes = "GPLX sắp đến ngày hết hạn trong tháng 11/2026. Cần thông báo cập nhật khi đặt chuyến mới.",
                    ViolationsHistory = new List<ViolationLogDto>
                    {
                        new ViolationLogDto { Date = "10/10/2026 11:00", Type = "KHEN THƯỞNG", PointsChange = 5, Reason = "Trả xe sạch sẽ, đúng mực nhiên liệu", Officer = "Hệ thống" }
                    },
                    RecentBookings = new List<CustomerBookingItemDto>
                    {
                        new CustomerBookingItemDto { BookingId = "BK-8611", CarName = "Mazda CX-5 2.5 AWD", LicensePlate = "51K-451.22", Dates = "28/10/2026 - 30/10/2026", TotalFee = 2800000, DepositAmount = 15000000, Status = "COMPLETED", StatusLabel = "Hoàn tất" }
                    }
                }
            };
        }
    }
}
