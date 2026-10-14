using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Analytics;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly AppDbContext _context;

        public AnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardOverviewDto> GetDashboardOverviewAsync()
        {
            var now = DateTime.UtcNow;
            var firstDayThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var firstDayLastMonth = firstDayThisMonth.AddMonths(-1);

            // Fleet stats
            var allVehicles = await _context.Vehicles.Where(v => v.IsActive).ToListAsync();
            int totalVehicles = allVehicles.Count;
            int readyVehicles = allVehicles.Count(v => v.Status == VehicleStatus.READY);
            int rentedVehicles = allVehicles.Count(v => v.Status == VehicleStatus.RENTED);
            int maintenanceVehicles = allVehicles.Count(v => v.Status == VehicleStatus.MAINTENANCE);
            int repairVehicles = allVehicles.Count(v => v.Status == VehicleStatus.REPAIR);

            decimal fleetUtilization = totalVehicles > 0
                ? Math.Round(((decimal)rentedVehicles / totalVehicles) * 100m, 1)
                : 0m;

            // Rental Request stats
            var requests = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .ToListAsync();

            int totalRequests = requests.Count;
            int pendingRequests = requests.Count(r => r.Status == "PENDING");
            int activeRentals = requests.Count(r => r.Status == "ACTIVE");
            int completedRentals = requests.Count(r => r.Status == "COMPLETED");

            // Operational stats
            int totalIncidents = await _context.IncidentReports.CountAsync();
            int activeExtensions = await _context.RentalExtensions.CountAsync(e => e.Status == "APPROVED");

            var returnProtocols = await _context.ReturnProtocols
                .Include(p => p.RentalRequest)
                .ToListAsync();

            int lateReturnsCount = returnProtocols.Count(p =>
                p.RentalRequest != null && p.ReturnDate > p.RentalRequest.EndTime);

            // Revenue calculation
            var contracts = await _context.RentalContracts.ToListAsync();
            var validContracts = contracts.Where(c =>
                c.Status == "DEPOSIT_PAID" || c.Status == "ACTIVE" || c.Status == "COMPLETED").ToList();

            decimal baseContractRevenue = validContracts.Sum(c => c.TotalFee);

            var settlements = await _context.RentalSettlements.ToListAsync();
            decimal deductionsRevenue = settlements.Sum(s => s.TotalDeduction);

            decimal totalRevenue = baseContractRevenue + deductionsRevenue;

            // This month revenue
            decimal thisMonthContractRevenue = validContracts
                .Where(c => c.CreatedAt >= firstDayThisMonth)
                .Sum(c => c.TotalFee);
            decimal thisMonthDeductions = settlements
                .Where(s => s.CreatedAt >= firstDayThisMonth)
                .Sum(s => s.TotalDeduction);
            decimal thisMonthRevenue = thisMonthContractRevenue + thisMonthDeductions;

            // Last month revenue
            decimal lastMonthContractRevenue = validContracts
                .Where(c => c.CreatedAt >= firstDayLastMonth && c.CreatedAt < firstDayThisMonth)
                .Sum(c => c.TotalFee);
            decimal lastMonthDeductions = settlements
                .Where(s => s.CreatedAt >= firstDayLastMonth && s.CreatedAt < firstDayThisMonth)
                .Sum(s => s.TotalDeduction);
            decimal lastMonthRevenue = lastMonthContractRevenue + lastMonthDeductions;

            decimal revenueGrowth = lastMonthRevenue > 0
                ? Math.Round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100m, 1)
                : (thisMonthRevenue > 0 ? 100m : 0m);

            // Top Vehicles by revenue & bookings
            var topVehicles = requests
                .Where(r => r.Status == "ACTIVE" || r.Status == "COMPLETED" || r.Status == "CONFIRMED")
                .GroupBy(r => r.CarId)
                .Select(g =>
                {
                    var veh = allVehicles.FirstOrDefault(v => v.Id == g.Key);
                    return new TopVehicleItemDto
                    {
                        VehicleId = g.Key,
                        Make = veh?.Make ?? "VELORA",
                        Model = veh?.Model ?? "Xe",
                        LicensePlate = veh?.LicensePlate ?? "",
                        RentalCount = g.Count(),
                        TotalRevenue = g.Sum(r => r.EstimatedTotalFee),
                        ImageUrl = veh?.ImageUrl
                    };
                })
                .OrderByDescending(t => t.TotalRevenue)
                .Take(5)
                .ToList();

            // Monthly Revenue (Last 6 Months)
            var monthlyRevenue = new List<MonthlyRevenueItemDto>();
            for (int i = 5; i >= 0; i--)
            {
                var monthStart = firstDayThisMonth.AddMonths(-i);
                var monthEnd = monthStart.AddMonths(1);
                string monthLabel = $"T{monthStart.Month}/{monthStart.Year}";

                var monthContracts = validContracts.Where(c => c.CreatedAt >= monthStart && c.CreatedAt < monthEnd).ToList();
                decimal monthRev = monthContracts.Sum(c => c.TotalFee);
                monthRev += settlements.Where(s => s.CreatedAt >= monthStart && s.CreatedAt < monthEnd).Sum(s => s.TotalDeduction);

                monthlyRevenue.Add(new MonthlyRevenueItemDto
                {
                    MonthLabel = monthLabel,
                    Revenue = monthRev,
                    BookingCount = monthContracts.Count
                });
            }

            // Recent Activities (Latest 8 items across entities)
            var recentActivities = new List<RecentActivityItemDto>();

            foreach (var req in requests.OrderByDescending(r => r.CreatedAt).Take(4))
            {
                recentActivities.Add(new RecentActivityItemDto
                {
                    Id = req.Id.ToString(),
                    Type = "REQUEST",
                    Title = $"Đơn thuê: {req.CustomerName}",
                    Subtitle = $"{req.Vehicle?.Make} {req.Vehicle?.Model} ({req.Vehicle?.LicensePlate})",
                    Timestamp = req.CreatedAt,
                    Status = req.Status
                });
            }

            foreach (var stl in settlements.OrderByDescending(s => s.CreatedAt).Take(2))
            {
                recentActivities.Add(new RecentActivityItemDto
                {
                    Id = stl.Id.ToString(),
                    Type = "RETURN",
                    Title = $"Quyết toán: {stl.SettlementNumber}",
                    Subtitle = $"Hoàn cọc: {stl.RefundAmount:N0}đ • Khấu trừ: {stl.TotalDeduction:N0}đ",
                    Timestamp = stl.CreatedAt ?? DateTime.UtcNow,
                    Status = stl.Status
                });
            }

            foreach (var inc in await _context.IncidentReports.OrderByDescending(i => i.CreatedAt).Take(2).ToListAsync())
            {
                recentActivities.Add(new RecentActivityItemDto
                {
                    Id = inc.Id.ToString(),
                    Type = "INCIDENT",
                    Title = $"Sự cố: {inc.IncidentCode}",
                    Subtitle = $"{inc.Severity} • {inc.Location}",
                    Timestamp = inc.CreatedAt,
                    Status = inc.Status
                });
            }

            recentActivities = recentActivities.OrderByDescending(a => a.Timestamp).Take(8).ToList();

            return new DashboardOverviewDto
            {
                TotalRevenue = totalRevenue,
                ThisMonthRevenue = thisMonthRevenue,
                RevenueGrowthPercent = revenueGrowth,
                TotalVehicles = totalVehicles,
                AvailableVehicles = readyVehicles,
                RentedVehicles = rentedVehicles,
                MaintenanceVehicles = maintenanceVehicles,
                RepairVehicles = repairVehicles,
                FleetUtilizationRate = fleetUtilization,
                TotalRentalRequests = totalRequests,
                PendingRequests = pendingRequests,
                ActiveRentals = activeRentals,
                CompletedRentals = completedRentals,
                TotalIncidents = totalIncidents,
                ActiveExtensions = activeExtensions,
                LateReturnsCount = lateReturnsCount,
                TopVehicles = topVehicles,
                MonthlyRevenue = monthlyRevenue,
                RecentActivities = recentActivities
            };
        }

        public async Task<FleetUtilizationReportDto> GetFleetUtilizationReportAsync()
        {
            var vehicles = await _context.Vehicles.Where(v => v.IsActive).ToListAsync();
            var requests = await _context.RentalRequests.ToListAsync();
            var incidents = await _context.IncidentReports.ToListAsync();
            var maintenance = await _context.MaintenanceRecords.ToListAsync();

            int totalFleet = vehicles.Count;
            int rented = vehicles.Count(v => v.Status == VehicleStatus.RENTED);
            int ready = vehicles.Count(v => v.Status == VehicleStatus.READY);
            int inService = vehicles.Count(v => v.Status == VehicleStatus.MAINTENANCE || v.Status == VehicleStatus.REPAIR);

            decimal overallRate = totalFleet > 0
                ? Math.Round(((decimal)rented / totalFleet) * 100m, 1)
                : 0m;

            var items = new List<VehicleUtilizationItemDto>();

            foreach (var v in vehicles)
            {
                var vRequests = requests.Where(r => r.CarId == v.Id).ToList();
                int rentalCount = vRequests.Count(r => r.Status == "ACTIVE" || r.Status == "COMPLETED" || r.Status == "CONFIRMED");
                int totalDays = vRequests.Where(r => r.Status == "ACTIVE" || r.Status == "COMPLETED" || r.Status == "CONFIRMED").Sum(r => r.TotalDays);
                decimal revenue = vRequests.Where(r => r.Status == "ACTIVE" || r.Status == "COMPLETED" || r.Status == "CONFIRMED").Sum(r => r.EstimatedTotalFee);
                int incCount = incidents.Count(i => i.CarId == v.Id);
                int maintCount = maintenance.Count(m => m.CarId == v.Id);

                // Ước tính tỷ lệ khai thác cá nhân (tính trên 30 ngày gần nhất hoặc theo tổng ngày)
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
