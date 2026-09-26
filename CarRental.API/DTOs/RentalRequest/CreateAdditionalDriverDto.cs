using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.RentalRequest
{
    public class CreateAdditionalDriverDto
    {
        [Required(ErrorMessage = "Họ tên tài xế phụ là bắt buộc")]
        [StringLength(100)]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "Số điện thoại tài xế phụ là bắt buộc")]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = null!;

        [Required(ErrorMessage = "Số CCCD/CMND tài xế phụ là bắt buộc")]
        [StringLength(50)]
        public string IdCardNumber { get; set; } = null!;

        [Required(ErrorMessage = "Số GPLX tài xế phụ là bắt buộc")]
        [StringLength(50)]
        public string LicenseNumber { get; set; } = null!;
    }
}
