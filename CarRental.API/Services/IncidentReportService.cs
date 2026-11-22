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
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var report = await _context.IncidentReports
                    .Include(i => i.Vehicle)
                    .Include(i => i.RentalRequest)
                    .FirstOrDefaultAsync(i => i.Id == id);

                if (report == null)
                    throw new KeyNotFoundException("Không tìm thấy hồ sơ sự cố.");

                var action = (dto.ResolutionAction ?? "NONE").ToUpper();

                report.Status = "RESOLVED";
                report.ResolutionAction = action;
                report.ReplacementCarId = dto.ReplacementCarId;
                report.EstimatedDamageCost = dto.EstimatedDamageCost;
                report.InsuranceCoverageStatus = dto.InsuranceCoverageStatus;
                report.CustomerPayAmount = dto.CustomerPayAmount;
                report.CompanyPayAmount = dto.CompanyPayAmount;
                report.StaffNotes = dto.StaffNotes;
                report.HandledByStaffName = dto.StaffName ?? "Nhân viên VELORA";
                report.ResolvedAt = DateTime.UtcNow;

                // Handle replacement car if chosen
                if (action == "REPLACE_CAR")
                {
                    if (!dto.ReplacementCarId.HasValue)
                    {
                        throw new InvalidOperationException("Vui lòng chọn xe thay thế từ kho xe khi chọn phương án Đổi xe (REPLACE_CAR).");
                    }

                    var replCar = await _context.Vehicles.FindAsync(dto.ReplacementCarId.Value);
                    if (replCar == null)
                    {
                        throw new KeyNotFoundException("Không tìm thấy xe thay thế đã chọn.");
                    }

                    if (replCar.Status != VehicleStatus.READY)
                    {
                        throw new InvalidOperationException($"Xe thay thế {replCar.Make} {replCar.Model} ({replCar.LicensePlate}) không sẵn sàng để bàn giao (Trạng thái hiện tại: {replCar.Status}). Vui lòng chọn xe đang ở trạng thái READY.");
                    }

                    replCar.Status = VehicleStatus.RENTED;
                    replCar.UpdatedAt = DateTime.UtcNow;

                    // Update RentalRequest to associate with new replacement car
                    if (report.RentalRequest != null)
                    {
                        report.RentalRequest.CarId = replCar.Id;
                        report.RentalRequest.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // Update original damaged car status after incident
                if (report.Vehicle != null)
                {
                    var targetStatus = dto.VehicleStatusAfterIncident?.ToUpper();

                    if (action == "REPLACE_CAR" || action == "RESCUE_TOW")
                    {
                        // Original car pulled back to garage or replaced: must NOT stay RENTED
                        report.Vehicle.Status = targetStatus switch
                        {
                            "MAINTENANCE" => VehicleStatus.MAINTENANCE,
                            "INSPECTION" => VehicleStatus.INSPECTION,
                            "READY" => VehicleStatus.READY,
                            _ => VehicleStatus.REPAIR
                        };
                    }
                    else
                    {
                        // Repaired on-site or client resolved
                        report.Vehicle.Status = targetStatus switch
                        {
                            "REPAIR" => VehicleStatus.REPAIR,
                            "MAINTENANCE" => VehicleStatus.MAINTENANCE,
                            "INSPECTION" => VehicleStatus.INSPECTION,
                            "READY" => VehicleStatus.READY,
                            _ => VehicleStatus.RENTED
                        };
                    }

                    report.Vehicle.UpdatedAt = DateTime.UtcNow;
                }

                // Auto-recovery workflow for RESCUE_TOW: auto-generate ReturnProtocol & move RentalRequest -> RETURNED
                if (action == "RESCUE_TOW" && report.RentalRequest != null && report.RentalRequest.Status == "ACTIVE")
                {
                    var existingReturn = await _context.ReturnProtocols
                        .FirstOrDefaultAsync(r => r.RentalRequestId == report.RentalRequestId && r.Status == "COMPLETED");

                    if (existingReturn == null)
                    {
                        var handover = await _context.HandoverProtocols
                            .OrderByDescending(h => h.CreatedAt)
                            .FirstOrDefaultAsync(h => h.RentalRequestId == report.RentalRequestId);

                        var contract = await _context.RentalContracts
                            .FirstOrDefaultAsync(c => c.RequestId == report.RentalRequestId);

                        int handoverOdo = handover != null && handover.HandoverOdo > 0
                            ? handover.HandoverOdo
                            : (handover?.OdoAtHandover > 0 ? handover.OdoAtHandover : (report.Vehicle?.CurrentMileage ?? 0));

                        decimal handoverFuel = handover?.HandoverFuelLevel ?? 100m;

                        bool hasTowedOdo = dto.TowedOdo.HasValue && dto.TowedOdo.Value > 0;
                        bool hasTowedFuel = dto.TowedFuelLevel.HasValue && dto.TowedFuelLevel.Value >= 0m && dto.TowedFuelLevel.Value <= 100m;

                        int finalReturnOdo = hasTowedOdo ? Math.Max(handoverOdo, dto.TowedOdo!.Value) : handoverOdo;
                        decimal finalReturnFuel = hasTowedFuel ? dto.TowedFuelLevel!.Value : handoverFuel;

                        if (hasTowedOdo && report.Vehicle != null)
                        {
                            report.Vehicle.CurrentMileage = finalReturnOdo;
                        }

                        // Chốt thời điểm trả xe: nếu chưa quá hạn thì lấy UtcNow, nếu quá hạn trong lúc chờ cứu hộ thì lấy thời điểm báo sự cố
                        DateTime actualReturnTime = DateTime.UtcNow <= report.RentalRequest.EndTime
                            ? DateTime.UtcNow
                            : report.CreatedAt;

                        int totalKmDriven = Math.Max(0, finalReturnOdo - handoverOdo);
                        int? maxKmAllowed = contract?.MaxKm
                            ?? (report.Vehicle?.MileageLimit.HasValue == true
                                ? report.Vehicle.MileageLimit.Value * Math.Max(1, report.RentalRequest.TotalDays)
                                : (int?)null);
                        int excessKm = maxKmAllowed.HasValue ? Math.Max(0, totalKmDriven - maxKmAllowed.Value) : 0;

                        // Giữ nguyên sơ đồ vết xước từ bàn giao (KHÔNG thêm marker CUSTOMER_RENTAL mới) để tránh tính trùng với CustomerPayAmount của IncidentReport
                        string preservedDamageMap = !string.IsNullOrWhiteSpace(handover?.HandoverDamageMap)
                            ? handover!.HandoverDamageMap!
                            : (!string.IsNullOrWhiteSpace(handover?.DamagePointsJson) ? handover!.DamagePointsJson! : "[]");

                        string autoNotes = (!hasTowedOdo || !hasTowedFuel)
                            ? "Biên bản thu hồi tự động từ sự cố kéo xe cứu hộ (không đọc được đồng hồ)"
                            : $"Biên bản thu hồi tự động từ sự cố kéo xe cứu hộ ({report.IncidentCode})";

                        var autoReturnProtocol = new ReturnProtocol
                        {
                            ProtocolNumber = $"BBT-SC-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}",
                            RentalRequestId = report.RentalRequestId,
                            ContractId = contract?.Id,
                            StaffName = dto.StaffName ?? "Nhân viên VELORA",
                            CustomerName = report.CustomerName,
                            CustomerPhone = report.CustomerPhone,
                            ReturnDate = actualReturnTime,
                            CustomerReturnOdo = finalReturnOdo,
                            YardCheckinOdo = finalReturnOdo,
                            StartOdo = handoverOdo,
                            EndOdo = finalReturnOdo,
                            TotalKmDriven = totalKmDriven,
                            MaxKmAllowed = maxKmAllowed,
                            ExcessKm = excessKm,
                            CustomerReturnFuelLevel = finalReturnFuel,
                            YardCheckinFuelLevel = finalReturnFuel,
                            InitialFuelLevel = (int)Math.Round(handoverFuel),
                            ReturnFuelLevel = (int)Math.Round(finalReturnFuel),
                            FuelDifference = (int)Math.Round(Math.Max(0m, handoverFuel - finalReturnFuel)),
                            ReturnDamageMap = preservedDamageMap,
                            DamagePointsJson = preservedDamageMap,
                            StaffNotes = autoNotes,
                            NextVehicleStatus = "REPAIR",
                            Status = "COMPLETED",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.ReturnProtocols.Add(autoReturnProtocol);
                    }

                    report.RentalRequest.Status = "RETURNED";
                    report.RentalRequest.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (await GetByIdAsync(report.Id))!;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
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
                ResponsibleParty = i.ResponsibleParty,
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
