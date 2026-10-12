using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Incidents;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class IncidentReportService : IIncidentReportService
    {
        private readonly AppDbContext _context;

        public IncidentReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<IncidentReportDto>> GetAllAsync(string? status = null, string? severity = null)
        {
            var query = _context.IncidentReports
                .Include(i => i.RentalRequest)
                .Include(i => i.Vehicle)
                .Include(i => i.ReplacementVehicle)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
            {
                query = query.Where(i => i.Status == status.ToUpper());
            }

            if (!string.IsNullOrWhiteSpace(severity) && severity.ToUpper() != "ALL")
            {
                query = query.Where(i => i.Severity == severity.ToUpper());
            }

            var list = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
            return list.Select(MapToDto).ToList();
        }

        public async Task<IncidentReportDto?> GetByIdAsync(Guid id)
        {
            var item = await _context.IncidentReports
                .Include(i => i.RentalRequest)
                .Include(i => i.Vehicle)
                .Include(i => i.ReplacementVehicle)
                .FirstOrDefaultAsync(i => i.Id == id);

            return item != null ? MapToDto(item) : null;
        }

        public async Task<List<IncidentReportDto>> GetByRequestIdAsync(Guid rentalRequestId)
        {
            var list = await _context.IncidentReports
                .Include(i => i.RentalRequest)
                .Include(i => i.Vehicle)
                .Include(i => i.ReplacementVehicle)
                .Where(i => i.RentalRequestId == rentalRequestId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return list.Select(MapToDto).ToList();
        }

        public async Task<IncidentReportDto> CreateAsync(CreateIncidentReportDto dto)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
                throw new KeyNotFoundException("Không tìm thấy đơn thuê xe.");

            var code = $"SC-{DateTime.UtcNow:yyMMdd}-{new Random().Next(1000, 9999)}";

            var report = new IncidentReport
            {
                Id = Guid.NewGuid(),
                IncidentCode = code,
                RentalRequestId = request.Id,
                CarId = request.CarId,
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                IncidentType = dto.IncidentType.ToUpper(),
                Severity = dto.Severity.ToUpper(),
                Location = dto.Location.Trim(),
                Description = dto.Description.Trim(),
                PhotoUrls = dto.PhotoUrls,
                HasInjuries = dto.HasInjuries,
                Status = "REPORTED",
                CreatedAt = DateTime.UtcNow
            };

            // If severity is HIGH, mark car as needing INSPECTION/REPAIR
            if (dto.Severity.ToUpper() == "HIGH" && request.Vehicle != null)
            {
                request.Vehicle.Status = VehicleStatus.INSPECTION;
                request.Vehicle.UpdatedAt = DateTime.UtcNow;
            }

            _context.IncidentReports.Add(report);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(report.Id))!;
        }

        public async Task<IncidentReportDto> UpdateStatusAsync(Guid id, UpdateIncidentStatusDto dto)
        {
            var report = await _context.IncidentReports.FindAsync(id);
            if (report == null)
                throw new KeyNotFoundException("Không tìm thấy hồ sơ sự cố.");

            report.Status = dto.Status.ToUpper();
            if (!string.IsNullOrWhiteSpace(dto.StaffNotes)) report.StaffNotes = dto.StaffNotes;
            if (!string.IsNullOrWhiteSpace(dto.StaffName)) report.HandledByStaffName = dto.StaffName;

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(report.Id))!;
        }

        public async Task<IncidentReportDto> ResolveAsync(Guid id, ResolveIncidentDto dto)
        {
            var report = await _context.IncidentReports
                .Include(i => i.Vehicle)
                .Include(i => i.RentalRequest)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (report == null)
                throw new KeyNotFoundException("Không tìm thấy hồ sơ sự cố.");

            report.Status = "RESOLVED";
            report.ResolutionAction = dto.ResolutionAction.ToUpper();
            report.ReplacementCarId = dto.ReplacementCarId;
            report.EstimatedDamageCost = dto.EstimatedDamageCost;
            report.InsuranceCoverageStatus = dto.InsuranceCoverageStatus;
            report.CustomerPayAmount = dto.CustomerPayAmount;
            report.CompanyPayAmount = dto.CompanyPayAmount;
            report.StaffNotes = dto.StaffNotes;
            report.HandledByStaffName = dto.StaffName ?? "Nhân viên VELORA";
            report.ResolvedAt = DateTime.UtcNow;

            // Handle replacement car if chosen
            if (dto.ResolutionAction.ToUpper() == "REPLACE_CAR" && dto.ReplacementCarId.HasValue)
            {
                var replCar = await _context.Vehicles.FindAsync(dto.ReplacementCarId.Value);
                if (replCar != null)
                {
                    replCar.Status = VehicleStatus.RENTED;
                    replCar.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Update car status after incident
            if (report.Vehicle != null)
            {
                if (dto.VehicleStatusAfterIncident?.ToUpper() == "REPAIR")
                {
                    report.Vehicle.Status = VehicleStatus.REPAIR;
                }
                else if (dto.VehicleStatusAfterIncident?.ToUpper() == "MAINTENANCE")
                {
                    report.Vehicle.Status = VehicleStatus.MAINTENANCE;
                }
                else
                {
                    // If car still operational
                    report.Vehicle.Status = VehicleStatus.RENTED;
                }
                report.Vehicle.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(report.Id))!;
        }

        private static IncidentReportDto MapToDto(IncidentReport i)
        {
            var car = i.Vehicle;
            var replCar = i.ReplacementVehicle;

            return new IncidentReportDto
            {
                Id = i.Id,
                IncidentCode = i.IncidentCode,
                RentalRequestId = i.RentalRequestId,
                CarId = i.CarId,
                CarMake = car?.Make,
                CarModel = car?.Model,
                CarLicensePlate = car?.LicensePlate,
                CarImageUrl = car?.ImageUrl,
                CustomerId = i.CustomerId,
                CustomerName = i.CustomerName,
                CustomerPhone = i.CustomerPhone,
                IncidentType = i.IncidentType,
                Severity = i.Severity,
                Location = i.Location,
                Description = i.Description,
                PhotoUrls = i.PhotoUrls,
                HasInjuries = i.HasInjuries,
                Status = i.Status,
                ResolutionAction = i.ResolutionAction,
                ReplacementCarId = i.ReplacementCarId,
                ReplacementCarMake = replCar?.Make,
                ReplacementCarModel = replCar?.Model,
                ReplacementCarLicensePlate = replCar?.LicensePlate,
                EstimatedDamageCost = i.EstimatedDamageCost,
                InsuranceCoverageStatus = i.InsuranceCoverageStatus,
                CustomerPayAmount = i.CustomerPayAmount,
                CompanyPayAmount = i.CompanyPayAmount,
                StaffNotes = i.StaffNotes,
                HandledByStaffName = i.HandledByStaffName,
                CreatedAt = i.CreatedAt,
                ResolvedAt = i.ResolvedAt
            };
        }
    }
}
