using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Settings;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/system-settings")]
    [Authorize(Policy = "AdminOnly")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly ISystemSettingsService _settingsService;

        public SystemSettingsController(ISystemSettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSettings()
        {
            var settings = await _settingsService.GetAllSettingsAsync();
            return Ok(settings);
        }

        [HttpPut("{key}")]
        public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSystemSettingDto dto)
        {
            if (dto == null || dto.Value == null)
            {
                return BadRequest(new { Message = "Giá trị cài đặt không được để trống." });
            }

            var updated = await _settingsService.UpdateSettingAsync(key, dto.Value);
            return Ok(updated);
        }

        [HttpPut]
        [Route("batch")]
        public async Task<IActionResult> UpdateBatch([FromBody] UpdateSystemSettingsBatchDto dto)
        {
            if (dto?.Settings == null || dto.Settings.Count == 0)
            {
                return BadRequest(new { Message = "Danh sách cài đặt không hợp lệ." });
            }

            var updatedList = await _settingsService.UpdateBatchAsync(dto.Settings);
            return Ok(updatedList);
        }

        [HttpPost("cleanup-e2e")]
        public async Task<IActionResult> CleanupE2ETestData([FromServices] CarRental.API.Data.AppDbContext context)
        {
            try
            {
                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, @"
                    DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM app_users WHERE email LIKE 'e2e_%');
                    DELETE FROM notifications WHERE user_id IN (SELECT id FROM app_users WHERE email LIKE 'e2e_%');
                    DELETE FROM customer_violations WHERE user_id IN (SELECT id FROM app_users WHERE email LIKE 'e2e_%');
                    DELETE FROM additional_drivers WHERE user_id IN (SELECT id FROM app_users WHERE email LIKE 'e2e_%');
                    DELETE FROM payments WHERE transaction_code LIKE 'E2E_%' OR note LIKE '%E2E_%' OR rental_request_id IN (SELECT id FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%');
                    DELETE FROM rental_settlements WHERE settlement_number LIKE '%E2E%' OR staff_notes LIKE '%E2E%' OR rental_request_id IN (SELECT id FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%');
                    DELETE FROM incident_reports WHERE incident_code LIKE '%E2E%' OR customer_name LIKE 'E2E_%' OR description LIKE '%E2E_%' OR rental_request_id IN (SELECT id FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%');
                    DELETE FROM return_protocols WHERE protocol_number LIKE '%E2E%' OR customer_name LIKE 'E2E_%' OR rental_request_id IN (SELECT id FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%');
                    DELETE FROM handover_protocols WHERE protocol_number LIKE '%E2E%' OR customer_name LIKE 'E2E_%' OR rental_request_id IN (SELECT id FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%');
                    DELETE FROM rental_extensions WHERE staff_notes LIKE '%E2E_%' OR rental_request_id IN (SELECT id FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%');
                    DELETE FROM rental_contracts WHERE contract_number LIKE '%E2E%' OR request_id IN (SELECT id FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%');
                    DELETE FROM rental_requests WHERE customer_email LIKE 'e2e_%' OR customer_name LIKE 'E2E_%';
                    DELETE FROM cars WHERE license_plate LIKE 'E2E_%';
                    DELETE FROM app_users WHERE email LIKE 'e2e_%';
                ");
                return Ok(new { success = true, message = "Đã dọn dẹp an toàn toàn bộ dữ liệu E2E test." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
