using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Extensions;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class RentalExtensionService : IRentalExtensionService
    {
        private readonly AppDbContext _context;

        public RentalExtensionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<RentalExtensionDto>> GetAllAsync(string? status = null)
        {
            var query = _context.RentalExtensions
                .Include(e => e.RentalRequest)
                .ThenInclude(r => r!.Vehicle)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
            {
                query = query.Where(e => e.Status == status.ToUpper());
            }

            var list = await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
            var dtos = new List<RentalExtensionDto>();

            foreach (var item in list)
            {
                var dto = MapToDto(item);
                // Optimization: only check schedule conflict for pending extension requests
                dto.HasScheduleConflict = item.Status == "PENDING" 
                    ? await CheckConflictAsync(item.RentalRequestId, item.RentalRequest?.CarId, item.OldEndTime, item.NewEndTime)
                    : false;
                dtos.Add(dto);
            }

            return dtos;
        }

        public async Task<RentalExtensionDto?> GetByIdAsync(Guid id)
        {
            var item = await _context.RentalExtensions
                .Include(e => e.RentalRequest)
                .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (item == null) return null;
            var dto = MapToDto(item);
            dto.HasScheduleConflict = await CheckConflictAsync(item.RentalRequestId, item.RentalRequest?.CarId, item.OldEndTime, item.NewEndTime);
            return dto;
        }

        public async Task<List<RentalExtensionDto>> GetByRequestIdAsync(Guid rentalRequestId)
        {
            var list = await _context.RentalExtensions
                .Include(e => e.RentalRequest)
                .ThenInclude(r => r!.Vehicle)
                .Where(e => e.RentalRequestId == rentalRequestId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return list.Select(MapToDto).ToList();
        }

        public async Task<RentalExtensionDto> CreateAsync(CreateRentalExtensionDto dto)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
                throw new KeyNotFoundException("Không tìm thấy đơn thuê xe.");

            if (request.Status != "ACTIVE" && request.Status != "CONFIRMED")
                throw new InvalidOperationException("Chỉ có thể yêu cầu gia hạn cho các đơn thuê đang hoạt động (ACTIVE hoặc CONFIRMED).");

            if (dto.NewEndTime <= request.EndTime)
                throw new ArgumentException("Thời gian kết thúc mới phải sau thời gian trả xe hiện tại.");

            // Calculate duration
            var extensionSpan = dto.NewEndTime - request.EndTime;
            var totalHours = (int)Math.Ceiling(extensionSpan.TotalHours);
            var extendedDays = (int)Math.Ceiling(extensionSpan.TotalDays);
            if (extendedDays < 1) extendedDays = 1;

            // Calculate additional fee based on daily rate
            var additionalFee = extendedDays * request.DailyRate;

            var newEndTimeUtc = dto.NewEndTime.Kind == DateTimeKind.Utc
                ? dto.NewEndTime
                : DateTime.SpecifyKind(dto.NewEndTime, DateTimeKind.Utc);

            var extension = new RentalExtension
            {
                Id = Guid.NewGuid(),
                RentalRequestId = request.Id,
                OldEndTime = request.EndTime,
                NewEndTime = newEndTimeUtc,
                ExtendedDays = extendedDays,
                ExtendedHours = totalHours,
                AdditionalFee = additionalFee,
                Reason = dto.Reason.Trim(),
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow
            };

            _context.RentalExtensions.Add(extension);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(extension.Id))!;
        }

        public async Task<RentalExtensionDto> ApproveAsync(Guid id, ProcessRentalExtensionDto dto)
        {
            var extension = await _context.RentalExtensions
                .Include(e => e.RentalRequest)
                .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (extension == null)
                throw new KeyNotFoundException("Không tìm thấy yêu cầu gia hạn.");

            if (extension.Status != "PENDING")
                throw new InvalidOperationException("Yêu cầu này đã được xử lý trước đó.");

            var request = extension.RentalRequest;
            if (request == null)
                throw new InvalidOperationException("Không tìm thấy đơn thuê liên kết.");

            // Check if there is conflict with upcoming bookings
            bool hasConflict = await CheckConflictAsync(request.Id, request.CarId, extension.OldEndTime, extension.NewEndTime);
            if (hasConflict)
            {
                throw new InvalidOperationException("Không thể duyệt gia hạn vì xe đã có khách hàng khác đặt trước trong khung giờ này.");
            }

            extension.Status = "APPROVED";
            extension.StaffNotes = dto.StaffNotes;
            extension.ProcessedByStaffName = dto.StaffName ?? "Nhân viên VELORA";
            extension.ProcessedAt = DateTime.UtcNow;

            // Update rental request duration & fee
            request.EndTime = extension.NewEndTime;
            request.TotalDays += extension.ExtendedDays;
            request.EstimatedTotalFee += extension.AdditionalFee;
            request.UpdatedAt = DateTime.UtcNow;

            // Synchronize associated RentalContract if exists
            var contract = await _context.RentalContracts.FirstOrDefaultAsync(c => c.RequestId == request.Id);
            if (contract != null)
            {
                contract.TotalFee += extension.AdditionalFee;
                var dailyKmAllowance = request.Vehicle?.MileageLimit ?? 300;
                contract.MaxKm += extension.ExtendedDays * dailyKmAllowance;
                contract.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(extension.Id))!;
        }

        public async Task<RentalExtensionDto> RejectAsync(Guid id, ProcessRentalExtensionDto dto)
        {
            var extension = await _context.RentalExtensions
                .Include(e => e.RentalRequest)
                .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (extension == null)
                throw new KeyNotFoundException("Không tìm thấy yêu cầu gia hạn.");

            if (extension.Status != "PENDING")
                throw new InvalidOperationException("Yêu cầu này đã được xử lý trước đó.");

            extension.Status = "REJECTED";
            extension.StaffNotes = !string.IsNullOrWhiteSpace(dto.StaffNotes) ? dto.StaffNotes : "Không thể gia hạn theo khung giờ yêu cầu.";
            extension.ProcessedByStaffName = dto.StaffName ?? "Nhân viên VELORA";
            extension.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(extension.Id))!;
        }

        private async Task<bool> CheckConflictAsync(Guid currentRequestId, Guid? carId, DateTime oldEnd, DateTime newEnd)
        {
            if (!carId.HasValue || carId == Guid.Empty) return false;

            return await _context.RentalRequests.AnyAsync(r =>
                r.CarId == carId.Value &&
                r.Id != currentRequestId &&
                r.Status != "REJECTED" &&
                r.Status != "CANCELLED" &&
                r.StartTime < newEnd &&
                r.EndTime > oldEnd);
        }

        private static RentalExtensionDto MapToDto(RentalExtension e)
        {
            var req = e.RentalRequest;
            var car = req?.Vehicle;

            return new RentalExtensionDto
            {
                Id = e.Id,
                RentalRequestId = e.RentalRequestId,
                CustomerName = req?.CustomerName,
                CustomerPhone = req?.CustomerPhone,
                CustomerEmail = req?.CustomerEmail,
                CarId = req?.CarId,
                CarMake = car?.Make,
                CarModel = car?.Model,
                CarLicensePlate = car?.LicensePlate,
                CarImageUrl = car?.ImageUrl,
                DailyRate = req?.DailyRate ?? 0,
                OldEndTime = e.OldEndTime,
                NewEndTime = e.NewEndTime,
                ExtendedDays = e.ExtendedDays,
                ExtendedHours = e.ExtendedHours,
                AdditionalFee = e.AdditionalFee,
                Reason = e.Reason,
                Status = e.Status,
                StaffNotes = e.StaffNotes,
                ProcessedByStaffName = e.ProcessedByStaffName,
                CreatedAt = e.CreatedAt,
                ProcessedAt = e.ProcessedAt
            };
        }
    }
}
