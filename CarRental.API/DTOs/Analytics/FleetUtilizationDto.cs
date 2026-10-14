using System;
using System.Collections.Generic;

namespace CarRental.API.DTOs.Analytics
{
    public class FleetUtilizationReportDto
    {
        public decimal OverallUtilizationRate { get; set; }
        public int TotalFleetSize { get; set; }
        public int CurrentlyRentedCount { get; set; }
        public int CurrentlyReadyCount { get; set; }
        public int InServiceCount { get; set; }

        public List<VehicleUtilizationItemDto> Vehicles { get; set; } = new List<VehicleUtilizationItemDto>();
    }

    public class VehicleUtilizationItemDto
    {
        public Guid VehicleId { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ManufactureYear { get; set; }
        public decimal DailyRate { get; set; }
        public int CurrentMileage { get; set; }

        public int TotalRentalCount { get; set; }
        public int TotalDaysRented { get; set; }
        public decimal UtilizationPercentage { get; set; }
        public decimal TotalRevenueGenerated { get; set; }
        public int IncidentCount { get; set; }
        public int MaintenanceCount { get; set; }
    }
}
