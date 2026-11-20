using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.ReturnProtocol;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class ReturnProtocolService : IReturnProtocolService
    {
        private readonly AppDbContext _context;
        private readonly ISystemSettingsService _settingsService;
        private readonly INotificationService _notificationService;

        public ReturnProtocolService(
            AppDbContext context,
            ISystemSettingsService settingsService,
            INotificationService notificationService)
        {
            _context = context;
            _settingsService = settingsService;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<ReturnProtocolResponseDto>> GetAllAsync()
        {
            var protocols = await _context.ReturnProtocols
                .Include(p => p.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return protocols.Select(MapToDto);
        }

        public async Task<ReturnProtocolResponseDto?> GetByIdAsync(Guid id)
        {
            var protocol = await _context.ReturnProtocols
                .Include(p => p.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(p => p.Id == id);

            return protocol != null ? MapToDto(protocol) : null;
        }

        public async Task<ReturnProtocolResponseDto?> GetByRequestIdAsync(Guid requestId)
        {
            var protocol = await _context.ReturnProtocols
                .Include(p => p.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(p => p.RentalRequestId == requestId);

            return protocol != null ? MapToDto(protocol) : null;
        }

        public async Task<ReturnProtocolResponseDto> CreateAsync(CreateReturnProtocolDto dto, Guid? staffId, string staffName)
        {
            await EnsureNotLockedBySettlementAsync(dto.RentalRequestId);

            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin đơn thuê xe tương ứng.");
            }

            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == dto.RentalRequestId);

            // Tìm biên bản bàn giao nhận xe ban đầu để đối chiếu
            var handover = await _context.HandoverProtocols
                .OrderByDescending(h => h.CreatedAt)
                .FirstOrDefaultAsync(h => h.RentalRequestId == dto.RentalRequestId);

            int handoverOdo = handover?.HandoverOdo ?? handover?.OdoAtHandover ?? request.Vehicle?.CurrentMileage ?? 0;
            decimal handoverFuel = handover?.HandoverFuelLevel ?? (decimal)(handover?.FuelLevel ?? 100);

            int customerReturnOdo = dto.CustomerReturnOdo ?? (dto.EndOdo > 0 ? dto.EndOdo : handoverOdo);
            decimal customerReturnFuel = dto.CustomerReturnFuelLevel ?? (decimal)dto.ReturnFuelLevel;

            // Bẫy 3: Hard Block cho khách trả
            if (customerReturnOdo < handoverOdo)
            {
                throw new ArgumentException($"Chỉ số ODO lúc khách trả ({customerReturnOdo:N0} km) không thể nhỏ hơn ODO lúc bàn giao ({handoverOdo:N0} km). Vui lòng đối chiếu đồng hồ taplo.");
            }

            // Quãng đường thực tế khách sử dụng (loại trừ trung chuyển)
            int totalKm = customerReturnOdo - handoverOdo;

            // Giới hạn km từ hợp đồng hoặc hạn mức xe
            int? maxKm = contract?.MaxKm;
            if (maxKm == null || maxKm <= 0)
            {
                if (request.Vehicle?.MileageLimit != null && request.Vehicle.MileageLimit > 0)
                {
                    maxKm = request.Vehicle.MileageLimit.Value * Math.Max(1, request.TotalDays);
                }
            }

            int excessKm = 0;
            if (maxKm.HasValue && totalKm > maxKm.Value)
            {
                excessKm = totalKm - maxKm.Value;
            }

            // Chênh lệch nhiên liệu
            int fuelDiff = (int)Math.Max(0, Math.Round(handoverFuel - customerReturnFuel));

            // Bẫy 3: Audit đối xứng cho chiều xe về bãi
            bool hasReturnAnomaly = false;
            string? returnAnomalyNote = dto.ReturnAnomalyNote;
            if (dto.YardCheckinOdo.HasValue && dto.YardCheckinOdo.Value > 0)
            {
                int yardOdo = dto.YardCheckinOdo.Value;
                if (yardOdo < customerReturnOdo)
                {
                    throw new ArgumentException($"Chỉ số ODO khi xe về tới bãi ({yardOdo:N0} km) không thể nhỏ hơn ODO lúc khách trả ({customerReturnOdo:N0} km).");
                }

                int returnTransitKm = yardOdo - customerReturnOdo;
                decimal maxDefaultTransitKm = await _settingsService.GetSettingValueAsync("max_default_transit_km", 50.0m);
                decimal estDist = request.EstimatedDeliveryDistanceKm ?? 0;
                decimal maxAllowedKm = estDist > 0 ? (estDist * 1.3m + 5.0m) : maxDefaultTransitKm;

                // Hard block chiều về
                if (returnTransitKm > (maxAllowedKm * 3.0m) || returnTransitKm > 300)
                {
                    throw new ArgumentException($"Quãng đường trung chuyển chiều về bãi ({returnTransitKm:N0} km) vượt quá 3 lần hạn mức ({maxAllowedKm * 3.0m:N0} km) hoặc vượt quá 300 km. Vui lòng đối chiếu đồng hồ taplo.");
                }

                // Soft flag chiều về
                if (returnTransitKm > maxAllowedKm)
                {
                    if (string.IsNullOrWhiteSpace(returnAnomalyNote))
                    {
                        throw new ArgumentException($"Quãng đường trung chuyển xe về bãi ({returnTransitKm:N0} km) vượt định mức ({maxAllowedKm:N0} km). Bắt buộc phải nhập lý do giải trình (return_anomaly_note).");
                    }
                    hasReturnAnomaly = true;
                }
            }

            // Bẫy 2: Khóa toàn bộ marker lúc giao; chỉ marker mới phát sinh gắn stage = CUSTOMER_RENTAL
            string handoverMap = handover?.HandoverDamageMap ?? handover?.DamagePointsJson ?? "[]";
            string returnMapInput = !string.IsNullOrWhiteSpace(dto.ReturnDamageMap)
                ? dto.ReturnDamageMap
                : (!string.IsNullOrWhiteSpace(dto.DamagePointsJson) ? dto.DamagePointsJson : handoverMap);

            string processedReturnDamageMap = ProcessReturnDamageMap(handoverMap, returnMapInput);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                string protocolNumber = $"BBHT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";

                var protocol = new ReturnProtocol
                {
                    Id = Guid.NewGuid(),
                    ProtocolNumber = protocolNumber,
                    RentalRequestId = dto.RentalRequestId,
                    ContractId = contract?.Id ?? dto.ContractId,
                    StaffId = staffId,
                    StaffName = string.IsNullOrWhiteSpace(staffName) ? "Nhân viên kiểm định VELORA" : staffName,
                    CustomerName = request.CustomerName,
                    CustomerPhone = request.CustomerPhone,
                    ReturnDate = dto.ReturnDate != default ? dto.ReturnDate : DateTime.UtcNow,

                    // Single Source of Truth
                    CustomerReturnOdo = customerReturnOdo,
                    YardCheckinOdo = dto.YardCheckinOdo,
                    CustomerReturnFuelLevel = customerReturnFuel,
                    YardCheckinFuelLevel = dto.YardCheckinFuelLevel,
                    ReturnDashPhotoUrl = dto.ReturnDashPhotoUrl,
                    HasReturnAnomaly = hasReturnAnomaly,
                    ReturnAnomalyNote = returnAnomalyNote,
                    ReturnDamageMap = processedReturnDamageMap,

                    // Đồng bộ cột cũ
                    StartOdo = handoverOdo,
                    EndOdo = customerReturnOdo,
                    TotalKmDriven = totalKm,
                    MaxKmAllowed = maxKm,
                    ExcessKm = excessKm,
                    InitialFuelLevel = (int)Math.Round(handoverFuel),
                    ReturnFuelLevel = (int)Math.Round(customerReturnFuel),
                    FuelDifference = fuelDiff,
                    DamagePointsJson = processedReturnDamageMap,
                    ExteriorCondition = dto.ExteriorCondition ?? "Ngoại thất bình thường",
                    InteriorCondition = dto.InteriorCondition ?? "Nội thất bình thường",
                    TireCondition = dto.TireCondition ?? "Lốp xe bình thường",
                    NewDamagesNotes = dto.NewDamagesNotes,
                    AccessoriesChecklist = dto.AccessoriesChecklist,
                    MissingAccessories = dto.MissingAccessories,
                    EvidencePhotoUrls = dto.EvidencePhotoUrls,
                    StaffNotes = dto.StaffNotes,
                    StaffSignature = dto.StaffSignature,
                    CustomerSignature = dto.CustomerSignature,
                    NextVehicleStatus = dto.NextVehicleStatus ?? "READY",
                    Status = "COMPLETED",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.ReturnProtocols.Add(protocol);

                // State Machine: RentalRequest -> RETURNED, Car -> INSPECTION (hoặc REPAIR)
                request.Status = "RETURNED";
                request.UpdatedAt = DateTime.UtcNow;

                if (contract != null)
                {
                    contract.Status = "ACTIVE";
                    contract.UpdatedAt = DateTime.UtcNow;
                }

                if (request.Vehicle != null)
                {
                    request.Vehicle.Status = (dto.NextVehicleStatus == "REPAIR") ? VehicleStatus.REPAIR : VehicleStatus.INSPECTION;
                    
                    int latestOdo = (dto.YardCheckinOdo.HasValue && dto.YardCheckinOdo.Value > 0)
                        ? dto.YardCheckinOdo.Value
                        : customerReturnOdo;

                    if (latestOdo > request.Vehicle.CurrentMileage)
                    {
                        request.Vehicle.CurrentMileage = latestOdo;
                    }
                    request.Vehicle.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                protocol.RentalRequest = request;
                return MapToDto(protocol);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task EnsureNotLockedBySettlementAsync(Guid? rentalRequestId)
        {
            if (!rentalRequestId.HasValue) return;

            var settlement = await _context.RentalSettlements
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.RentalRequestId == rentalRequestId.Value);

            if (settlement != null && (settlement.Status == "PARTIALLY_SETTLED" || settlement.Status == "SETTLED" || settlement.Status == "CLOSED"))
            {
                throw new InvalidOperationException("Biên bản nhận xe đã bị khóa cứng vì hồ sơ quyết toán (RentalSettlement) đã chốt.");
            }
        }

        private static string ProcessReturnDamageMap(string handoverMapJson, string returnMapJson)
        {
            var handoverIds = new HashSet<string>();
            var lockedList = new List<JsonObject>();

            if (!string.IsNullOrWhiteSpace(handoverMapJson))
            {
                try
                {
                    if (JsonNode.Parse(handoverMapJson) is JsonArray hArr)
                    {
                        foreach (var item in hArr)
                        {
                            if (item is JsonObject obj)
                            {
                                var id = obj["id"]?.ToString();
                                if (!string.IsNullOrEmpty(id))
                                {
                                    handoverIds.Add(id);
                                    lockedList.Add(obj);
                                }
                            }
                        }
                    }
                }
                catch { }
            }

            var resultList = new List<JsonObject>();
            var seenReturnIds = new HashSet<string>();

            if (!string.IsNullOrWhiteSpace(returnMapJson))
            {
                try
                {
                    if (JsonNode.Parse(returnMapJson) is JsonArray rArr)
                    {
                        foreach (var item in rArr)
                        {
                            if (item is JsonObject obj)
                            {
                                var id = obj["id"]?.ToString() ?? $"dmg-{Guid.NewGuid().ToString()[..8]}";
                                obj["id"] = id;
                                seenReturnIds.Add(id);

                                if (handoverIds.Contains(id))
                                {
                                    // Giữ nguyên stage đã chốt lúc bàn giao
                                    var orig = lockedList.FirstOrDefault(l => l["id"]?.ToString() == id);
                                    obj["stage"] = orig?["stage"]?.ToString() ?? "PRE_EXISTING";
                                    resultList.Add(obj);
                                }
                                else
                                {
                                    // Marker mới phát sinh trong quá trình khách thuê
                                    obj["stage"] = "CUSTOMER_RENTAL";
                                    obj["type"] = "NEW";
                                    resultList.Add(obj);
                                }
                            }
                        }
                    }
                }
                catch { }
            }

            // Đảm bảo không mất marker đã chốt từ handover
            foreach (var lObj in lockedList)
            {
                var id = lObj["id"]?.ToString();
                if (!string.IsNullOrEmpty(id) && !seenReturnIds.Contains(id))
                {
                    resultList.Insert(0, lObj);
                }
            }

            var resArray = new JsonArray();
            foreach (var r in resultList)
            {
                resArray.Add(r.DeepClone());
            }

            return resArray.ToJsonString();
        }

        private static ReturnProtocolResponseDto MapToDto(ReturnProtocol entity)
        {
            var vehicle = entity.RentalRequest?.Vehicle;
            return new ReturnProtocolResponseDto
            {
                Id = entity.Id,
                ProtocolNumber = entity.ProtocolNumber,
                RentalRequestId = entity.RentalRequestId,
                ContractId = entity.ContractId,
                CarId = vehicle?.Id,
                CarMake = vehicle?.Make,
                CarModel = vehicle?.Model,
                LicensePlate = vehicle?.LicensePlate,
                StaffId = entity.StaffId,
                StaffName = entity.StaffName,
                CustomerName = entity.CustomerName ?? entity.RentalRequest?.CustomerName,
                CustomerPhone = entity.CustomerPhone ?? entity.RentalRequest?.CustomerPhone,
                ReturnDate = entity.ReturnDate,

                // Single Source of Truth
                CustomerReturnOdo = entity.CustomerReturnOdo > 0 ? entity.CustomerReturnOdo : entity.EndOdo,
                YardCheckinOdo = entity.YardCheckinOdo,
                CustomerReturnFuelLevel = entity.CustomerReturnFuelLevel,
                YardCheckinFuelLevel = entity.YardCheckinFuelLevel,
                ReturnDashPhotoUrl = entity.ReturnDashPhotoUrl,
                HasReturnAnomaly = entity.HasReturnAnomaly,
                ReturnAnomalyNote = entity.ReturnAnomalyNote,
                ReturnDamageMap = entity.ReturnDamageMap ?? entity.DamagePointsJson,

                // Đồng bộ cột cũ
                StartOdo = entity.StartOdo,
                EndOdo = entity.CustomerReturnOdo > 0 ? entity.CustomerReturnOdo : entity.EndOdo,
                TotalKmDriven = entity.TotalKmDriven,
                MaxKmAllowed = entity.MaxKmAllowed,
                ExcessKm = entity.ExcessKm,
                InitialFuelLevel = entity.InitialFuelLevel,
                ReturnFuelLevel = (int)Math.Round(entity.CustomerReturnFuelLevel),
                FuelDifference = entity.FuelDifference,
                ExteriorCondition = entity.ExteriorCondition,
                InteriorCondition = entity.InteriorCondition,
                TireCondition = entity.TireCondition,
                NewDamagesNotes = entity.NewDamagesNotes,
                DamagePointsJson = entity.ReturnDamageMap ?? entity.DamagePointsJson,
                AccessoriesChecklist = entity.AccessoriesChecklist,
                MissingAccessories = entity.MissingAccessories,
                EvidencePhotoUrls = entity.EvidencePhotoUrls,
                StaffNotes = entity.StaffNotes,
                StaffSignature = entity.StaffSignature,
                CustomerSignature = entity.CustomerSignature,
                NextVehicleStatus = entity.NextVehicleStatus,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
