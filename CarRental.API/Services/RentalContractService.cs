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

        public RentalContractService(AppDbContext context)
        {
            _context = context;
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
                return MapToDto(existingContract, request);
            }

            // If not existing, request must be APPROVED or CONFIRMED
            if (request.Status != "APPROVED" && request.Status != "CONFIRMED")
            {
                throw new InvalidOperationException($"Không thể tạo hợp đồng cho đơn thuê xe ở trạng thái '{request.Status}'. Yêu cầu phải được nhân viên phê duyệt trước.");
            }

            // Load active contract template
            var template = await _context.ContractTemplates
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();

            string rawContent = template?.Content ?? GetDefaultTemplateContent();

            // Format values for placeholder replacement
            string carModel = $"{request.Vehicle.Make} {request.Vehicle.Model} ({request.Vehicle.ManufactureYear})";
            string licensePlate = request.Vehicle.LicensePlate;
            string customerName = request.CustomerName.ToUpper();
            string dailyRateFormatted = request.DailyRate.ToString("N0");
            string depositFormatted = request.DepositAmount.ToString("N0");
            string startDateFormatted = request.StartTime.ToString("dd/MM/yyyy HH:mm");
            string endDateFormatted = request.EndTime.ToString("dd/MM/yyyy HH:mm");
            string pickupLocation = request.PickupLocation;

            string renderedContent = rawContent
                .Replace("{{CustomerName}}", customerName)
                .Replace("{{CarModel}}", carModel)
                .Replace("{{LicensePlate}}", licensePlate)
                .Replace("{{DailyRate}}", dailyRateFormatted)
                .Replace("{{DepositAmount}}", depositFormatted)
                .Replace("{{StartDate}}", startDateFormatted)
                .Replace("{{EndDate}}", endDateFormatted)
                .Replace("{{PickupLocation}}", pickupLocation);

            string contractNumber = $"HD-VELORA-{DateTime.UtcNow:yyyyMMdd}-{request.Id.ToString()[..6].ToUpper()}";

            var contract = new RentalContract
            {
                Id = Guid.NewGuid(),
                RequestId = request.Id,
                RentalRequest = request,
                ContractNumber = contractNumber,
                TotalFee = request.EstimatedTotalFee,
                DepositAmount = request.DepositAmount,
                MaxKm = 300 * request.TotalDays, // Default 300km/day allowance
                Content = renderedContent,
                Status = "WAITING_SIGNATURE",
                CreatedAt = DateTime.UtcNow
            };

            _context.RentalContracts.Add(contract);
            await _context.SaveChangesAsync();

            return MapToDto(contract, request);
        }

        public async Task<RentalContractDto?> GetContractByIdAsync(Guid contractId)
        {
            var contract = await _context.RentalContracts
                .Include(c => c.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(c => c.Id == contractId);

            if (contract == null) return null;

            return MapToDto(contract, contract.RentalRequest);
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

            contract.CustomerSignature = dto.Signature.Trim();
            contract.CustomerSignedAt = DateTime.UtcNow;
            contract.Status = "SIGNED";
            contract.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(contract, contract.RentalRequest);
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
            return list.Select(c => MapToDto(c, c.RentalRequest)).ToList();
        }

        private RentalContractDto MapToDto(RentalContract contract, RentalRequest? request)
        {
            return new RentalContractDto
            {
                Id = contract.Id,
                RequestId = contract.RequestId,
                ContractNumber = contract.ContractNumber ?? $"HD-{contract.Id.ToString()[..8].ToUpper()}",
                TotalFee = contract.TotalFee,
                DepositAmount = contract.DepositAmount,
                MaxKm = contract.MaxKm,
                Content = contract.Content ?? string.Empty,
                Status = contract.Status,
                CustomerSignature = contract.CustomerSignature,
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
---o0o---

HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI TIÊU CHUẨN

Hôm nay, ngày ký hợp đồng, các bên gồm:

BÊN CHO THUÊ (BÊN A): CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA
Hotline: 1900 6868 | Địa chỉ: {{PickupLocation}}

BÊN THUÊ XE (BÊN B):
- Họ tên: {{CustomerName}}
- Phương tiện thuê: {{CarModel}} - Biển kiểm soát: {{LicensePlate}}
- Thời gian thuê: Từ {{StartDate}} đến {{EndDate}}
- Đơn giá: {{DailyRate}} VNĐ/ngày
- Tiền đặt cọc bảo đảm: {{DepositAmount}} VNĐ

Hai bên cùng thống nhất tuân thủ các quy định vận hành và an toàn giao thông đường bộ.";
        }
    }
}
