using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Vehicle;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class VehicleService : IVehicleService
    {
        private readonly AppDbContext _context;

        public VehicleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<VehicleResponseDto>> GetAllAsync(string? search, VehicleStatus? status)
        {
            var query = _context.Vehicles.Include(v => v.PricingPolicies).Include(v => v.RentalCondition).Where(v => v.IsActive).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(v => v.Make.ToLower().Contains(searchLower) ||
                                         v.Model.ToLower().Contains(searchLower) ||
                                         v.LicensePlate.ToLower().Contains(searchLower));
            }

            if (status.HasValue)
            {
                query = query.Where(v => v.Status == status.Value);
            }

            var vehicles = await query.ToListAsync();

            return vehicles.Select(MapToResponseDto);
        }

        public async Task<VehicleResponseDto?> GetByIdAsync(Guid id)
        {
            var vehicle = await _context.Vehicles.Include(v => v.PricingPolicies).Include(v => v.RentalCondition).FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return null;

            return MapToResponseDto(vehicle);
        }

        public async Task<VehicleResponseDto> CreateAsync(CreateVehicleDto createDto)
        {
            var vehicle = new Vehicle
            {
                Make = createDto.Make,
                Model = createDto.Model,
                LicensePlate = createDto.LicensePlate,
                Seats = createDto.Seats,
                Transmission = createDto.Transmission,
                FuelType = createDto.FuelType,
                ManufactureYear = createDto.ManufactureYear,
                DailyRate = createDto.DailyRate,
                DepositAmount = createDto.DepositAmount,
                CurrentMileage = createDto.CurrentMileage,
                MileageLimit = createDto.MileageLimit,
                PickupLocation = createDto.PickupLocation,
                ImageUrl = createDto.ImageUrl,
                Status = VehicleStatus.READY,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return MapToResponseDto(vehicle);
        }

        public async Task<VehicleResponseDto?> UpdateAsync(Guid id, UpdateVehicleDto updateDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return null;

            vehicle.Seats = updateDto.Seats;
            vehicle.Transmission = updateDto.Transmission;
            vehicle.DailyRate = updateDto.DailyRate;
            vehicle.DepositAmount = updateDto.DepositAmount;
            vehicle.CurrentMileage = updateDto.CurrentMileage;
            vehicle.MileageLimit = updateDto.MileageLimit;
            vehicle.NextMaintenanceDate = updateDto.NextMaintenanceDate;
            vehicle.NextMaintenanceMileage = updateDto.NextMaintenanceMileage;
            vehicle.PickupLocation = updateDto.PickupLocation;
            vehicle.ImageUrl = updateDto.ImageUrl;
            vehicle.ExtraKmRate = updateDto.ExtraKmRate;
            if (updateDto.FuelReturnPolicy != null) {
                vehicle.FuelReturnPolicy = updateDto.FuelReturnPolicy;
            }
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponseDto(vehicle);
        }

        public async Task<bool> UpdateStatusAsync(Guid id, UpdateVehicleStatusDto statusDto)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return false;

            vehicle.Status = statusDto.Status;
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.IsActive);
            if (vehicle == null) return false;

            // Soft delete
            vehicle.IsActive = false;
            vehicle.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<CarRental.API.DTOs.Search.AvailableVehicleResponseDto>> SearchAvailableVehiclesAsync(CarRental.API.DTOs.Search.VehicleSearchQueryDto query)
        {
            var vehiclesQuery = _context.Vehicles
                .Include(v => v.PricingPolicies)
                .Include(v => v.RentalCondition)
                .Where(v => v.IsActive);

            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                var kw = query.Keyword.Trim().ToLower();
                vehiclesQuery = vehiclesQuery.Where(v =>
                    (v.Make != null && v.Make.ToLower().Contains(kw)) ||
                    (v.Model != null && v.Model.ToLower().Contains(kw)) ||
                    (v.LicensePlate != null && v.LicensePlate.ToLower().Contains(kw)) ||
                    (v.PickupLocation != null && v.PickupLocation.ToLower().Contains(kw))
                );
            }

            if (!string.IsNullOrWhiteSpace(query.PickupLocation))
            {
                var loc = query.PickupLocation.Trim();
                bool isHcmQuery = loc.Contains("Chí Minh", StringComparison.OrdinalIgnoreCase) ||
                                  loc.Contains("Chi Minh", StringComparison.OrdinalIgnoreCase) ||
                                  loc.Equals("HCM", StringComparison.OrdinalIgnoreCase) ||
                                  loc.Equals("TP.HCM", StringComparison.OrdinalIgnoreCase) ||
                                  loc.Contains("Sài Gòn", StringComparison.OrdinalIgnoreCase) ||
                                  loc.Contains("Sai Gon", StringComparison.OrdinalIgnoreCase);

                bool isHnQuery = loc.Contains("Hà Nội", StringComparison.OrdinalIgnoreCase) ||
                                 loc.Contains("Ha Noi", StringComparison.OrdinalIgnoreCase) ||
                                 loc.Equals("HN", StringComparison.OrdinalIgnoreCase);

                bool isDnQuery = loc.Contains("Đà Nẵng", StringComparison.OrdinalIgnoreCase) ||
                                 loc.Contains("Da Nang", StringComparison.OrdinalIgnoreCase) ||
                                 loc.Equals("ĐN", StringComparison.OrdinalIgnoreCase) ||
                                 loc.Equals("DN", StringComparison.OrdinalIgnoreCase);

                if (isHcmQuery)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.PickupLocation != null && (
                        v.PickupLocation.ToLower().Contains("chí minh") ||
                        v.PickupLocation.ToLower().Contains("chi minh") ||
                        v.PickupLocation.ToLower().Contains("hcm") ||
                        v.PickupLocation.ToLower().Contains("sài gòn") ||
                        v.PickupLocation.ToLower().Contains("sai gon")
                    ));
                }
                else if (isHnQuery)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.PickupLocation != null && (
                        v.PickupLocation.ToLower().Contains("hà nội") ||
                        v.PickupLocation.ToLower().Contains("ha noi") ||
                        v.PickupLocation.ToLower().Contains("hn")
                    ));
                }
                else if (isDnQuery)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.PickupLocation != null && (
                        v.PickupLocation.ToLower().Contains("đà nẵng") ||
                        v.PickupLocation.ToLower().Contains("da nang") ||
                        v.PickupLocation.ToLower().Contains("đn") ||
                        v.PickupLocation.ToLower().Contains("dn")
                    ));
                }
                else
                {
                    var locLower = loc.ToLower();
                    vehiclesQuery = vehiclesQuery.Where(v => v.PickupLocation != null && v.PickupLocation.ToLower().Contains(locLower));
                }
            }

            if (!string.IsNullOrWhiteSpace(query.Brand))
            {
                var brandLower = query.Brand.Trim().ToLower();
                vehiclesQuery = vehiclesQuery.Where(v => v.Make != null && v.Make.ToLower().Contains(brandLower));
            }

            if (!string.IsNullOrWhiteSpace(query.SeatsRange))
            {
                var sr = query.SeatsRange.Trim();
                if (sr == "4-5" || sr == "5")
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Seats >= 4 && v.Seats <= 5);
                }
                else if (sr == "7")
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Seats >= 7);
                }
                else if (sr == "2")
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Seats <= 2);
                }
            }
            else if (query.Seats.HasValue)
            {
                if (query.Seats.Value == 5)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Seats >= 4 && v.Seats <= 5);
                }
                else if (query.Seats.Value >= 7)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Seats >= 7);
                }
                else
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Seats == query.Seats.Value);
                }
            }

            if (!string.IsNullOrWhiteSpace(query.Transmission))
            {
                if (Enum.TryParse<TransmissionType>(query.Transmission, true, out var transType))
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Transmission == transType);
                }
            }

            if (!string.IsNullOrWhiteSpace(query.FuelType))
            {
                if (Enum.TryParse<FuelType>(query.FuelType, true, out var fuelType))
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.FuelType == fuelType);
                }
            }

            if (query.MinPrice.HasValue && query.MinPrice.Value > 0)
            {
                vehiclesQuery = vehiclesQuery.Where(v => v.DailyRate >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue && query.MaxPrice.Value > 0)
            {
                vehiclesQuery = vehiclesQuery.Where(v => v.DailyRate <= query.MaxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && query.Status != "ALL")
            {
                if (query.Status.Equals("AVAILABLE_ONLY", StringComparison.OrdinalIgnoreCase) || query.Status.Equals("READY", StringComparison.OrdinalIgnoreCase))
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Status == VehicleStatus.READY);
                }
                else if (Enum.TryParse<VehicleStatus>(query.Status, true, out var filterStatus))
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Status == filterStatus);
                }
            }

            // Kiểm tra trùng lịch kèm buffer 3 giờ
            var overlappingCarIds = new HashSet<Guid>();
            var overlappingDetails = new Dictionary<Guid, (DateTime Start, DateTime End)>();

            if (query.StartTime.HasValue && query.EndTime.HasValue)
            {
                var bufferHours = 3;
                var startUtc = query.StartTime.Value.Kind == DateTimeKind.Utc ? query.StartTime.Value : query.StartTime.Value.ToUniversalTime();
                var endUtc = query.EndTime.Value.Kind == DateTimeKind.Utc ? query.EndTime.Value : query.EndTime.Value.ToUniversalTime();
                var endWithBufferUtc = endUtc.AddHours(bufferHours);

                var overlapList = await _context.RentalRequests
                    .Where(r => r.Status != "REJECTED" && r.Status != "CANCELLED" && r.Status != "CANCELED" && r.Status != "COMPLETED" && 
                                r.StartTime < endWithBufferUtc && r.EndTime.AddHours(bufferHours) > startUtc)
                    .Select(r => new { r.CarId, r.StartTime, r.EndTime })
                    .ToListAsync();

                foreach (var o in overlapList)
                {
                    overlappingCarIds.Add(o.CarId);
                    if (!overlappingDetails.ContainsKey(o.CarId))
                    {
                        overlappingDetails[o.CarId] = (o.StartTime, o.EndTime);
                    }
                }
            }

            var vehicles = await vehiclesQuery.ToListAsync();
            var results = new List<CarRental.API.DTOs.Search.AvailableVehicleResponseDto>();

            int totalDays = 0;
            if (query.StartTime.HasValue && query.EndTime.HasValue)
            {
                totalDays = (int)Math.Ceiling((query.EndTime.Value - query.StartTime.Value).TotalDays);
                if (totalDays <= 0) totalDays = 1;
            }

            foreach (var vehicle in vehicles)
            {
                bool isOverlapping = overlappingCarIds.Contains(vehicle.Id);
                bool isAvailable = vehicle.Status == VehicleStatus.READY && !isOverlapping;
                string? availabilityNote = null;

                if (vehicle.Status == VehicleStatus.RENTED)
                {
                    availabilityNote = "Xe hiện đang được khách hàng thuê và sử dụng.";
                }
                else if (!isAvailable)
                {
                    availabilityNote = "Xe hiện không thể được đặt thuê vì bất kỳ lý do nào.";
                }
                else
                {
                    availabilityNote = "Sẵn sàng bàn giao";
                }

                var response = new CarRental.API.DTOs.Search.AvailableVehicleResponseDto
                {
                    Vehicle = MapToResponseDto(vehicle),
                    TotalDays = totalDays,
                    DepositAmount = vehicle.DepositAmount,
                    IsAvailable = isAvailable,
                    AvailabilityNote = availabilityNote
                };

                if (totalDays > 0)
                {
                    decimal baseFee = vehicle.DailyRate * totalDays;
                    decimal appliedDiscount = 0;
                    decimal appliedSurcharge = 0;

                    var applicablePolicy = vehicle.PricingPolicies?
                        .Where(p => p.MinDays <= totalDays)
                        .OrderByDescending(p => p.MinDays)
                        .FirstOrDefault();

                    if (applicablePolicy != null)
                    {
                        appliedDiscount = applicablePolicy.DiscountPercentage;
                        appliedSurcharge = applicablePolicy.HolidaySurcharge;
                    }

                    decimal discountAmount = baseFee * (appliedDiscount / 100);
                    decimal surchargeAmount = baseFee * (appliedSurcharge / 100);
                    response.EstimatedTotalFee = baseFee - discountAmount + surchargeAmount;
                    response.AppliedDiscountPercent = appliedDiscount;
                    response.AppliedHolidaySurchargePercent = appliedSurcharge;
                }

                results.Add(response);
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && (query.Status.Equals("READY", StringComparison.OrdinalIgnoreCase) || query.Status.Equals("AVAILABLE_ONLY", StringComparison.OrdinalIgnoreCase)))
            {
                results = results.Where(r => r.IsAvailable).ToList();
            }

            if (!string.IsNullOrWhiteSpace(query.SortBy))
            {
                switch (query.SortBy.ToLower())
                {
                    case "price_asc":
                        results = results.OrderBy(r => r.EstimatedTotalFee > 0 ? r.EstimatedTotalFee : r.Vehicle.DailyRate).ToList();
                        break;
                    case "price_desc":
                        results = results.OrderByDescending(r => r.EstimatedTotalFee > 0 ? r.EstimatedTotalFee : r.Vehicle.DailyRate).ToList();
                        break;
                    case "newest":
                        results = results.OrderByDescending(r => r.Vehicle.CreatedAt).ToList();
                        break;
                    case "year_desc":
                    case "new_year":
                        results = results.OrderByDescending(r => r.Vehicle.ManufactureYear).ToList();
                        break;
                    case "name_asc":
                        results = results.OrderBy(r => r.Vehicle.Make).ThenBy(r => r.Vehicle.Model).ToList();
                        break;
                }
            }

            return results;
        }

        private static VehicleResponseDto MapToResponseDto(Vehicle vehicle)
        {
            return new VehicleResponseDto
            {
                Id = vehicle.Id,
                Make = vehicle.Make,
                Model = vehicle.Model,
                LicensePlate = vehicle.LicensePlate,
                Seats = vehicle.Seats,
                Transmission = vehicle.Transmission,
                FuelType = vehicle.FuelType,
                ManufactureYear = vehicle.ManufactureYear,
                DailyRate = vehicle.DailyRate,
                DepositAmount = vehicle.DepositAmount,
                CurrentMileage = vehicle.CurrentMileage,
                MileageLimit = vehicle.MileageLimit,
                NextMaintenanceDate = vehicle.NextMaintenanceDate,
                NextMaintenanceMileage = vehicle.NextMaintenanceMileage,
                PickupLocation = vehicle.PickupLocation,
                Status = vehicle.Status,
                ImageUrl = vehicle.ImageUrl,
                IsActive = vehicle.IsActive,
                CreatedAt = vehicle.CreatedAt,
                UpdatedAt = vehicle.UpdatedAt,
                ExtraKmRate = vehicle.ExtraKmRate,
                FuelReturnPolicy = vehicle.FuelReturnPolicy,
                PricingPoliciesCount = vehicle.PricingPolicies?.Count ?? 0,
                HasRentalCondition = vehicle.RentalCondition != null,
                RentalConditionMinAge = vehicle.RentalCondition?.MinAge,
                RentalConditionRequireDrivingYears = vehicle.RentalCondition?.RequireDrivingYears
            };
        }
    }
}
