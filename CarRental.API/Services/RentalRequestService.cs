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

            if (car.Status != VehicleStatus.READY)
            {
                throw new InvalidOperationException("Xe hiện không sẵn sàng để thuê.");
            }

            if (dto.StartTime >= dto.EndTime)
            {
                throw new InvalidOperationException("Thời gian bắt đầu phải trước thời gian kết thúc.");
            }

            // Check for overlaps
            bool hasOverlap = await _context.RentalRequests
                .AnyAsync(r => r.CarId == dto.CarId 
                    && r.Status != "CANCELED" 
                    && r.Status != "REJECTED"
                    && r.StartTime < dto.EndTime 
                    && r.EndTime > dto.StartTime);

            if (hasOverlap)
            {
                throw new InvalidOperationException("Xe đã có người đặt trong thời gian này.");
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
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                PickupLocation = dto.PickupLocation,
                DropoffLocation = dto.DropoffLocation,
                
                CustomerName = dto.CustomerName,
                CustomerPhone = dto.CustomerPhone,
                CustomerEmail = dto.CustomerEmail,
                CustomerIdCard = dto.CustomerIdCard,
                DriverLicenseNumber = dto.DriverLicenseNumber,
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
                    LicenseNumber = d.LicenseNumber
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
                    LicenseNumber = ad.LicenseNumber
                }).ToList() ?? new List<AdditionalDriverDto>()
            };
        }
    }
}
