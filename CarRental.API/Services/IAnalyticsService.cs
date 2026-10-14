using System.Threading.Tasks;
using CarRental.API.DTOs.Analytics;

namespace CarRental.API.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardOverviewDto> GetDashboardOverviewAsync();
        Task<FleetUtilizationReportDto> GetFleetUtilizationReportAsync();
    }
}
