using System;

namespace CarRental.API.DTOs.PricingPolicy
{
    public class PricingPolicyDto
    {
        public Guid Id { get; set; }
        public Guid VehicleId { get; set; }
        public int MinDays { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal HolidaySurcharge { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
