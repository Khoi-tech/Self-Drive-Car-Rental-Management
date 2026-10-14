using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Analytics;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN,STAFF")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _service;

        public AnalyticsController(IAnalyticsService service)
        {
            _service = service;
        }

        [HttpGet("dashboard-overview")]
        public async Task<ActionResult<DashboardOverviewDto>> GetDashboardOverview()
        {
            var overview = await _service.GetDashboardOverviewAsync();
            return Ok(overview);
        }

        [HttpGet("fleet-utilization")]
        public async Task<ActionResult<FleetUtilizationReportDto>> GetFleetUtilizationReport()
        {
            var report = await _service.GetFleetUtilizationReportAsync();
            return Ok(report);
        }
    }
}
