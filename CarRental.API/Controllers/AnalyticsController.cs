using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Analytics;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "Operations")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _service;

        public AnalyticsController(IAnalyticsService service)
        {
            _service = service;
        }

        [HttpGet("dashboard-overview")]
        public async Task<ActionResult<DashboardOverviewDto>> GetDashboardOverview([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            bool isStaffOnly = !User.IsManagement();
            var overview = await _service.GetDashboardOverviewAsync(fromDate, toDate, isStaffOnly);
            return Ok(overview);
        }

        [HttpGet("fleet-utilization")]
        public async Task<ActionResult<FleetUtilizationReportDto>> GetFleetUtilizationReport([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            bool isStaffOnly = !User.IsManagement();
            var report = await _service.GetFleetUtilizationReportAsync(fromDate, toDate, isStaffOnly);
            return Ok(report);
        }
    }
}
