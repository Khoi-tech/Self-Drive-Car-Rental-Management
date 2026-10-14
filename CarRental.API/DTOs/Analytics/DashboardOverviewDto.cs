using System;
using System.Collections.Generic;

namespace CarRental.API.DTOs.Analytics
{
    public class DashboardOverviewDto
    {
        // KPI Summary
        public decimal TotalRevenue { get; set; }
        public decimal ThisMonthRevenue { get; set; }
        public decimal RevenueGrowthPercent { get; set; }

        public int TotalVehicles { get; set; }
        public int AvailableVehicles { get; set; }
        public int RentedVehicles { get; set; }
        public int MaintenanceVehicles { get; set; }
        public int RepairVehicles { get; set; }

        public decimal FleetUtilizationRate { get; set; } // % xe đang được thuê / tổng xe khả dụng

        public int TotalRentalRequests { get; set; }
        public int PendingRequests { get; set; }
        public int ActiveRentals { get; set; }
        public int CompletedRentals { get; set; }

        public int TotalIncidents { get; set; }
        public int ActiveExtensions { get; set; }
        public int LateReturnsCount { get; set; }

        // Top Cars & Recent Activities
        public List<TopVehicleItemDto> TopVehicles { get; set; } = new List<TopVehicleItemDto>();
        public List<MonthlyRevenueItemDto> MonthlyRevenue { get; set; } = new List<MonthlyRevenueItemDto>();
        public List<RecentActivityItemDto> RecentActivities { get; set; } = new List<RecentActivityItemDto>();
    }

    public class TopVehicleItemDto
    {
        public Guid VehicleId { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        public int RentalCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class MonthlyRevenueItemDto
    {
        public string MonthLabel { get; set; } = string.Empty; // e.g. "T5/2026", "T6/2026"
        public decimal Revenue { get; set; }
        public int BookingCount { get; set; }
    }

    public class RecentActivityItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // REQUEST, HANDOVER, RETURN, INCIDENT, EXTENSION
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
