using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Auth
{
    public class ChangePasswordRequestDto
    {
        [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại.")]
        public string CurrentPassword { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
        [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự.")]
        public string NewPassword { get; set; } = null!;
    }
}
