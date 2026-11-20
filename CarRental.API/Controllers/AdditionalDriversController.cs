using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.Entities;
using CarRental.API.Helpers;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/additional-drivers")]
    [Authorize]
    public class AdditionalDriversController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdditionalDriversController(AppDbContext context)
        {
            _context = context;
        }

        public class AdditionalDriverDto
        {
            public string Id { get; set; } = null!;
            public string FullName { get; set; } = null!;
            public string PhoneNumber { get; set; } = null!;
            public string? IdCardNumber { get; set; }
            public string? LicenseNumber { get; set; }
            public string? Relationship { get; set; }
            public string? DateOfBirth { get; set; }
            public string? LicenseClass { get; set; } = "B2";
            public string? LicenseExpiry { get; set; }
            public string Status { get; set; } = "VERIFIED";
            public DateTime CreatedAt { get; set; }
        }

        public class CreateAdditionalDriverRequest
        {
            [Required(ErrorMessage = "Vui lòng nhập họ và tên tài xế phụ.")]
            public string FullName { get; set; } = null!;

            [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
            public string PhoneNumber { get; set; } = null!;

            public string? IdCardNumber { get; set; }
            public string? LicenseNumber { get; set; }
            public string? Relationship { get; set; }
            public string? DateOfBirth { get; set; }
            public string? LicenseClass { get; set; } = "B2";
            public string? LicenseExpiry { get; set; }
            public string? Status { get; set; } = "VERIFIED";
        }

        public class UpdateAdditionalDriverRequest
        {
            [Required(ErrorMessage = "Vui lòng nhập họ và tên tài xế phụ.")]
            public string FullName { get; set; } = null!;

            [Required(ErrorMessage = "Vui lòng nhập số điện thoại.")]
            public string PhoneNumber { get; set; } = null!;

            public string? IdCardNumber { get; set; }
            public string? LicenseNumber { get; set; }
            public string? Relationship { get; set; }
            public string? DateOfBirth { get; set; }
            public string? LicenseClass { get; set; } = "B2";
            public string? LicenseExpiry { get; set; }
            public string? Status { get; set; }
        }

        [HttpGet("my-drivers")]
        public async Task<IActionResult> GetMyDrivers()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không thể xác định danh tính người dùng." });
            }

            var drivers = await _context.AdditionalDrivers
                .Where(d => d.UserId == userId.Value)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            var result = drivers.Select(MapToDto).ToList();
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateDriver([FromBody] CreateAdditionalDriverRequest req)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không thể xác định danh tính người dùng." });
            }

            DateTime? dob = null;
            if (!string.IsNullOrWhiteSpace(req.DateOfBirth) && DateTime.TryParse(req.DateOfBirth, out var parsedDob))
            {
                dob = DateTime.SpecifyKind(parsedDob, DateTimeKind.Utc);
            }

            DateTime? expiry = null;
            if (!string.IsNullOrWhiteSpace(req.LicenseExpiry) && DateTime.TryParse(req.LicenseExpiry, out var parsedExpiry))
            {
                expiry = DateTime.SpecifyKind(parsedExpiry, DateTimeKind.Utc);
            }

            var driver = new AdditionalDriver
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                FullName = req.FullName.Trim(),
                PhoneNumber = req.PhoneNumber.Trim(),
                IdCardNumber = req.IdCardNumber?.Trim(),
                LicenseNumber = req.LicenseNumber?.Trim(),
                Relationship = req.Relationship?.Trim() ?? "Bạn đồng hành",
                DateOfBirth = dob,
                LicenseClass = req.LicenseClass?.Trim() ?? "B2",
                LicenseExpiry = expiry,
                Status = string.IsNullOrWhiteSpace(req.Status) ? "VERIFIED" : req.Status.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.AdditionalDrivers.Add(driver);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyDrivers), null, MapToDto(driver));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDriver(Guid id, [FromBody] UpdateAdditionalDriverRequest req)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.GetUserId();
            var isStaff = User.IsInRole("ADMIN") || User.IsInRole("MANAGER") || User.IsInRole("STAFF");

            var driver = await _context.AdditionalDrivers.FirstOrDefaultAsync(d => d.Id == id);
            if (driver == null)
            {
                return NotFound(new { Message = "Không tìm thấy thông tin tài xế phụ." });
            }

            if (!isStaff && driver.UserId != userId)
            {
                return Forbid();
            }

            DateTime? dob = null;
            if (!string.IsNullOrWhiteSpace(req.DateOfBirth) && DateTime.TryParse(req.DateOfBirth, out var parsedDob))
            {
                dob = DateTime.SpecifyKind(parsedDob, DateTimeKind.Utc);
            }

            DateTime? expiry = null;
            if (!string.IsNullOrWhiteSpace(req.LicenseExpiry) && DateTime.TryParse(req.LicenseExpiry, out var parsedExpiry))
            {
                expiry = DateTime.SpecifyKind(parsedExpiry, DateTimeKind.Utc);
            }

            driver.FullName = req.FullName.Trim();
            driver.PhoneNumber = req.PhoneNumber.Trim();
            driver.IdCardNumber = req.IdCardNumber?.Trim();
            driver.LicenseNumber = req.LicenseNumber?.Trim();
            driver.Relationship = req.Relationship?.Trim() ?? driver.Relationship;
            driver.DateOfBirth = dob ?? driver.DateOfBirth;
            driver.LicenseClass = req.LicenseClass?.Trim() ?? driver.LicenseClass;
            driver.LicenseExpiry = expiry ?? driver.LicenseExpiry;
            if (!string.IsNullOrWhiteSpace(req.Status))
            {
                driver.Status = req.Status.Trim();
            }

            await _context.SaveChangesAsync();
            return Ok(MapToDto(driver));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(Guid id)
        {
            var userId = User.GetUserId();
            var isStaff = User.IsInRole("ADMIN") || User.IsInRole("MANAGER") || User.IsInRole("STAFF");

            var driver = await _context.AdditionalDrivers.FirstOrDefaultAsync(d => d.Id == id);
            if (driver == null)
            {
                return NotFound(new { Message = "Không tìm thấy thông tin tài xế phụ." });
            }

            if (!isStaff && driver.UserId != userId)
            {
                return Forbid();
            }

            _context.AdditionalDrivers.Remove(driver);
            await _context.SaveChangesAsync();

            return Ok(new { Success = true, Message = "Đã xóa tài xế phụ khỏi danh sách hồ sơ." });
        }

        private static AdditionalDriverDto MapToDto(AdditionalDriver d)
        {
            return new AdditionalDriverDto
            {
                Id = d.Id.ToString(),
                FullName = d.FullName,
                PhoneNumber = d.PhoneNumber,
                IdCardNumber = d.IdCardNumber,
                LicenseNumber = d.LicenseNumber,
                Relationship = d.Relationship ?? "Bạn đồng hành",
                DateOfBirth = d.DateOfBirth?.ToString("dd/MM/yyyy"),
                LicenseClass = d.LicenseClass ?? "B2",
                LicenseExpiry = d.LicenseExpiry?.ToString("dd/MM/yyyy"),
                Status = d.Status,
                CreatedAt = d.CreatedAt
            };
        }
    }
}
