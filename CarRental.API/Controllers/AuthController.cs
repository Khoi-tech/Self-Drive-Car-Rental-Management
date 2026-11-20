using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CarRental.API.DTOs.Auth;
using CarRental.API.Helpers;
using CarRental.API.Services;

namespace CarRental.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _authService.RegisterAsync(dto);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _authService.LoginAsync(dto);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống", Details = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.GetUserId();

            if (!userId.HasValue)
            {
                return Unauthorized(new { Message = "Không thể xác định danh tính người dùng." });
            }

            var profile = await _authService.GetProfileAsync(userId.Value);
            if (profile == null)
            {
                return NotFound(new { Message = "Tài khoản không tồn tại hoặc đã bị khóa." });
            }

            return Ok(profile);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto dto)
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

            try
            {
                await _authService.ChangePasswordAsync(userId.Value, dto.CurrentPassword, dto.NewPassword);
                return Ok(new { Success = true, Message = "Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi an toàn." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống khi đổi mật khẩu.", Details = ex.Message });
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _authService.RefreshTokenAsync(dto.RefreshToken);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Đã xảy ra lỗi hệ thống khi làm mới token", Details = ex.Message });
            }
        }

        [HttpPost("revoke")]
        public async Task<IActionResult> Revoke([FromBody] RevokeTokenRequestDto? dto)
        {
            var userId = User.GetUserId();
            var success = await _authService.RevokeTokenAsync(dto?.RefreshToken, userId);
            return Ok(new { Message = "Thu hồi Refresh Token thành công.", Success = success });
        }
    }
}
