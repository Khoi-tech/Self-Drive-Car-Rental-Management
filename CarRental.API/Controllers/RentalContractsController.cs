using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Contract;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/rental-contracts")]
    public class RentalContractsController : ControllerBase
    {
        private readonly IRentalContractService _contractService;

        public RentalContractsController(IRentalContractService contractService)
        {
            _contractService = contractService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllContracts([FromQuery] string? status)
        {
            var contracts = await _contractService.GetAllContractsAsync(status);
            return Ok(contracts);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetContractById(Guid id)
        {
            var contract = await _contractService.GetContractByIdAsync(id);
            if (contract == null)
            {
                return NotFound(new { Message = "Không tìm thấy hợp đồng." });
            }
            return Ok(contract);
        }

        [HttpGet("request/{requestId:guid}")]
        public async Task<IActionResult> GetOrCreateContractByRequestId(Guid requestId)
        {
            try
            {
                var contract = await _contractService.GetOrCreateContractByRequestIdAsync(requestId);
                return Ok(contract);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi khi tạo hợp đồng.", Details = ex.Message });
            }
        }

        [HttpPost("{id:guid}/sign")]
        public async Task<IActionResult> SignContract(Guid id, [FromBody] SignContractRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var signedContract = await _contractService.SignContractAsync(id, dto);
                return Ok(new { Message = "Ký hợp đồng điện tử thành công!", Data = signedContract });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi khi ký hợp đồng.", Details = ex.Message });
            }
        }
    }
}
