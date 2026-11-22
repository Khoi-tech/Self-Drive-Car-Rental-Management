using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.PricingPolicy
{
    public class PricingPreviewRequestDto
    {
        [Required]
        [Range(1, 365, ErrorMessage = "rentalDays phải từ 1 đến 365")]
        public int RentalDays { get; set; }

        public bool IsHoliday { get; set; } = false;

        public bool IsVietQrPrepaid { get; set; } = false;

        public DateTime? StartTime { get; set; }

        public string? CustomerEmail { get; set; }
    }
}
