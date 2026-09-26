using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.RentalRequest
{
    public class CreateRentalRequestDto
    {
        [Required]
        public Guid CarId { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        [Required]
        public string PickupLocation { get; set; } = null!;

        [Required]
        public string DropoffLocation { get; set; } = null!;

        [Required(ErrorMessage = "Họ tên người thuê là bắt buộc")]
        [StringLength(100)]
        public string CustomerName { get; set; } = null!;

        [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
        [StringLength(20)]
        public string CustomerPhone { get; set; } = null!;

        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string CustomerEmail { get; set; } = null!;

        [Required(ErrorMessage = "Số CCCD/CMND là bắt buộc")]
        [StringLength(50)]
        public string CustomerIdCard { get; set; } = null!;

        [Required(ErrorMessage = "Số GPLX là bắt buộc")]
        [StringLength(50)]
        public string DriverLicenseNumber { get; set; } = null!;

        public string? IdCardFrontUrl { get; set; }
        public string? IdCardBackUrl { get; set; }
        public string? DriverLicenseFrontUrl { get; set; }
        public string? DriverLicenseBackUrl { get; set; }

        public string? Notes { get; set; }

        public List<CreateAdditionalDriverDto>? AdditionalDrivers { get; set; }
    }
}
