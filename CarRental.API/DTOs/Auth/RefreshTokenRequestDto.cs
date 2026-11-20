using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Auth
{
    public class RefreshTokenRequestDto
    {
        [Required(ErrorMessage = "RefreshToken là bắt buộc.")]
        public string RefreshToken { get; set; } = null!;
    }
}
