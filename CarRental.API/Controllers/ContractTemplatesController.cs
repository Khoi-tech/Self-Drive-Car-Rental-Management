using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Hybrid;
using CarRental.API.DTOs.ContractTemplate;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/contract-templates")]
    public class ContractTemplatesController : ControllerBase
    {
        private readonly IContractTemplateService _contractTemplateService;
        private readonly HybridCache _cache;

        public ContractTemplatesController(IContractTemplateService contractTemplateService, HybridCache cache)
        {
            _contractTemplateService = contractTemplateService;
            _cache = cache;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? type, [FromQuery] bool? isActive)
        {
            string cacheKey = $"contract_templates_{search?.Trim().ToLowerInvariant()}_{type}_{isActive}";

            var templates = await _cache.GetOrCreateAsync(
                cacheKey,
                async cancel => (await _contractTemplateService.GetAllAsync(search, type, isActive)).ToList(),
                tags: new[] { "contract_templates" });

            return Ok(templates);
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(Guid id)
        {
            var template = await _contractTemplateService.GetByIdAsync(id);
            if (template == null) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            return Ok(template);
        }

        [HttpPost]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> Create([FromBody] CreateContractTemplateDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _contractTemplateService.CreateAsync(createDto);
            await _cache.RemoveByTagAsync("contract_templates");
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContractTemplateDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _contractTemplateService.UpdateAsync(id, updateDto);
            if (result == null) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            await _cache.RemoveByTagAsync("contract_templates");
            return Ok(result);
        }

        [HttpPatch("{id:guid}/status")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateContractTemplateStatusDto statusDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var success = await _contractTemplateService.UpdateStatusAsync(id, statusDto.IsActive);
            if (!success) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            await _cache.RemoveByTagAsync("contract_templates");
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Policy = "Management")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _contractTemplateService.DeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            await _cache.RemoveByTagAsync("contract_templates");
            return NoContent();
        }
    }
}
