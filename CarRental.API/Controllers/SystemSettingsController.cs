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
    }
}
