using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Hybrid;
using CarRental.API.DTOs.PricingPolicy;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/vehicles/{vehicleId:guid}/pricing-policies")]
    public class PricingPoliciesController : ControllerBase
    {
        private readonly IPricingPolicyService _pricingService;
        private readonly ISystemSettingsService _settingsService;
        private readonly HybridCache _cache;

        public PricingPoliciesController(
            IPricingPolicyService pricingService,
            ISystemSettingsService settingsService,
            HybridCache cache)
        {
            _pricingService = pricingService;
            _settingsService = settingsService;
            _cache = cache;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPolicies(Guid vehicleId)
        {
            try
            {
                string cacheKey = $"pricing_policies_{vehicleId}";
                var policies = await _cache.GetOrCreateAsync(
                    cacheKey,
                    async cancel => (await _pricingService.GetPoliciesByVehicleIdAsync(vehicleId)).ToList(),
                    tags: new[] { "pricing_policies", $"pricing_{vehicleId}" });

                return Ok(policies);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Vehicle not found." });
            }
        }

        [HttpPost]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> CreatePolicy(Guid vehicleId, [FromBody] CreatePricingPolicyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var policy = await _pricingService.CreatePolicyAsync(vehicleId, dto);
                await _cache.RemoveByTagAsync("pricing_policies");
                return CreatedAtAction(nameof(GetPolicies), new { vehicleId = vehicleId }, policy);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Vehicle not found." });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("{policyId:guid}")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> UpdatePolicy(Guid vehicleId, Guid policyId, [FromBody] UpdatePricingPolicyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var policy = await _pricingService.UpdatePolicyAsync(vehicleId, policyId, dto);
                if (policy == null) return NotFound(new { message = "Policy not found." });

                await _cache.RemoveByTagAsync("pricing_policies");
                return Ok(policy);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpDelete("{policyId:guid}")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> DeletePolicy(Guid vehicleId, Guid policyId)
        {
            var success = await _pricingService.DeletePolicyAsync(vehicleId, policyId);
            if (!success) return NotFound(new { message = "Policy not found." });

            await _cache.RemoveByTagAsync("pricing_policies");
            return NoContent();
        }

        [HttpPost("apply-standard")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> ApplyStandardPackage(Guid vehicleId)
        {
            try
            {
                var policies = await _pricingService.ApplyStandardPackageAsync(vehicleId);
                await _cache.RemoveByTagAsync("pricing_policies");
                await _cache.RemoveByTagAsync("vehicles");
                return Ok(policies);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Vehicle not found." });
            }
        }

        [HttpGet("/api/pricing-defaults")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> GetPricingDefaults()
        {
            var defaultExtraKmRate = await _settingsService.GetSettingValueAsync("default_extra_km_rate", 5000m);
            var fuelTolerancePercent = await _settingsService.GetSettingValueAsync("fuel_tolerance_percent", 3.0m);
            var vietQrDiscountPercent = await _settingsService.GetSettingValueAsync("vietqr_discount_percent", 5m);

            return Ok(new
            {
                defaultExtraKmRate,
                fuelTolerancePercent,
                vietQrDiscountPercent
            });
        }

        [HttpPost("/api/vehicles/{vehicleId:guid}/pricing-preview")]
        [AllowAnonymous]
        public async Task<IActionResult> PreviewPricing(Guid vehicleId, [FromBody] PricingPreviewRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            if (string.IsNullOrWhiteSpace(dto.CustomerEmail) && User?.Identity?.IsAuthenticated == true)
            {
                dto.CustomerEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;
            }

            var preview = await _pricingService.PreviewPricingAsync(vehicleId, dto);
            if (preview == null) return NotFound(new { message = "Vehicle not found." });

            return Ok(preview);
        }
    }
}
