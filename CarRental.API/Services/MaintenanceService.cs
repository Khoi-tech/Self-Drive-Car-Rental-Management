using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Maintenance;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class MaintenanceService : IMaintenanceService
    {
        private readonly AppDbContext _context;

        public MaintenanceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<MaintenanceRecordDto>> GetAllAsync(string? status = null, Guid? carId = null)
        {
            var query = _context.MaintenanceRecords
                .Include(m => m.Vehicle)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
            {
                query = query.Where(m => m.Status == status.ToUpper());
            }

            if (carId.HasValue && carId != Guid.Empty)
            {
                query = query.Where(m => m.CarId == carId.Value);
            }

            var list = await query.OrderByDescending(m => m.ScheduledDate).ToListAsync();
            return list.Select(MapToDto).ToList();
        }

        public async Task<MaintenanceRecordDto?> GetByIdAsync(Guid id)
        {
            var item = await _context.MaintenanceRecords
                .Include(m => m.Vehicle)
                .FirstOrDefaultAsync(m => m.Id == id);

            return item != null ? MapToDto(item) : null;
        }

        public async Task<List<MaintenanceAlertDto>> GetAlertsAsync()
        {
            var vehicles = await _context.Vehicles.Where(v => v.IsActive).ToListAsync();
            var alerts = new List<MaintenanceAlertDto>();
            var now = DateTime.UtcNow;

            foreach (var v in vehicles)
            {
                // Nếu chưa cài đặt mốc bảo dưỡng, tự động đặt mốc mốc bội số 10,000km gần nhất
                int effectiveTargetKm = v.NextMaintenanceMileage ?? ((v.CurrentMileage / 10000 + (v.CurrentMileage % 10000 == 0 ? 0 : 1)) * 10000);
                if (effectiveTargetKm == 0) effectiveTargetKm = 10000;

                int remainingKm = effectiveTargetKm - v.CurrentMileage;
                int? remainingDays = v.NextMaintenanceDate.HasValue ? (int)(v.NextMaintenanceDate.Value.Date - now.Date).TotalDays : null;

                bool kmDue = remainingKm <= 2000; // Cảnh báo khi còn dưới 2,000 km hoặc vượt quá
                bool dateDue = remainingDays.HasValue && remainingDays.Value <= 14;

                if (kmDue || dateDue)
                {
                    string urgency = "NORMAL";
                    string reason = "";

                    if (remainingKm <= 0)
                    {
                        urgency = "CRITICAL";
                        reason = $"Đã vượt định mức bảo dưỡng cấp {effectiveTargetKm:N0} km (vượt {Math.Abs(remainingKm):N0} km)";
                    }
                    else if (remainingDays.HasValue && remainingDays.Value <= 0)
                    {
                        urgency = "CRITICAL";
                        reason = $"Đã quá hạn ngày bảo dưỡng định kỳ ({Math.Abs(remainingDays.Value)} ngày)";
                    }
                    else if (remainingKm <= 800)
                    {
                        urgency = "CRITICAL";
                        reason = $"Chỉ còn {remainingKm:N0} km đến kỳ bảo dưỡng cấp {effectiveTargetKm:N0} km";
                    }
                    else if (remainingDays.HasValue && remainingDays.Value <= 7)
                    {
                        urgency = "WARNING";
                        reason = $"Còn {remainingDays.Value} ngày đến hạn bảo dưỡng";
                    }
                    else
                    {
                        urgency = "WARNING";
                        reason = $"Sắp đến hạn bảo dưỡng cấp {effectiveTargetKm:N0} km (còn {remainingKm:N0} km)";
                    }

                    alerts.Add(new MaintenanceAlertDto
                    {
                        CarId = v.Id,
                        CarMake = v.Make,
                        CarModel = v.Model,
                        CarLicensePlate = v.LicensePlate,
                        CarImageUrl = v.ImageUrl,
                        CarStatus = v.Status.ToString(),
                        CurrentMileage = v.CurrentMileage,
                        NextMaintenanceMileage = effectiveTargetKm,
                        RemainingKmUntilMaintenance = remainingKm,
                        NextMaintenanceDate = v.NextMaintenanceDate,
                        RemainingDaysUntilMaintenance = remainingDays,
                        UrgencyLevel = urgency,
                        AlertReason = reason
                    });
                }
            }

            return alerts.OrderBy(a => a.UrgencyLevel == "CRITICAL" ? 0 : 1).ToList();
        }

        public async Task<MaintenanceRecordDto> CreateAsync(CreateMaintenanceDto dto)
        {
            var vehicle = await _context.Vehicles.FindAsync(dto.CarId);
            if (vehicle == null)
                throw new KeyNotFoundException("Không tìm thấy phương tiện.");

            var code = $"BD-{DateTime.UtcNow:yyMMdd}-{new Random().Next(1000, 9999)}";

            var scheduledDateUtc = dto.ScheduledDate.Kind == DateTimeKind.Utc 
                ? dto.ScheduledDate 
                : DateTime.SpecifyKind(dto.ScheduledDate, DateTimeKind.Utc);

            var record = new MaintenanceRecord
            {
                Id = Guid.NewGuid(),
                MaintenanceCode = code,
                CarId = vehicle.Id,
                MaintenanceType = dto.MaintenanceType.ToUpper(),
                Title = dto.Title.Trim(),
                GarageName = dto.GarageName.Trim(),
                Cost = dto.Cost,
                OdoAtMaintenance = dto.OdoAtMaintenance > 0 ? dto.OdoAtMaintenance : vehicle.CurrentMileage,
                ScheduledDate = scheduledDateUtc,
                Details = dto.Details,
                Status = "SCHEDULED",
                CreatedAt = DateTime.UtcNow
            };

            // Switch vehicle status to MAINTENANCE
            vehicle.Status = VehicleStatus.MAINTENANCE;
            vehicle.UpdatedAt = DateTime.UtcNow;

            _context.MaintenanceRecords.Add(record);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(record.Id))!;
        }

        public async Task<MaintenanceRecordDto> CompleteAsync(Guid id, CompleteMaintenanceDto dto)
        {
            var record = await _context.MaintenanceRecords
                .Include(m => m.Vehicle)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null)
                throw new KeyNotFoundException("Không tìm thấy hồ sơ bảo dưỡng.");

            var completedDateUtc = dto.CompletedDate.Kind == DateTimeKind.Utc 
                ? dto.CompletedDate 
                : DateTime.SpecifyKind(dto.CompletedDate, DateTimeKind.Utc);

            DateTime? nextDateUtc = dto.NextMaintenanceDate.HasValue
                ? (dto.NextMaintenanceDate.Value.Kind == DateTimeKind.Utc ? dto.NextMaintenanceDate.Value : DateTime.SpecifyKind(dto.NextMaintenanceDate.Value, DateTimeKind.Utc))
                : null;

            record.Status = "COMPLETED";
            record.Cost = dto.ActualCost > 0 ? dto.ActualCost : record.Cost;
            record.CompletedDate = completedDateUtc;
            if (!string.IsNullOrWhiteSpace(dto.Details)) record.Details = dto.Details;
            record.NextMaintenanceMileage = dto.NextMaintenanceMileage;
            record.NextMaintenanceDate = nextDateUtc;
            record.UpdatedAt = DateTime.UtcNow;

            // Update Vehicle info and restore to READY
            if (record.Vehicle != null)
            {
                record.Vehicle.NextMaintenanceMileage = dto.NextMaintenanceMileage ?? (record.Vehicle.CurrentMileage + 10000);
                record.Vehicle.NextMaintenanceDate = nextDateUtc ?? DateTime.UtcNow.AddMonths(6);
                record.Vehicle.Status = VehicleStatus.READY; // Xe hoàn thành bảo dưỡng và sẵn sàng
                record.Vehicle.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(record.Id))!;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var record = await _context.MaintenanceRecords.FindAsync(id);
            if (record == null) return false;

            _context.MaintenanceRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }

        private static MaintenanceRecordDto MapToDto(MaintenanceRecord m)
        {
            var car = m.Vehicle;
            return new MaintenanceRecordDto
            {
                Id = m.Id,
                MaintenanceCode = m.MaintenanceCode,
                CarId = m.CarId,
                CarMake = car?.Make,
                CarModel = car?.Model,
                CarLicensePlate = car?.LicensePlate,
                CarImageUrl = car?.ImageUrl,
                CurrentMileage = car?.CurrentMileage ?? 0,
                MaintenanceType = m.MaintenanceType,
                Title = m.Title,
                GarageName = m.GarageName,
                Cost = m.Cost,
                OdoAtMaintenance = m.OdoAtMaintenance,
                ScheduledDate = m.ScheduledDate,
                CompletedDate = m.CompletedDate,
                Details = m.Details,
                NextMaintenanceMileage = m.NextMaintenanceMileage,
                NextMaintenanceDate = m.NextMaintenanceDate,
                Status = m.Status,
                CreatedAt = m.CreatedAt
            };
        }
    }
}
