using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Analytics;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    /// <summary>
    /// Service phân tích & báo cáo vận hành tối ưu hiệu năng cao.
    /// Toàn bộ phép tính tổng, nhóm, đếm đều được đẩy trực tiếp xuống PostgreSQL qua LINQ (AsNoTracking, GroupBy, Sum, Count),
    /// tuyệt đối không tải toàn bộ bảng lên RAM để chống lỗi tràn bộ nhớ (Out-Of-Memory).
    /// </summary>
    public class AnalyticsService : IAnalyticsService
    {
        private readonly AppDbContext _context;

        public AnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardOverviewDto> GetDashboardOverviewAsync(DateTime? fromDate = null, DateTime? toDate = null, bool isStaffOnly = false)
        {
            var now = DateTime.UtcNow;
            var firstDayThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var firstDayLastMonth = firstDayThisMonth.AddMonths(-1);

            // 1. Fleet status aggregation (Đẩy trực tiếp xuống PostgreSQL bằng GroupBy)
            var vehicleStatusCounts = await _context.Vehicles
                .AsNoTracking()
                .Where(v => v.IsActive && v.Status != VehicleStatus.INACTIVE)
                .GroupBy(v => v.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            int totalVehicles = vehicleStatusCounts.Sum(x => x.Count);
            int readyVehicles = vehicleStatusCounts.FirstOrDefault(x => x.Status == VehicleStatus.READY)?.Count ?? 0;
            int rentedVehicles = vehicleStatusCounts.FirstOrDefault(x => x.Status == VehicleStatus.RENTED)?.Count ?? 0;
            int bookedVehicles = vehicleStatusCounts.FirstOrDefault(x => x.Status == VehicleStatus.BOOKED)?.Count ?? 0;
            int maintenanceVehicles = vehicleStatusCounts.FirstOrDefault(x => x.Status == VehicleStatus.MAINTENANCE)?.Count ?? 0;
            int repairVehicles = vehicleStatusCounts.FirstOrDefault(x => x.Status == VehicleStatus.REPAIR)?.Count ?? 0;

            // Tỷ lệ khai thác xe lăn bánh khớp 100% với hiển thị (rentedVehicles / totalVehicles)
            decimal fleetUtilization = totalVehicles > 0
                ? Math.Round(((decimal)rentedVehicles / totalVehicles) * 100m, 1)
                : 0m;

            // 2. Rental Request metrics (Lọc theo khoảng thời gian và GroupBy theo Status)
            var requestQuery = _context.RentalRequests.AsNoTracking();
            if (fromDate.HasValue) requestQuery = requestQuery.Where(r => r.CreatedAt >= fromDate.Value);
            if (toDate.HasValue) requestQuery = requestQuery.Where(r => r.CreatedAt <= toDate.Value);

            var requestStatusCounts = await requestQuery
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            int totalRequests = requestStatusCounts.Sum(x => x.Count);
            int pendingRequests = requestStatusCounts.FirstOrDefault(x => x.Status == "PENDING")?.Count ?? 0;
            int activeRentals = requestStatusCounts.FirstOrDefault(x => x.Status == "ACTIVE")?.Count ?? 0;
            int holdingRequests = requestStatusCounts.FirstOrDefault(x => x.Status == "HOLDING")?.Count ?? 0;
            int disputedRequests = requestStatusCounts.FirstOrDefault(x => x.Status == "DISPUTED")?.Count ?? 0;
            int completedRentals = requestStatusCounts.FirstOrDefault(x => x.Status == "COMPLETED")?.Count ?? 0;
            int cancelledRequests = requestStatusCounts.FirstOrDefault(x => x.Status == "CANCELLED")?.Count ?? 0;

            // 3. Operational metrics
            int totalIncidents = await _context.IncidentReports.AsNoTracking().CountAsync();
            int activeExtensions = await _context.RentalExtensions.AsNoTracking().CountAsync(e => e.Status == "APPROVED");
            int totalExtensionsCount = await _context.RentalExtensions.AsNoTracking().CountAsync();

            var incidentAggregates = await _context.IncidentReports
                .AsNoTracking()
                .GroupBy(i => 1)
                .Select(g => new
                {
                    ClaimsCount = g.Count(i => i.InsuranceCoverageStatus == "COVERED" || i.InsuranceCoverageStatus == "PENDING_CLAIM"),
                    TotalCompensation = g.Sum(i => (decimal?)i.CustomerPayAmount) ?? 0m,
                    TotalEstimatedDamage = g.Sum(i => (decimal?)i.EstimatedDamageCost) ?? 0m
                })
                .FirstOrDefaultAsync();

            int insuranceClaimsCount = incidentAggregates?.ClaimsCount ?? 0;

            int lateReturnsCount = await _context.ReturnProtocols
                .AsNoTracking()
                .Where(p => p.RentalRequest != null && p.ReturnDate > p.RentalRequest.EndTime)
                .CountAsync();

            // 4. Revenue metrics (Chỉ tính và trả về cho MANAGER và ADMIN. STAFF nhận null hoàn toàn để bảo mật)
            decimal? totalRevenue = null;
            decimal? thisMonthRevenue = null;
            decimal? revenueGrowth = null;
            List<MonthlyRevenueItemDto>? monthlyRevenue = null;
            decimal? totalCompensationCollected = null;
            decimal? totalRepairCost = null;
            decimal? riskRecoveryRatio = null;

            if (!isStaffOnly)
            {
                totalCompensationCollected = incidentAggregates?.TotalCompensation ?? 0m;
                decimal totalMaintCost = await _context.MaintenanceRecords.AsNoTracking().SumAsync(m => (decimal?)m.Cost) ?? 0m;
                totalRepairCost = (incidentAggregates?.TotalEstimatedDamage ?? 0m) + totalMaintCost;
                riskRecoveryRatio = totalRepairCost > 0
                    ? Math.Min(100m, Math.Round(((decimal)totalCompensationCollected / totalRepairCost.Value) * 100m, 1))
                    : (totalCompensationCollected > 0 ? 100m : 0m);

                var validContractStatuses = new[] { "DEPOSIT_PAID", "CONFIRMED", "ACTIVE", "HOLDING", "DISPUTED", "COMPLETED" };
                var contractRevQuery = _context.RentalContracts.AsNoTracking().Where(c => validContractStatuses.Contains(c.Status));
                var settlementRevQuery = _context.RentalSettlements.AsNoTracking();

                decimal baseContractRevenue = await contractRevQuery.SumAsync(c => (decimal?)c.TotalFee) ?? 0m;
                decimal deductionsRevenue = await settlementRevQuery.SumAsync(s => (decimal?)s.TotalDeduction) ?? 0m;
                totalRevenue = baseContractRevenue + deductionsRevenue;

                // Doanh thu tháng này
                decimal thisMonthContractRevenue = await contractRevQuery
                    .Where(c => c.CreatedAt >= firstDayThisMonth)
                    .SumAsync(c => (decimal?)c.TotalFee) ?? 0m;
                decimal thisMonthDeductions = await settlementRevQuery
                    .Where(s => s.CreatedAt != null && s.CreatedAt >= firstDayThisMonth)
                    .SumAsync(s => (decimal?)s.TotalDeduction) ?? 0m;
                thisMonthRevenue = thisMonthContractRevenue + thisMonthDeductions;

                // Doanh thu tháng trước
                decimal lastMonthContractRevenue = await contractRevQuery
                    .Where(c => c.CreatedAt >= firstDayLastMonth && c.CreatedAt < firstDayThisMonth)
                    .SumAsync(c => (decimal?)c.TotalFee) ?? 0m;
                decimal lastMonthDeductions = await settlementRevQuery
                    .Where(s => s.CreatedAt != null && s.CreatedAt >= firstDayLastMonth && s.CreatedAt < firstDayThisMonth)
                    .SumAsync(s => (decimal?)s.TotalDeduction) ?? 0m;
                decimal lastMonthRevenue = lastMonthContractRevenue + lastMonthDeductions;

                revenueGrowth = lastMonthRevenue > 0
                    ? Math.Round(((thisMonthRevenue.Value - lastMonthRevenue) / lastMonthRevenue) * 100m, 1)
                    : (thisMonthRevenue.Value > 0 ? 100m : 0m);

                // 6-month revenue chart
                var sixMonthsAgo = firstDayThisMonth.AddMonths(-5);
                var contractsByMonth = await contractRevQuery
                    .Where(c => c.CreatedAt != null && c.CreatedAt >= sixMonthsAgo)
                    .GroupBy(c => new { Year = c.CreatedAt!.Value.Year, Month = c.CreatedAt!.Value.Month })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Month,
                        Revenue = g.Sum(c => c.TotalFee),
                        Count = g.Count()
                    })
                    .ToListAsync();

                var deductionsByMonth = await settlementRevQuery
                    .Where(s => s.CreatedAt != null && s.CreatedAt >= sixMonthsAgo)
                    .GroupBy(s => new { Year = s.CreatedAt!.Value.Year, Month = s.CreatedAt!.Value.Month })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Month,
                        Deduction = g.Sum(s => s.TotalDeduction)
                    })
                    .ToListAsync();

                monthlyRevenue = new List<MonthlyRevenueItemDto>();
                for (int i = 5; i >= 0; i--)
                {
                    var monthStart = firstDayThisMonth.AddMonths(-i);
                    string monthLabel = $"T{monthStart.Month}/{monthStart.Year}";

                    var cData = contractsByMonth.FirstOrDefault(x => x.Year == monthStart.Year && x.Month == monthStart.Month);
                    var dData = deductionsByMonth.FirstOrDefault(x => x.Year == monthStart.Year && x.Month == monthStart.Month);

                    monthlyRevenue.Add(new MonthlyRevenueItemDto
                    {
                        MonthLabel = monthLabel,
                        Revenue = (cData?.Revenue ?? 0m) + (dData?.Deduction ?? 0m),
                        BookingCount = cData?.Count ?? 0
                    });
                }
            }

            // 5. Top 5 xe (Nếu STAFF: ẩn tổng doanh thu của từng xe)
            var topVehiclesData = await _context.RentalRequests
                .AsNoTracking()
                .Where(r => r.Status == "ACTIVE" || r.Status == "COMPLETED" || r.Status == "CONFIRMED")
                .GroupBy(r => r.CarId)
                .Select(g => new
                {
                    CarId = g.Key,
                    RentalCount = g.Count(),
                    TotalRevenue = g.Sum(r => r.EstimatedTotalFee)
                })
                .OrderByDescending(x => x.RentalCount)
                .Take(5)
                .ToListAsync();

            var topCarIds = topVehiclesData.Select(x => x.CarId).ToList();
            var topVehiclesMap = await _context.Vehicles
                .AsNoTracking()
                .Where(v => topCarIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id);

            var topVehicles = topVehiclesData.Select(t =>
            {
                topVehiclesMap.TryGetValue(t.CarId, out var veh);
                return new TopVehicleItemDto
                {
                    VehicleId = t.CarId,
                    Make = veh?.Make ?? "VELORA",
                    Model = veh?.Model ?? "Xe",
                    LicensePlate = veh?.LicensePlate ?? "",
                    RentalCount = t.RentalCount,
                    TotalRevenue = isStaffOnly ? null : t.TotalRevenue,
                    ImageUrl = veh?.ImageUrl
                };
            }).ToList();

            // 7. Hoạt động gần đây (Ẩn số tiền quyết toán nếu STAFF)
            var recentActivities = new List<RecentActivityItemDto>();

            var recentRequests = await _context.RentalRequests
                .AsNoTracking()
                .Include(r => r.Vehicle)
                .OrderByDescending(r => r.CreatedAt)
                .Take(4)
                .Select(req => new RecentActivityItemDto
                {
                    Id = req.Id.ToString(),
                    Type = "REQUEST",
                    Title = $"Đơn thuê: {req.CustomerName}",
                    Subtitle = req.Vehicle != null ? $"{req.Vehicle.Make} {req.Vehicle.Model} ({req.Vehicle.LicensePlate})" : "Chưa rõ xe",
                    Timestamp = req.CreatedAt,
                    Status = req.Status
                })
                .ToListAsync();

            var recentSettlements = await _context.RentalSettlements
                .AsNoTracking()
                .OrderByDescending(s => s.CreatedAt)
                .Take(2)
                .Select(stl => new RecentActivityItemDto
                {
                    Id = stl.Id.ToString(),
                    Type = "RETURN",
                    Title = $"Quyết toán: {stl.SettlementNumber}",
                    Subtitle = isStaffOnly
                        ? $"Phiếu quyết toán {stl.Status}"
                        : $"Hoàn cọc: {stl.RefundAmount:N0}đ • Khấu trừ: {stl.TotalDeduction:N0}đ",
                    Timestamp = stl.CreatedAt ?? DateTime.UtcNow,
                    Status = stl.Status
                })
                .ToListAsync();

            var recentIncidents = await _context.IncidentReports
                .AsNoTracking()
                .OrderByDescending(i => i.CreatedAt)
                .Take(2)
                .Select(inc => new RecentActivityItemDto
                {
                    Id = inc.Id.ToString(),
                    Type = "INCIDENT",
                    Title = $"Sự cố: {inc.IncidentCode}",
                    Subtitle = $"{inc.Severity} • {inc.Location}",
                    Timestamp = inc.CreatedAt,
                    Status = inc.Status
                })
                .ToListAsync();

            recentActivities.AddRange(recentRequests);
            recentActivities.AddRange(recentSettlements);
            recentActivities.AddRange(recentIncidents);
            recentActivities = recentActivities.OrderByDescending(a => a.Timestamp).Take(8).ToList();

            // 8. Cảnh báo hậu kiểm trung chuyển dành riêng cho MANAGER và ADMIN
            TransitAnomalySummaryDto? transitAnomalies = null;
            if (!isStaffOnly)
            {
                int handoverAnomaliesCount = await _context.HandoverProtocols.AsNoTracking().CountAsync(p => p.HasTransitAnomaly);
                int returnAnomaliesCount = await _context.ReturnProtocols.AsNoTracking().CountAsync(p => p.HasReturnAnomaly);
                int internalTransitIncidentsCount = await _context.IncidentReports.AsNoTracking()
                    .CountAsync(i => i.IncidentType == "INTERNAL_TRANSIT" || i.ResponsibleParty == "STAFF");

                var recentHandoverAnomalies = await _context.HandoverProtocols
                    .AsNoTracking()
                    .Include(p => p.RentalRequest)
                        .ThenInclude(r => r!.Vehicle)
                    .Where(p => p.HasTransitAnomaly)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(5)
                    .Select(p => new TransitAnomalyItemDto
                    {
                        Id = p.Id.ToString(),
                        Type = "HANDOVER_ANOMALY",
                        RentalRequestId = p.RentalRequestId ?? Guid.Empty,
                        VehicleName = p.RentalRequest != null && p.RentalRequest.Vehicle != null ? $"{p.RentalRequest.Vehicle.Make} {p.RentalRequest.Vehicle.Model}" : "Phương tiện",
                        LicensePlate = p.RentalRequest != null && p.RentalRequest.Vehicle != null ? p.RentalRequest.Vehicle.LicensePlate : "",
                        Description = p.TransitAnomalyNote ?? $"Lệch ODO giao xe: {p.HandoverOdo - (p.DispatchOdo ?? p.HandoverOdo)} km",
                        Timestamp = p.CreatedAt ?? DateTime.UtcNow,
                        StaffName = p.StaffName,
                        OdoDifference = p.HandoverOdo - (p.DispatchOdo ?? p.HandoverOdo)
                    })
                    .ToListAsync();

                var recentReturnAnomalies = await _context.ReturnProtocols
                    .AsNoTracking()
                    .Include(p => p.RentalRequest)
                        .ThenInclude(r => r!.Vehicle)
                    .Where(p => p.HasReturnAnomaly)
                    .OrderByDescending(p => p.CreatedAt)
                    .Take(5)
                    .Select(p => new TransitAnomalyItemDto
                    {
                        Id = p.Id.ToString(),
                        Type = "RETURN_ANOMALY",
                        RentalRequestId = p.RentalRequestId ?? Guid.Empty,
                        VehicleName = p.RentalRequest != null && p.RentalRequest.Vehicle != null ? $"{p.RentalRequest.Vehicle.Make} {p.RentalRequest.Vehicle.Model}" : "Phương tiện",
                        LicensePlate = p.RentalRequest != null && p.RentalRequest.Vehicle != null ? p.RentalRequest.Vehicle.LicensePlate : "",
                        Description = p.ReturnAnomalyNote ?? $"Lệch ODO về bãi: {(p.YardCheckinOdo ?? p.CustomerReturnOdo) - p.CustomerReturnOdo} km",
                        Timestamp = p.CreatedAt ?? DateTime.UtcNow,
                        StaffName = p.StaffName,
                        OdoDifference = (p.YardCheckinOdo ?? p.CustomerReturnOdo) - p.CustomerReturnOdo
                    })
                    .ToListAsync();

                var recentInternalIncidents = await _context.IncidentReports
                    .AsNoTracking()
                    .Include(i => i.RentalRequest)
                        .ThenInclude(r => r!.Vehicle)
                    .Where(i => i.IncidentType == "INTERNAL_TRANSIT" || i.ResponsibleParty == "STAFF")
                    .OrderByDescending(i => i.CreatedAt)
                    .Take(5)
                    .Select(i => new TransitAnomalyItemDto
                    {
                        Id = i.Id.ToString(),
                        Type = "INTERNAL_TRANSIT_SCRATCH",
                        RentalRequestId = i.RentalRequestId,
                        VehicleName = i.RentalRequest != null && i.RentalRequest.Vehicle != null ? $"{i.RentalRequest.Vehicle.Make} {i.RentalRequest.Vehicle.Model}" : "Phương tiện",
                        LicensePlate = i.RentalRequest != null && i.RentalRequest.Vehicle != null ? i.RentalRequest.Vehicle.LicensePlate : "",
                        Description = i.Description ?? "Vết xước trung chuyển nội bộ (Staff giao xe)",
                        Timestamp = i.CreatedAt,
                        StaffName = i.HandledByStaffName ?? "Nhân viên giao xe",
                        OdoDifference = 0
                    })
                    .ToListAsync();

                var allAnomalies = new List<TransitAnomalyItemDto>();
                allAnomalies.AddRange(recentHandoverAnomalies);
                allAnomalies.AddRange(recentReturnAnomalies);
                allAnomalies.AddRange(recentInternalIncidents);

                transitAnomalies = new TransitAnomalySummaryDto
                {
                    TotalTransitAnomalies = handoverAnomaliesCount + returnAnomaliesCount + internalTransitIncidentsCount,
                    HandoverAnomaliesCount = handoverAnomaliesCount,
                    ReturnAnomaliesCount = returnAnomaliesCount,
                    InternalTransitIncidentsCount = internalTransitIncidentsCount,
                    RecentAnomalies = allAnomalies.OrderByDescending(a => a.Timestamp).Take(8).ToList()
                };
            }

            return new DashboardOverviewDto
            {
                TotalRevenue = totalRevenue,
                ThisMonthRevenue = thisMonthRevenue,
                RevenueGrowthPercent = revenueGrowth,
                TotalVehicles = totalVehicles,
                AvailableVehicles = readyVehicles,
                RentedVehicles = rentedVehicles,
                MaintenanceVehicles = maintenanceVehicles,
                BookedVehicles = bookedVehicles,
                RepairVehicles = repairVehicles,
                FleetUtilizationRate = fleetUtilization,
                TotalRentalRequests = totalRequests,
                PendingRequests = pendingRequests,
                ActiveRentals = activeRentals,
                HoldingRequests = holdingRequests,
                DisputedRequests = disputedRequests,
                CompletedRentals = completedRentals,
                TotalIncidents = totalIncidents,
                ActiveExtensions = activeExtensions,
                LateReturnsCount = lateReturnsCount,
                CancelledRequests = cancelledRequests,
                TotalExtensions = totalExtensionsCount,
                InsuranceClaimsCount = insuranceClaimsCount,
                TotalCompensationCollected = totalCompensationCollected,
                TotalRepairCost = totalRepairCost,
                RiskRecoveryRatio = riskRecoveryRatio,
                TopVehicles = topVehicles,
                MonthlyRevenue = monthlyRevenue,
                RecentActivities = recentActivities,
                TransitAnomalies = transitAnomalies
            };
        }

        public async Task<FleetUtilizationReportDto> GetFleetUtilizationReportAsync(DateTime? fromDate = null, DateTime? toDate = null, bool isStaffOnly = false)
        {
            // 1. Nhóm và tính toán thống kê thuê theo từng CarId trực tiếp tại DB
            var validRentalStatuses = new[] { "ACTIVE", "COMPLETED", "CONFIRMED" };
            var rentalQuery = _context.RentalRequests.AsNoTracking().Where(r => validRentalStatuses.Contains(r.Status));

            if (fromDate.HasValue) rentalQuery = rentalQuery.Where(r => r.CreatedAt >= fromDate.Value);
            if (toDate.HasValue) rentalQuery = rentalQuery.Where(r => r.CreatedAt <= toDate.Value);

            var rentalStatsByCar = await rentalQuery
                .GroupBy(r => r.CarId)
                .Select(g => new
                {
                    CarId = g.Key,
                    RentalCount = g.Count(),
                    TotalDays = g.Sum(r => r.TotalDays),
                    TotalRevenue = g.Sum(r => r.EstimatedTotalFee)
                })
                .ToDictionaryAsync(x => x.CarId);

            // 2. Nhóm số vụ sự cố theo xe
            var incidentCountByCar = await _context.IncidentReports
                .AsNoTracking()
                .GroupBy(i => i.CarId)
                .Select(g => new { CarId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CarId, x => x.Count);

            // 3. Nhóm số lần bảo dưỡng theo xe
            var maintenanceCountByCar = await _context.MaintenanceRecords
                .AsNoTracking()
                .GroupBy(m => m.CarId)
                .Select(g => new { CarId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CarId, x => x.Count);

            // 4. Lấy thống kê trạng thái đội xe đang hoạt động đẩy xuống PostgreSQL
            var vehicleStatusCounts = await _context.Vehicles
                .AsNoTracking()
                .Where(v => v.IsActive && v.Status != VehicleStatus.INACTIVE)
                .GroupBy(v => v.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            int totalFleet = vehicleStatusCounts.Sum(x => x.Count);
            int rented = vehicleStatusCounts.FirstOrDefault(x => x.Status == VehicleStatus.RENTED)?.Count ?? 0;
            int ready = vehicleStatusCounts.FirstOrDefault(x => x.Status == VehicleStatus.READY)?.Count ?? 0;
            int inService = vehicleStatusCounts.Where(x => x.Status == VehicleStatus.MAINTENANCE || x.Status == VehicleStatus.REPAIR).Sum(x => x.Count);

            decimal overallRate = totalFleet > 0
                ? Math.Round(((decimal)rented / totalFleet) * 100m, 1)
                : 0m;

            var vehicles = await _context.Vehicles
                .AsNoTracking()
                .Where(v => v.IsActive && v.Status != VehicleStatus.INACTIVE)
                .ToListAsync();

            var items = new List<VehicleUtilizationItemDto>();

            foreach (var v in vehicles)
            {
                rentalStatsByCar.TryGetValue(v.Id, out var rStats);
                incidentCountByCar.TryGetValue(v.Id, out var incCount);
                maintenanceCountByCar.TryGetValue(v.Id, out var maintCount);

                int rentalCount = rStats?.RentalCount ?? 0;
                int totalDays = rStats?.TotalDays ?? 0;
                decimal revenue = isStaffOnly ? 0m : (rStats?.TotalRevenue ?? 0m);

                decimal util = totalDays > 0 ? Math.Min(100m, Math.Round((decimal)totalDays / 30m * 100m, 1)) : 0m;

                items.Add(new VehicleUtilizationItemDto
                {
                    VehicleId = v.Id,
                    Make = v.Make,
                    Model = v.Model,
                    LicensePlate = v.LicensePlate,
                    Status = v.Status.ToString(),
                    ManufactureYear = v.ManufactureYear,
                    DailyRate = v.DailyRate,
                    CurrentMileage = v.CurrentMileage,
                    TotalRentalCount = rentalCount,
                    TotalDaysRented = totalDays,
                    UtilizationPercentage = util,
                    TotalRevenueGenerated = revenue,
                    IncidentCount = incCount,
                    MaintenanceCount = maintCount
                });
            }

            return new FleetUtilizationReportDto
            {
                OverallUtilizationRate = overallRate,
                TotalFleetSize = totalFleet,
                CurrentlyRentedCount = rented,
                CurrentlyReadyCount = ready,
                InServiceCount = inService,
                Vehicles = items.OrderByDescending(i => i.TotalRevenueGenerated).ToList()
            };
        }
    }
}
