using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.CompensationPolicy;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/compensation-policies")]
    public class CompensationPoliciesController : ControllerBase
    {
        private readonly ICompensationPolicyService _compensationPolicyService;

        public CompensationPoliciesController(ICompensationPolicyService compensationPolicyService)
        {
            _compensationPolicyService = compensationPolicyService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var policies = await _compensationPolicyService.GetAllAsync();
            return Ok(policies);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var policy = await _compensationPolicyService.GetByIdAsync(id);
            if (policy == null) return NotFound(new { message = "Không tìm thấy chính sách" });

            return Ok(policy);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCompensationPolicyDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _compensationPolicyService.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCompensationPolicyDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _compensationPolicyService.UpdateAsync(id, updateDto);
            if (result == null) return NotFound(new { message = "Không tìm thấy chính sách" });

            return Ok(result);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateCompensationPolicyStatusDto statusDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var success = await _compensationPolicyService.UpdateStatusAsync(id, statusDto.IsActive);
            if (!success) return NotFound(new { message = "Không tìm thấy chính sách" });

            return NoContent();
        }
    }
}
