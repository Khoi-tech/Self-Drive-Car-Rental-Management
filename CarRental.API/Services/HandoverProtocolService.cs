using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Handover;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class HandoverProtocolService : IHandoverProtocolService
    {
        private readonly AppDbContext _context;
        private readonly ISystemSettingsService _settingsService;
        private readonly INotificationService _notificationService;

        public HandoverProtocolService(
            AppDbContext context,
            ISystemSettingsService settingsService,
            INotificationService notificationService)
        {
            _context = context;
            _settingsService = settingsService;
            _notificationService = notificationService;
        }

        public async Task<List<HandoverProtocolDto>> GetAllAsync(string? status = null)
        {
            var query = _context.HandoverProtocols
                .Include(h => h.RentalContract)
                .Include(h => h.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(h => h.Status == status);
            }

            var list = await query
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return list.Select(MapToDto).ToList();
        }

        public async Task<HandoverProtocolDto?> GetByIdAsync(Guid id)
        {
            var item = await _context.HandoverProtocols
                .Include(h => h.RentalContract)
                .Include(h => h.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(h => h.Id == id);

            return item == null ? null : MapToDto(item);
        }

        public async Task<HandoverProtocolDto?> GetByRequestIdAsync(Guid requestId)
        {
            var item = await _context.HandoverProtocols
                .Include(h => h.RentalContract)
                .Include(h => h.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(h => h.CreatedAt)
                .FirstOrDefaultAsync(h => h.RentalRequestId == requestId);

            return item == null ? null : MapToDto(item);
        }

        public async Task<HandoverProtocolDto> CreateAsync(CreateHandoverProtocolDto dto)
        {
            await EnsureNotLockedBySettlementAsync(dto.RentalRequestId);

            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
            {
                throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
            }

            int vehicleMileage = request.Vehicle?.CurrentMileage ?? 0;
            int dispatchOdo = dto.DispatchOdo ?? vehicleMileage;
            int handoverOdo = dto.HandoverOdo ?? (dto.OdoAtHandover > 0 ? dto.OdoAtHandover : dispatchOdo);

            // Bẫy 3: Audit ODO 2 cấp độ
            var (hasAnomaly, anomalyNote) = await ValidateTransitOdoAsync(
                dispatchOdo,
                handoverOdo,
                request.EstimatedDeliveryDistanceKm,
                dto.TransitAnomalyNote);

            // Bẫy 1: Mức nhiên liệu mốc mới
            decimal dispatchFuel = dto.DispatchFuelLevel ?? 100m;
            decimal handoverFuel = dto.HandoverFuelLevel ?? (decimal)ParseFuelLevel(dto.FuelLevel);

            // Bẫy 2: Kế thừa sơ đồ xước cũ thành PRE_EXISTING cho dispatch_damage_map
            string dispatchDamageMap = !string.IsNullOrWhiteSpace(dto.DispatchDamageMap)
                ? EnsureMarkersStage(dto.DispatchDamageMap, "PRE_EXISTING")
                : EnsureMarkersStage(await GetLatestDamagePointsByCarIdAsync(request.CarId), "PRE_EXISTING");

            string handoverDamageMap = !string.IsNullOrWhiteSpace(dto.HandoverDamageMap)
                ? dto.HandoverDamageMap
                : dispatchDamageMap;

            string? staffNotes = CheckFuelDropAlert(dispatchFuel, handoverFuel, dto.StaffNotes);

            var existing = await _context.HandoverProtocols
                .FirstOrDefaultAsync(h => h.RentalRequestId == dto.RentalRequestId);

            if (existing != null)
            {
                existing.DispatchOdo = dispatchOdo;
                existing.HandoverOdo = handoverOdo;
                existing.DispatchFuelLevel = dispatchFuel;
                existing.HandoverFuelLevel = handoverFuel;
                existing.HandoverDashPhotoUrl = dto.HandoverDashPhotoUrl ?? existing.HandoverDashPhotoUrl;
                existing.HasTransitAnomaly = hasAnomaly;
                existing.TransitAnomalyNote = anomalyNote ?? existing.TransitAnomalyNote;
                existing.DispatchDamageMap = dispatchDamageMap;
                existing.HandoverDamageMap = handoverDamageMap;

                // Đồng bộ cột cũ
                existing.OdoAtHandover = handoverOdo;
                existing.FuelLevel = (int)Math.Round(handoverFuel);
                existing.DamagePointsJson = handoverDamageMap;
                existing.ExistingScratchesNotes = dto.ExistingScratchesNotes ?? existing.ExistingScratchesNotes;
                existing.ExteriorCondition = dto.ExteriorCondition ?? existing.ExteriorCondition;
                existing.InteriorCondition = dto.InteriorCondition ?? existing.InteriorCondition;
                existing.TireCondition = dto.TireCondition ?? existing.TireCondition;
                existing.AccessoriesChecklist = dto.AccessoriesChecklist ?? existing.AccessoriesChecklist;
                existing.EvidencePhotoUrls = dto.EvidencePhotoUrls ?? existing.EvidencePhotoUrls;
                existing.StaffNotes = staffNotes ?? existing.StaffNotes;
                existing.StaffSignature = dto.StaffSignature ?? existing.StaffSignature;
                existing.CustomerSignature = dto.CustomerSignature ?? existing.CustomerSignature;
                existing.StaffName = !string.IsNullOrWhiteSpace(dto.StaffName) ? dto.StaffName : existing.StaffName;
                existing.Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status : existing.Status;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return (await GetByIdAsync(existing.Id))!;
            }

            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == dto.RentalRequestId);

            string protocolNumber = $"BBBG-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

            var protocol = new HandoverProtocol
            {
                Id = Guid.NewGuid(),
                ProtocolNumber = protocolNumber,
                RentalRequestId = request.Id,
                ContractId = contract?.Id,
                HandoverDate = DateTime.UtcNow,
                StaffName = !string.IsNullOrWhiteSpace(dto.StaffName) ? dto.StaffName : "Nhân viên kiểm định VELORA",
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,

                // Single Source of Truth
                DispatchOdo = dispatchOdo,
                HandoverOdo = handoverOdo,
                DispatchFuelLevel = dispatchFuel,
                HandoverFuelLevel = handoverFuel,
                HandoverDashPhotoUrl = dto.HandoverDashPhotoUrl,
                HasTransitAnomaly = hasAnomaly,
                TransitAnomalyNote = anomalyNote,
                DispatchDamageMap = dispatchDamageMap,
                HandoverDamageMap = handoverDamageMap,

                // Đồng bộ cột cũ
                OdoAtHandover = handoverOdo,
                FuelLevel = (int)Math.Round(handoverFuel),
                DamagePointsJson = handoverDamageMap,
                ExistingScratchesNotes = dto.ExistingScratchesNotes,
                ExteriorCondition = dto.ExteriorCondition ?? "Ngoại thất sạch sẽ, không biến dạng kết cấu",
                InteriorCondition = dto.InteriorCondition ?? "Nội thất sạch sẽ, da ghế nguyên vẹn, đầy đủ thảm sàn",
                TireCondition = dto.TireCondition ?? "4 lốp áp suất tiêu chuẩn, gai lốp tốt, mâm không cấn lề",
                AccessoriesChecklist = dto.AccessoriesChecklist ?? "Giấy đăng ký xe (Cavet);Giấy chứng nhận đăng kiểm;Bảo hiểm TNDS;Chìa khóa thông minh;Kích lốp;Lốp dự phòng;Camera hành trình",
                EvidencePhotoUrls = dto.EvidencePhotoUrls,
                StaffNotes = staffNotes,
                StaffSignature = dto.StaffSignature,
                CustomerSignature = dto.CustomerSignature,
                Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status : "IN_TRANSIT",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.HandoverProtocols.Add(protocol);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(protocol.Id))!;
        }

        public async Task<HandoverProtocolDto> UpdateAsync(Guid id, UpdateHandoverProtocolDto dto)
        {
            var protocol = await _context.HandoverProtocols.FindAsync(id);
            if (protocol == null)
            {
                throw new InvalidOperationException("Không tìm thấy biên bản bàn giao.");
            }

            await EnsureNotLockedBySettlementAsync(protocol.RentalRequestId);

            if (dto.DispatchOdo.HasValue) protocol.DispatchOdo = dto.DispatchOdo.Value;
            if (dto.HandoverOdo.HasValue) protocol.HandoverOdo = dto.HandoverOdo.Value;
            else if (dto.OdoAtHandover > 0) protocol.HandoverOdo = dto.OdoAtHandover;

            if (dto.DispatchFuelLevel.HasValue) protocol.DispatchFuelLevel = dto.DispatchFuelLevel.Value;
            if (dto.HandoverFuelLevel.HasValue) protocol.HandoverFuelLevel = dto.HandoverFuelLevel.Value;
            else protocol.HandoverFuelLevel = (decimal)ParseFuelLevel(dto.FuelLevel);

            if (!string.IsNullOrWhiteSpace(dto.HandoverDashPhotoUrl)) protocol.HandoverDashPhotoUrl = dto.HandoverDashPhotoUrl;
            if (!string.IsNullOrWhiteSpace(dto.TransitAnomalyNote)) protocol.TransitAnomalyNote = dto.TransitAnomalyNote;
            if (!string.IsNullOrWhiteSpace(dto.DispatchDamageMap)) protocol.DispatchDamageMap = dto.DispatchDamageMap;
            if (!string.IsNullOrWhiteSpace(dto.HandoverDamageMap)) protocol.HandoverDamageMap = dto.HandoverDamageMap;

            // Đồng bộ cột cũ
            protocol.OdoAtHandover = protocol.HandoverOdo;
            protocol.FuelLevel = (int)Math.Round(protocol.HandoverFuelLevel);
            protocol.DamagePointsJson = protocol.HandoverDamageMap ?? dto.DamagePointsJson ?? protocol.DamagePointsJson;
            protocol.ExteriorCondition = dto.ExteriorCondition;
            protocol.InteriorCondition = dto.InteriorCondition;
            protocol.TireCondition = dto.TireCondition;
            protocol.AccessoriesChecklist = dto.AccessoriesChecklist;
            protocol.ExistingScratchesNotes = dto.ExistingScratchesNotes;
            protocol.EvidencePhotoUrls = dto.EvidencePhotoUrls;
            protocol.StaffNotes = dto.StaffNotes;
            protocol.StaffSignature = dto.StaffSignature;
            protocol.CustomerSignature = dto.CustomerSignature;
            if (!string.IsNullOrWhiteSpace(dto.Status)) protocol.Status = dto.Status;
            protocol.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (await GetByIdAsync(protocol.Id))!;
        }

        public async Task<HandoverProtocolDto> ConfirmHandoverAsync(Guid id, HandoverConfirmDto dto)
        {
            var protocol = await _context.HandoverProtocols
                .Include(h => h.RentalContract)
                .Include(h => h.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (protocol == null)
                throw new KeyNotFoundException("Không tìm thấy biên bản bàn giao xe.");

            await EnsureNotLockedBySettlementAsync(protocol.RentalRequestId);

            var request = protocol.RentalRequest;
            if (request == null)
                throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe liên kết.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Cập nhật thông tin bàn giao thực tế
                if (dto.HandoverOdo.HasValue && dto.HandoverOdo.Value > 0)
                {
                    protocol.HandoverOdo = dto.HandoverOdo.Value;
                }
                if (dto.HandoverFuelLevel.HasValue)
                {
                    protocol.HandoverFuelLevel = dto.HandoverFuelLevel.Value;
                }
                if (!string.IsNullOrWhiteSpace(dto.HandoverDashPhotoUrl))
                {
                    protocol.HandoverDashPhotoUrl = dto.HandoverDashPhotoUrl;
                }

                // Bẫy 3: Audit ODO chiều đi
                int dispatchOdo = protocol.DispatchOdo ?? (request.Vehicle?.CurrentMileage ?? 0);
                int handoverOdo = protocol.HandoverOdo > 0 ? protocol.HandoverOdo : dispatchOdo;
                protocol.DispatchOdo = dispatchOdo;
                protocol.HandoverOdo = handoverOdo;

                var (hasAnomaly, anomalyNote) = await ValidateTransitOdoAsync(
                    dispatchOdo,
                    handoverOdo,
                    request.EstimatedDeliveryDistanceKm,
                    dto.TransitAnomalyNote ?? protocol.TransitAnomalyNote);

                protocol.HasTransitAnomaly = hasAnomaly;
                protocol.TransitAnomalyNote = anomalyNote;

                // Bẫy 1: Cảnh báo sụt giảm nhiên liệu > 15%
                decimal dispatchFuel = protocol.DispatchFuelLevel ?? 100m;
                protocol.DispatchFuelLevel = dispatchFuel;
                protocol.StaffNotes = CheckFuelDropAlert(dispatchFuel, protocol.HandoverFuelLevel, protocol.StaffNotes);

                // Bẫy 2: Sơ đồ xước 2D diff marker & tự động tạo IncidentReport cho vết xước trung chuyển
                string handoverMapInput = !string.IsNullOrWhiteSpace(dto.HandoverDamageMap)
                    ? dto.HandoverDamageMap
                    : (protocol.HandoverDamageMap ?? protocol.DispatchDamageMap ?? "[]");

                var (mergedHandoverMap, newTransitMarkers) = DiffAndTagTransitMarkers(protocol.DispatchDamageMap, handoverMapInput);
                protocol.HandoverDamageMap = mergedHandoverMap;

                if (newTransitMarkers.Count > 0)
                {
                    string staffName = !string.IsNullOrWhiteSpace(dto.StaffName) ? dto.StaffName : protocol.StaffName;
                    var incident = new IncidentReport
                    {
                        Id = Guid.NewGuid(),
                        IncidentCode = $"SC-NB-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}",
                        RentalRequestId = request.Id,
                        CarId = request.CarId,
                        CustomerId = null,
                        CustomerName = request.CustomerName,
                        CustomerPhone = request.CustomerPhone,
                        IncidentType = "INTERNAL_TRANSIT",
                        Severity = "LOW",
                        Location = request.PickupLocation ?? "Tuyến đường trung chuyển giao xe",
                        Description = $"Phát sinh {newTransitMarkers.Count} vết xước mới trên sơ đồ 2D trong quá trình trung chuyển giao xe từ bãi tới khách hàng. Trách nhiệm nhân viên giao xe: {staffName}.",
                        ResponsibleParty = "STAFF",
                        CustomerPayAmount = 0,
                        StaffPayAmount = 0,
                        CompanyPayAmount = 0,
                        Status = "REPORTED",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.IncidentReports.Add(incident);
                }

                // Cập nhật chữ ký và ghi chú
                if (!string.IsNullOrWhiteSpace(dto.StaffName)) protocol.StaffName = dto.StaffName;
                if (!string.IsNullOrWhiteSpace(dto.StaffSignature)) protocol.StaffSignature = dto.StaffSignature;
                if (!string.IsNullOrWhiteSpace(dto.CustomerSignature)) protocol.CustomerSignature = dto.CustomerSignature;
                if (!string.IsNullOrWhiteSpace(dto.Notes)) protocol.StaffNotes = $"{protocol.StaffNotes}\n[Xác nhận bàn giao]: {dto.Notes}".Trim();

                // Kiểm tra ràng buộc chữ ký kép
                if (string.IsNullOrWhiteSpace(protocol.StaffSignature) || string.IsNullOrWhiteSpace(protocol.CustomerSignature))
                {
                    throw new InvalidOperationException("Bắt buộc phải có chữ ký xác nhận kép của cả Nhân viên giao xe và Khách hàng trước khi hoàn tất bàn giao.");
                }

                // Đồng bộ cột cũ
                protocol.OdoAtHandover = protocol.HandoverOdo;
                protocol.FuelLevel = (int)Math.Round(protocol.HandoverFuelLevel);
                protocol.DamagePointsJson = protocol.HandoverDamageMap;
                protocol.Status = "COMPLETED";
                protocol.HandoverDate = DateTime.UtcNow;
                protocol.UpdatedAt = DateTime.UtcNow;

                // Chuyển trạng thái State Machine đồng bộ 3 bảng
                request.Status = "ACTIVE";
                request.IsSecurityDepositPaid = true;
                request.UpdatedAt = DateTime.UtcNow;

                if (protocol.RentalContract != null)
                {
                    protocol.RentalContract.Status = "ACTIVE";
                    protocol.RentalContract.UpdatedAt = DateTime.UtcNow;
                }

                if (request.Vehicle != null)
                {
                    request.Vehicle.Status = VehicleStatus.RENTED;
                    if (protocol.HandoverOdo > request.Vehicle.CurrentMileage)
                    {
                        request.Vehicle.CurrentMileage = protocol.HandoverOdo;
                    }
                    request.Vehicle.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return (await GetByIdAsync(protocol.Id))!;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var protocol = await _context.HandoverProtocols.FindAsync(id);
            if (protocol == null) return false;

            await EnsureNotLockedBySettlementAsync(protocol.RentalRequestId);

            _context.HandoverProtocols.Remove(protocol);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string?> GetLatestDamagePointsByCarIdAsync(Guid carId)
        {
            var latestReturn = await _context.ReturnProtocols
                .Include(r => r.RentalRequest)
                .Where(r => r.RentalRequest != null && r.RentalRequest.CarId == carId && (!string.IsNullOrWhiteSpace(r.ReturnDamageMap) || !string.IsNullOrWhiteSpace(r.DamagePointsJson)))
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (latestReturn != null)
            {
                var map = !string.IsNullOrWhiteSpace(latestReturn.ReturnDamageMap) ? latestReturn.ReturnDamageMap : latestReturn.DamagePointsJson;
                if (!string.IsNullOrWhiteSpace(map)) return map;
            }

            var latestHandover = await _context.HandoverProtocols
                .Include(h => h.RentalRequest)
                .Where(h => h.RentalRequest != null && h.RentalRequest.CarId == carId && (!string.IsNullOrWhiteSpace(h.HandoverDamageMap) || !string.IsNullOrWhiteSpace(h.DamagePointsJson)))
                .OrderByDescending(h => h.CreatedAt)
                .FirstOrDefaultAsync();

            return latestHandover?.HandoverDamageMap ?? latestHandover?.DamagePointsJson;
        }

        private async Task EnsureNotLockedBySettlementAsync(Guid? rentalRequestId)
        {
            if (!rentalRequestId.HasValue) return;

            var settlement = await _context.RentalSettlements
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.RentalRequestId == rentalRequestId.Value);

            if (settlement != null && (settlement.Status == "PARTIALLY_SETTLED" || settlement.Status == "SETTLED" || settlement.Status == "CLOSED"))
            {
                throw new InvalidOperationException("Biên bản bàn giao đã bị khóa cứng vì hồ sơ quyết toán (RentalSettlement) đã chốt.");
            }
        }

        private async Task<(bool hasAnomaly, string? anomalyNote)> ValidateTransitOdoAsync(
            int dispatchOdo,
            int handoverOdo,
            decimal? estDistanceKm,
            string? anomalyNote)
        {
            if (handoverOdo < dispatchOdo)
            {
                throw new ArgumentException($"Chỉ số ODO lúc bàn giao ({handoverOdo:N0} km) không thể nhỏ hơn ODO xuất bãi ({dispatchOdo:N0} km). Vui lòng kiểm tra lại ảnh đồng hồ taplo.");
            }

            decimal maxDefaultTransitKm = await _settingsService.GetSettingValueAsync("max_default_transit_km", 50.0m);
            decimal maxAllowedKm = (estDistanceKm.HasValue && estDistanceKm.Value > 0)
                ? (estDistanceKm.Value * 1.3m + 5.0m)
                : maxDefaultTransitKm;

            int transitKm = handoverOdo - dispatchOdo;

            if (transitKm > (maxAllowedKm * 3.0m) || transitKm > 300)
            {
                throw new ArgumentException($"Quãng đường trung chuyển ({transitKm:N0} km) vượt quá 3 lần hạn mức cho phép ({maxAllowedKm * 3.0m:N0} km) hoặc vượt 300 km nội thành. Vui lòng đối chiếu đồng hồ taplo và xác minh lại ODO.");
            }

            if (transitKm > maxAllowedKm)
            {
                if (string.IsNullOrWhiteSpace(anomalyNote))
                {
                    throw new ArgumentException($"Quãng đường trung chuyển ({transitKm:N0} km) vượt định mức cho phép ({maxAllowedKm:N0} km). Bắt buộc phải nhập lý do giải trình (transit_anomaly_note).");
                }
                return (true, anomalyNote.Trim());
            }

            return (false, anomalyNote);
        }

        private static string? CheckFuelDropAlert(decimal dispatchFuel, decimal handoverFuel, string? currentStaffNotes)
        {
            decimal fuelDrop = dispatchFuel - handoverFuel;
            if (fuelDrop > 15.0m)
            {
                string alert = $"[CẢNH BÁO NỘI BỘ {DateTime.UtcNow:dd/MM/yyyy HH:mm}]: Mức nhiên liệu sụt giảm bất thường khi trung chuyển ({dispatchFuel:N1}% -> {handoverFuel:N1}%, hao hụt {fuelDrop:N1}% > 15%). Cần kiểm tra rò rỉ hoặc gian lận.";
                return string.IsNullOrWhiteSpace(currentStaffNotes)
                    ? alert
                    : $"{currentStaffNotes}\n{alert}";
            }
            return currentStaffNotes;
        }

        private static string EnsureMarkersStage(string? json, string defaultStage)
        {
            if (string.IsNullOrWhiteSpace(json)) return "[]";
            try
            {
                var node = JsonNode.Parse(json);
                if (node is JsonArray arr)
                {
                    foreach (var item in arr)
                    {
                        if (item is JsonObject obj)
                        {
                            if (!obj.ContainsKey("stage") || string.IsNullOrWhiteSpace(obj["stage"]?.ToString()))
                            {
                                obj["stage"] = defaultStage;
                            }
                            if (!obj.ContainsKey("id") || string.IsNullOrWhiteSpace(obj["id"]?.ToString()))
                            {
                                obj["id"] = $"dmg-{Guid.NewGuid().ToString()[..8]}";
                            }
                        }
                    }
                    return arr.ToJsonString();
                }
            }
            catch { }
            return json;
        }

        private static (string mergedJson, List<JsonObject> newMarkers) DiffAndTagTransitMarkers(string? dispatchMapJson, string? handoverMapJson)
        {
            var dispatchIds = new HashSet<string>();
            var dispatchList = new List<JsonObject>();

            if (!string.IsNullOrWhiteSpace(dispatchMapJson))
            {
                try
                {
                    if (JsonNode.Parse(dispatchMapJson) is JsonArray dArr)
                    {
                        foreach (var item in dArr)
                        {
                            if (item is JsonObject obj)
                            {
                                var id = obj["id"]?.ToString();
                                if (!string.IsNullOrEmpty(id))
                                {
                                    dispatchIds.Add(id);
                                    dispatchList.Add(obj);
                                }
                            }
                        }
                    }
                }
                catch { }
            }

            var resultList = new List<JsonObject>();
            var newMarkers = new List<JsonObject>();

            if (!string.IsNullOrWhiteSpace(handoverMapJson))
            {
                try
                {
                    if (JsonNode.Parse(handoverMapJson) is JsonArray hArr)
                    {
                        var seenHandoverIds = new HashSet<string>();
                        foreach (var item in hArr)
                        {
                            if (item is JsonObject obj)
                            {
                                var id = obj["id"]?.ToString() ?? $"dmg-{Guid.NewGuid().ToString()[..8]}";
                                obj["id"] = id;
                                seenHandoverIds.Add(id);

                                if (dispatchIds.Contains(id))
                                {
                                    obj["stage"] = "PRE_EXISTING";
                                    resultList.Add(obj);
                                }
                                else
                                {
                                    obj["stage"] = "TRANSIT_DELIVERY";
                                    resultList.Add(obj);
                                    newMarkers.Add(obj);
                                }
                            }
                        }

                        // Không cho phép xóa marker đã có từ lúc rời bãi
                        foreach (var dObj in dispatchList)
                        {
                            var id = dObj["id"]?.ToString();
                            if (!string.IsNullOrEmpty(id) && !seenHandoverIds.Contains(id))
                            {
                                dObj["stage"] = "PRE_EXISTING";
                                resultList.Insert(0, dObj);
                            }
                        }
                    }
                }
                catch { }
            }
            else
            {
                resultList.AddRange(dispatchList);
            }

            var resArray = new JsonArray();
            foreach (var r in resultList)
            {
                resArray.Add(r.DeepClone());
            }

            return (resArray.ToJsonString(), newMarkers);
        }

        private static int ParseFuelLevel(string? fl)
        {
            if (string.IsNullOrWhiteSpace(fl)) return 100;
            var digits = new string(fl.Where(char.IsDigit).ToArray());
            return int.TryParse(digits, out int val) ? val : 100;
        }

        private static HandoverProtocolDto MapToDto(HandoverProtocol h)
        {
            var car = h.RentalRequest?.Vehicle;
            return new HandoverProtocolDto
            {
                Id = h.Id,
                ProtocolNumber = h.ProtocolNumber ?? $"BBBG-{h.Id.ToString()[..8].ToUpper()}",
                RentalRequestId = h.RentalRequestId ?? Guid.Empty,
                ContractId = h.ContractId,
                ContractNumber = h.RentalContract?.ContractNumber,
                CarId = car?.Id ?? Guid.Empty,
                LicensePlate = car?.LicensePlate,
                CarMake = car?.Make,
                CarModel = car?.Model,
                CarImageUrl = car?.ImageUrl,
                HandoverDate = h.HandoverDate,
                StaffName = h.StaffName,
                StaffId = h.StaffId,
                CustomerName = h.CustomerName ?? h.RentalRequest?.CustomerName ?? string.Empty,
                CustomerPhone = h.CustomerPhone ?? h.RentalRequest?.CustomerPhone ?? string.Empty,

                // Single Source of Truth
                DispatchOdo = h.DispatchOdo,
                HandoverOdo = h.HandoverOdo > 0 ? h.HandoverOdo : h.OdoAtHandover,
                DispatchFuelLevel = h.DispatchFuelLevel,
                HandoverFuelLevel = h.HandoverFuelLevel,
                HandoverDashPhotoUrl = h.HandoverDashPhotoUrl,
                HasTransitAnomaly = h.HasTransitAnomaly,
                TransitAnomalyNote = h.TransitAnomalyNote,
                DispatchDamageMap = h.DispatchDamageMap,
                HandoverDamageMap = h.HandoverDamageMap ?? h.DamagePointsJson,

                // Cột cũ để tương thích ngược
                OdoAtHandover = h.HandoverOdo > 0 ? h.HandoverOdo : h.OdoAtHandover,
                FuelLevel = $"{h.HandoverFuelLevel:N0}%",
                ExteriorCondition = h.ExteriorCondition ?? string.Empty,
                InteriorCondition = h.InteriorCondition ?? string.Empty,
                TireCondition = h.TireCondition ?? string.Empty,
                AccessoriesChecklist = h.AccessoriesChecklist ?? string.Empty,
                ExistingScratchesNotes = h.ExistingScratchesNotes,
                DamagePointsJson = h.HandoverDamageMap ?? h.DamagePointsJson,
                EvidencePhotoUrls = h.EvidencePhotoUrls,
                StaffNotes = h.StaffNotes,
                StaffSignature = h.StaffSignature,
                CustomerSignature = h.CustomerSignature,
                Status = h.Status,
                CreatedAt = h.CreatedAt
            };
        }
    }
}
