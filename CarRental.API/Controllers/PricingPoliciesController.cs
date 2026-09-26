using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.PricingPolicy;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/vehicles/{vehicleId:guid}/pricing-policies")]
    public class PricingPoliciesController : ControllerBase
    {
        private readonly IPricingPolicyService _pricingService;

        public PricingPoliciesController(IPricingPolicyService pricingService)
        {
            _pricingService = pricingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPolicies(Guid vehicleId)
        {
            try
            {
                var policies = await _pricingService.GetPoliciesByVehicleIdAsync(vehicleId);
                return Ok(policies);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Vehicle not found." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreatePolicy(Guid vehicleId, [FromBody] CreatePricingPolicyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var policy = await _pricingService.CreatePolicyAsync(vehicleId, dto);
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
        public async Task<IActionResult> UpdatePolicy(Guid vehicleId, Guid policyId, [FromBody] UpdatePricingPolicyDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var policy = await _pricingService.UpdatePolicyAsync(vehicleId, policyId, dto);
                if (policy == null) return NotFound(new { message = "Policy not found." });
                return Ok(policy);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpDelete("{policyId:guid}")]
        public async Task<IActionResult> DeletePolicy(Guid vehicleId, Guid policyId)
        {
            var success = await _pricingService.DeletePolicyAsync(vehicleId, policyId);
            if (!success) return NotFound(new { message = "Policy not found." });

            return NoContent();
        }

        [HttpPost("/api/vehicles/{vehicleId:guid}/pricing-preview")]
        public async Task<IActionResult> PreviewPricing(Guid vehicleId, [FromBody] PricingPreviewRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var preview = await _pricingService.PreviewPricingAsync(vehicleId, dto);
            if (preview == null) return NotFound(new { message = "Vehicle not found." });

            return Ok(preview);
        }
    }
}
