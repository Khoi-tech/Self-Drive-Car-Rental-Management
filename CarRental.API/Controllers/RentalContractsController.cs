using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.Data;
using CarRental.API.DTOs.Common;
using CarRental.API.DTOs.Contract;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/rental-contracts")]
    public class RentalContractsController : ControllerBase
    {
        private readonly IRentalContractService _contractService;
        private readonly AppDbContext _context;

        public RentalContractsController(IRentalContractService contractService, AppDbContext context)
        {
            _contractService = contractService;
            _context = context;
        }

        [HttpGet]
        [Authorize(Policy = "Operations")]
        public async Task<IActionResult> GetAllContracts(
            [FromQuery] string? status,
            [FromQuery] int? page = null,
            [FromQuery] int? pageSize = null)
        {
            var contracts = (await _contractService.GetAllContractsAsync(status)).ToList();
            int totalCount = contracts.Count;
            int p = Math.Max(1, page ?? 1);
            int ps = pageSize.HasValue ? Math.Clamp(pageSize.Value, 1, 100) : (page.HasValue ? 20 : totalCount);
            var pagedItems = contracts.Skip((p - 1) * ps).Take(ps).ToList();

            return Ok(new PagedResultDto<RentalContractDto>(pagedItems, totalCount, p, ps));
        }

        [HttpGet("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> GetContractById(Guid id)
        {
            var contract = await _contractService.GetContractByIdAsync(id);
            if (contract == null)
            {
                return NotFound(new { Message = "Không tìm thấy hợp đồng." });
            }

            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(contract.RequestId, _context))
                {
                    return Forbid();
                }
            }

            return Ok(contract);
        }

        [HttpGet("request/{requestId:guid}")]
        [Authorize]
        public async Task<IActionResult> GetOrCreateContractByRequestId(Guid requestId)
        {
            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(requestId, _context))
                {
                    return Forbid();
                }
            }

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
        [Authorize]
        public async Task<IActionResult> SignContract(Guid id, [FromBody] SignContractRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var contract = await _contractService.GetContractByIdAsync(id);
            if (contract == null)
            {
                return NotFound(new { Message = "Không tìm thấy hợp đồng." });
            }

            if (!User.IsOperations())
            {
                if (!await User.CanAccessRequestIdAsync(contract.RequestId, _context))
                {
                    return Forbid();
                }
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
