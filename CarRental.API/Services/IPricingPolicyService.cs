using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.PricingPolicy;

namespace CarRental.API.Services
{
    public interface IPricingPolicyService
    {
        Task<IEnumerable<PricingPolicyDto>> GetPoliciesByVehicleIdAsync(Guid vehicleId);
        Task<PricingPolicyDto> CreatePolicyAsync(Guid vehicleId, CreatePricingPolicyDto createDto);
        Task<PricingPolicyDto?> UpdatePolicyAsync(Guid vehicleId, Guid policyId, UpdatePricingPolicyDto updateDto);
        Task<bool> DeletePolicyAsync(Guid vehicleId, Guid policyId);
        Task<IEnumerable<PricingPolicyDto>> ApplyStandardPackageAsync(Guid vehicleId);
        Task<PricingPreviewResponseDto?> PreviewPricingAsync(Guid vehicleId, PricingPreviewRequestDto requestDto);
    }
}
