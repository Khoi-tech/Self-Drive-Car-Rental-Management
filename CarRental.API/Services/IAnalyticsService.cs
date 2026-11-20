using System;
using System.Threading.Tasks;
using CarRental.API.DTOs.Analytics;

namespace CarRental.API.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardOverviewDto> GetDashboardOverviewAsync(DateTime? fromDate = null, DateTime? toDate = null);
        Task<FleetUtilizationReportDto> GetFleetUtilizationReportAsync(DateTime? fromDate = null, DateTime? toDate = null);
    }
}
