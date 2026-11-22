using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.RentalCondition;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class RentalConditionService : IRentalConditionService
    {
        private readonly AppDbContext _context;
        private readonly ISystemSettingsService _settingsService;

        public RentalConditionService(AppDbContext context, ISystemSettingsService settingsService)
        {
            _context = context;
            _settingsService = settingsService;
        }

        private static string NormalizeLicenseClass(string? licenseClass)
        {
            if (string.IsNullOrWhiteSpace(licenseClass)) return "B1";
            var upper = licenseClass.Trim().ToUpperInvariant();
            return upper switch
            {
                "B1_AUTO" => "B1",
                "B1" => "B1",
                "B2" => "B2",
                "C" => "C",
                "D" => "D",
                "E" => "E",
                _ => "B1"
            };
        }

        private static string ElevateLicenseForManual(string licenseClass, TransmissionType transmission)
        {
            var normalized = NormalizeLicenseClass(licenseClass);
            if (transmission == TransmissionType.MANUAL && (normalized == "B1" || normalized == "B1_AUTO"))
            {
                return "B2";
            }
            return normalized;
        }

        public async Task<RentalConditionDto?> GetByVehicleIdAsync(Guid vehicleId)
        {
            var condition = await _context.RentalConditions
                .Include(c => c.Vehicle)
                .FirstOrDefaultAsync(c => c.CarId == vehicleId);
            if (condition == null) return null;

            var transmission = condition.Vehicle?.Transmission ?? TransmissionType.AUTO;
            return new RentalConditionDto
            {
                Id = condition.Id,
                CarId = condition.CarId,
                MinAge = condition.MinAge,
                RequireDrivingYears = condition.RequireDrivingYears,
                RequiredLicenseClass = ElevateLicenseForManual(condition.RequiredLicenseClass, transmission),
                MinCompletedTrips = condition.MinCompletedTrips,
                RequireVerifiedKyc = condition.RequireVerifiedKyc,
                OtherConditions = condition.OtherConditions,
                IsCustom = true
            };
        }

        public async Task<RentalConditionDto?> GetEffectiveConditionAsync(Guid carId)
        {
            var vehicle = await _context.Vehicles
                .Include(v => v.RentalCondition)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == carId && v.IsActive);

            if (vehicle == null) return null;

            if (vehicle.RentalCondition != null)
            {
                var c = vehicle.RentalCondition;
                return new RentalConditionDto
                {
                    Id = c.Id,
                    CarId = vehicle.Id,
                    MinAge = c.MinAge ?? 21,
                    RequireDrivingYears = c.RequireDrivingYears ?? 1,
                    RequiredLicenseClass = ElevateLicenseForManual(c.RequiredLicenseClass, vehicle.Transmission),
                    MinCompletedTrips = Math.Max(0, c.MinCompletedTrips),
                    RequireVerifiedKyc = c.RequireVerifiedKyc,
                    OtherConditions = c.OtherConditions,
                    IsCustom = true
                };
            }

            // Fallback về cấu hình mặc định hệ thống từ system_settings
            var defaultMinAge = await _settingsService.GetSettingValueAsync("default_min_age", 21);
            var defaultDrivingYears = await _settingsService.GetSettingValueAsync("default_min_driving_years", 1);
            var defaultLicense = await _settingsService.GetSettingValueAsync("default_required_license", "B1");

            return new RentalConditionDto
            {
                Id = Guid.Empty,
                CarId = vehicle.Id,
                MinAge = defaultMinAge,
                RequireDrivingYears = defaultDrivingYears,
                RequiredLicenseClass = ElevateLicenseForManual(defaultLicense, vehicle.Transmission),
                MinCompletedTrips = 0,
                RequireVerifiedKyc = false,
                OtherConditions = null,
                IsCustom = false
            };
        }

        public async Task<RentalConditionDto?> CreateAsync(Guid vehicleId, CreateRentalConditionDto createDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId && v.IsActive);
            if (vehicle == null) return null;

            var existingCondition = await _context.RentalConditions.AnyAsync(c => c.CarId == vehicleId);
            if (existingCondition)
            {
                throw new InvalidOperationException("Xe này đã có bộ điều kiện thuê riêng.");
            }

            var licenseClass = ElevateLicenseForManual(createDto.RequiredLicenseClass, vehicle.Transmission);
            var condition = new RentalCondition
            {
                Id = Guid.NewGuid(),
                CarId = vehicleId,
                MinAge = createDto.MinAge ?? 21,
                RequireDrivingYears = createDto.RequireDrivingYears ?? 1,
                RequiredLicenseClass = licenseClass,
                MinCompletedTrips = Math.Max(0, createDto.MinCompletedTrips),
                RequireVerifiedKyc = createDto.RequireVerifiedKyc,
                OtherConditions = createDto.OtherConditions
            };

            _context.RentalConditions.Add(condition);
            await _context.SaveChangesAsync();

            return new RentalConditionDto
            {
                Id = condition.Id,
                CarId = condition.CarId,
                MinAge = condition.MinAge,
                RequireDrivingYears = condition.RequireDrivingYears,
                RequiredLicenseClass = condition.RequiredLicenseClass,
                MinCompletedTrips = condition.MinCompletedTrips,
                RequireVerifiedKyc = condition.RequireVerifiedKyc,
                OtherConditions = condition.OtherConditions,
                IsCustom = true
            };
        }

        public async Task<RentalConditionDto?> UpdateAsync(Guid vehicleId, UpdateRentalConditionDto updateDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId && v.IsActive);
            if (vehicle == null) return null;

            var condition = await _context.RentalConditions.FirstOrDefaultAsync(c => c.CarId == vehicleId);
            if (condition == null) return null;

            condition.MinAge = updateDto.MinAge ?? 21;
            condition.RequireDrivingYears = updateDto.RequireDrivingYears ?? 1;
            condition.RequiredLicenseClass = ElevateLicenseForManual(updateDto.RequiredLicenseClass, vehicle.Transmission);
            condition.MinCompletedTrips = Math.Max(0, updateDto.MinCompletedTrips);
            condition.RequireVerifiedKyc = updateDto.RequireVerifiedKyc;
            condition.OtherConditions = updateDto.OtherConditions;

            await _context.SaveChangesAsync();

            return new RentalConditionDto
            {
                Id = condition.Id,
                CarId = condition.CarId,
                MinAge = condition.MinAge,
                RequireDrivingYears = condition.RequireDrivingYears,
                RequiredLicenseClass = condition.RequiredLicenseClass,
                MinCompletedTrips = condition.MinCompletedTrips,
                RequireVerifiedKyc = condition.RequireVerifiedKyc,
                OtherConditions = condition.OtherConditions,
                IsCustom = true
            };
        }

        public async Task<int> BulkApplyAsync(BulkApplyRentalConditionDto dto)
        {
            if (dto.VehicleIds == null || dto.VehicleIds.Count == 0)
            {
                return 0;
            }

            var targetIds = dto.VehicleIds.Distinct().ToList();
            var vehicles = await _context.Vehicles
                .Include(v => v.RentalCondition)
                .Where(v => v.IsActive && targetIds.Contains(v.Id))
                .ToListAsync();

            if (vehicles.Count == 0) return 0;

            int minAge = dto.MinAge ?? 21;
            int drivingYears = dto.MinDrivingYears ?? dto.RequireDrivingYears ?? 1;
            int minTrips = Math.Max(0, dto.MinCompletedTrips);
            string? notes = dto.OtherNotes ?? dto.OtherConditions;

            foreach (var vehicle in vehicles)
            {
                var effectiveLicense = ElevateLicenseForManual(dto.RequiredLicenseClass, vehicle.Transmission);

                if (vehicle.RentalCondition != null)
                {
                    vehicle.RentalCondition.MinAge = minAge;
                    vehicle.RentalCondition.RequireDrivingYears = drivingYears;
                    vehicle.RentalCondition.RequiredLicenseClass = effectiveLicense;
                    vehicle.RentalCondition.MinCompletedTrips = minTrips;
                    vehicle.RentalCondition.RequireVerifiedKyc = dto.RequireVerifiedKyc;
                    vehicle.RentalCondition.OtherConditions = notes;
                }
                else
                {
                    _context.RentalConditions.Add(new RentalCondition
                    {
                        Id = Guid.NewGuid(),
                        CarId = vehicle.Id,
                        MinAge = minAge,
                        RequireDrivingYears = drivingYears,
                        RequiredLicenseClass = effectiveLicense,
                        MinCompletedTrips = minTrips,
                        RequireVerifiedKyc = dto.RequireVerifiedKyc,
                        OtherConditions = notes
                    });
                }
            }

            await _context.SaveChangesAsync();
            return vehicles.Count;
        }

        public async Task<bool> DeleteAsync(Guid vehicleId)
        {
            var condition = await _context.RentalConditions.FirstOrDefaultAsync(c => c.CarId == vehicleId);
            if (condition == null) return false;

            _context.RentalConditions.Remove(condition);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
