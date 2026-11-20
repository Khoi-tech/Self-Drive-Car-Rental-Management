using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Contract;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class RentalContractService : IRentalContractService
    {
        private readonly AppDbContext _context;
        private readonly IStorageService _storageService;

        public RentalContractService(AppDbContext context, IStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        public async Task<RentalContractDto> GetOrCreateContractByRequestIdAsync(Guid requestId)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .Include(r => r.AdditionalDrivers)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
            {
                throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
            }

            // Check if contract already exists
            var existingContract = await _context.RentalContracts
                .Include(c => c.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(c => c.RequestId == requestId);

            if (existingContract != null)
            {
                return await MapToDtoAsync(existingContract, request);
            }

            // If not existing, request must be PENDING, APPROVED or CONFIRMED
            if (request.Status != "PENDING" && request.Status != "APPROVED" && request.Status != "CONFIRMED")
            {
                throw new InvalidOperationException($"Không thể tạo hợp đồng cho đơn thuê ở trạng thái '{request.Status}'.");
            }

            // Find an active template or fallback
            var template = await _context.ContractTemplates
                .FirstOrDefaultAsync(t => t.IsActive && (t.TemplateType == "STANDARD" || t.TemplateType == "DAILY"));

            string templateContent = template?.Content ?? GetDefaultTemplateContent();

            // Calculate total km allowance (e.g., 300 km/day)
            int totalDays = Math.Max(1, request.TotalDays);
            int maxKm = totalDays * 300;

            // Generate contract number: HD-{YYYYMMDD}-{XXXX}
            string contractNumber = $"HD-{DateTime.UtcNow:yyyyMMdd}-{request.Id.ToString()[..4].ToUpper()}";

            var contract = new RentalContract
            {
                Id = Guid.NewGuid(),
                RequestId = request.Id,
                ContractNumber = contractNumber,
                TotalFee = request.EstimatedTotalFee,
                DepositAmount = request.DepositAmount,
                MaxKm = maxKm,
                Content = templateContent,
                Status = "WAITING_SIGNATURE",
                CreatedAt = DateTime.UtcNow
            };

            _context.RentalContracts.Add(contract);
            await _context.SaveChangesAsync();

            return await MapToDtoAsync(contract, request);
        }

        public async Task<RentalContractDto?> GetContractByIdAsync(Guid contractId)
        {
            var contract = await _context.RentalContracts
                .Include(c => c.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(c => c.Id == contractId);

            if (contract == null) return null;

            return await MapToDtoAsync(contract, contract.RentalRequest);
        }

        public async Task<RentalContractDto?> GetContractByRequestIdAsync(Guid requestId)
        {
            var contract = await _context.RentalContracts
                .Include(c => c.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(c => c.RequestId == requestId);

            if (contract == null) return null;

            return await MapToDtoAsync(contract, contract.RentalRequest);
        }

        public async Task<RentalContractDto> SignContractAsync(Guid contractId, SignContractRequestDto dto)
        {
            var contract = await _context.RentalContracts
                .Include(c => c.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(c => c.Id == contractId);

            if (contract == null)
            {
                throw new InvalidOperationException("Không tìm thấy hợp đồng thuê xe.");
            }

            if (contract.Status != "WAITING_SIGNATURE")
            {
                throw new InvalidOperationException($"Hợp đồng hiện tại đang ở trạng thái '{contract.Status}', không thể ký lại.");
            }

            var sig = dto.Signature.Trim();
            // Nếu chữ ký gửi lên dạng Base64 -> Upload lên Supabase Storage và chỉ lưu object path vào DB
            if (sig.StartsWith("data:image/") || sig.Length > 256)
            {
                try
                {
                    contract.CustomerSignature = await _storageService.UploadBase64Async(
                        sig,
                        "sensitive-docs",
                        "signatures",
                        $"sig_contract_{contractId}");
                }
                catch
                {
                    contract.CustomerSignature = sig;
                }
            }
            else
            {
                contract.CustomerSignature = sig;
            }

            contract.CustomerSignedAt = DateTime.UtcNow;
            contract.Status = "SIGNED";
            contract.UpdatedAt = DateTime.UtcNow;

            // Đồng bộ trạng thái đơn thuê sang SIGNED hoặc CONFIRMED
            if (contract.RentalRequest != null && (contract.RentalRequest.Status == "APPROVED" || contract.RentalRequest.Status == "PENDING" || contract.RentalRequest.Status == "SIGNED"))
            {
                bool isCashDeposit = string.Equals(contract.RentalRequest.DepositMethod, "CASH", StringComparison.OrdinalIgnoreCase);
                contract.RentalRequest.Status = isCashDeposit ? "CONFIRMED" : "SIGNED";
                contract.RentalRequest.UpdatedAt = DateTime.UtcNow;

                if (isCashDeposit && contract.RentalRequest.Vehicle != null)
                {
                    contract.RentalRequest.Vehicle.Status = VehicleStatus.BOOKED;
                }
            }

            await _context.SaveChangesAsync();

            return await MapToDtoAsync(contract, contract.RentalRequest);
        }

        public async Task<List<RentalContractDto>> GetAllContractsAsync(string? status = null)
        {
            var query = _context.RentalContracts
                .Include(c => c.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(c => c.Status == status);
            }

            var list = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
            var dtoList = new List<RentalContractDto>();
            foreach (var c in list)
            {
                dtoList.Add(await MapToDtoAsync(c, c.RentalRequest));
            }
            return dtoList;
        }

        private async Task<RentalContractDto> MapToDtoAsync(RentalContract contract, RentalRequest? request)
        {
            // Tự động giải quyết chữ ký số: Sinh Signed URL nếu là object path, giữ nguyên nếu là Base64 cũ
            string resolvedSignature = await _storageService.ResolveDocUrlAsync(contract.CustomerSignature, "sensitive-docs", 15);

            return new RentalContractDto
            {
                Id = contract.Id,
                RequestId = contract.RequestId,
                ContractNumber = contract.ContractNumber ?? $"HD-{contract.Id.ToString()[..8].ToUpper()}",
                TotalFee = contract.TotalFee,
                DepositAmount = contract.DepositAmount,
                DepositMethod = request?.DepositMethod ?? "VIETQR",
                MaxKm = contract.MaxKm,
                Content = contract.Content ?? string.Empty,
                Status = contract.Status,
                CustomerSignature = resolvedSignature,
                CustomerSignedAt = contract.CustomerSignedAt,
                CreatedAt = contract.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = contract.UpdatedAt,

                CustomerName = request?.CustomerName,
                CustomerPhone = request?.CustomerPhone,
                CustomerEmail = request?.CustomerEmail,
                CustomerIdCard = request?.CustomerIdCard,
                DriverLicenseNumber = request?.DriverLicenseNumber,
                CarMake = request?.Vehicle?.Make,
                CarModel = request?.Vehicle?.Model,
                CarLicensePlate = request?.Vehicle?.LicensePlate,
                CarImageUrl = request?.Vehicle?.ImageUrl,
                StartTime = request?.StartTime,
                EndTime = request?.EndTime,
                PickupLocation = request?.PickupLocation,
                DropoffLocation = request?.DropoffLocation,
                TotalDays = request?.TotalDays
            };
        }

        private string GetDefaultTemplateContent()
        {
            return @"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---
HỢP ĐỒNG CHO THUÊ XE TỰ LÁI

Hôm nay, ngày ký kết hợp đồng điện tử tại hệ thống VELORA Car Rental.
BÊN CHO THUÊ (BÊN A): CÔNG TY CỔ PHẦN DỊCH VỤ VẬN TẢI VELORA
BÊN THUÊ (BÊN B): Khách hàng đăng ký trên ứng dụng/website VELORA.

ĐIỀU 1: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ
Bên A đồng ý cho Bên B thuê xe theo thông tin chi tiết được ghi nhận trong đơn đặt xe. Thời gian và địa điểm giao nhận xe thực hiện theo thỏa thuận trên hệ thống.

ĐIỀU 2: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN
- Tiền thuê xe và tiền cọc được xác định theo biểu giá niêm yết của Bên A.
- Bên B thanh toán đầy đủ các khoản phí trước khi nhận xe theo đúng quy định.

ĐIỀU 3: QUYỀN VÀ NGHĨA VỤ CỦA CÁC BÊN
- Bên A cam kết xe giao đủ điều kiện an toàn kỹ thuật, bảo hiểm theo quy định pháp luật.
- Bên B cam kết sử dụng xe đúng mục đích, không vi phạm pháp luật giao thông đường bộ, bồi thường mọi tổn thất phát sinh do lỗi của Bên B.

Hai bên đã đọc, hiểu rõ và đồng ý xác nhận ký số điện tử trên hệ thống.";
        }
    }
}
