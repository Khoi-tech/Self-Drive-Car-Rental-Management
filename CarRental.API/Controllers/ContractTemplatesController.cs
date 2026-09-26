using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.ContractTemplate;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/contract-templates")]
    public class ContractTemplatesController : ControllerBase
    {
        private readonly IContractTemplateService _contractTemplateService;

        public ContractTemplatesController(IContractTemplateService contractTemplateService)
        {
            _contractTemplateService = contractTemplateService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? type, [FromQuery] bool? isActive)
        {
            var templates = await _contractTemplateService.GetAllAsync(search, type, isActive);
            return Ok(templates);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var template = await _contractTemplateService.GetByIdAsync(id);
            if (template == null) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            return Ok(template);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateContractTemplateDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _contractTemplateService.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContractTemplateDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _contractTemplateService.UpdateAsync(id, updateDto);
            if (result == null) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            return Ok(result);
        }

        [HttpPatch("{id:guid}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateContractTemplateStatusDto statusDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var success = await _contractTemplateService.UpdateStatusAsync(id, statusDto.IsActive);
            if (!success) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _contractTemplateService.DeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy mẫu hợp đồng." });

            return NoContent();
        }
    }
}
