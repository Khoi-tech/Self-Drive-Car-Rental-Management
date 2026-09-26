using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.PricingPolicy
{
    public class CreatePricingPolicyDto
    {
        [Required]
        [Range(1, 1000, ErrorMessage = "minDays phải >= 1")]
        public int MinDays { get; set; }

        [Required]
        [Range(0, 100, ErrorMessage = "discountPercentage phải từ 0 đến 100")]
        public decimal DiscountPercentage { get; set; }

        [Required]
        [Range(0, 100, ErrorMessage = "holidaySurcharge phải từ 0 đến 100")]
        public decimal HolidaySurcharge { get; set; }
    }
}
