namespace CarRental.API.DTOs.PricingPolicy
{
    public class PricingPreviewResponseDto
    {
        public decimal BasePrice { get; set; }
        public int RentalDays { get; set; }
        public int? SelectedMinDays { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal HolidaySurcharge { get; set; }
        public decimal VietQrDiscountPercentage { get; set; }
        public decimal BaseSubtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal HolidaySurchargeAmount { get; set; }
        public decimal VietQrDiscountAmount { get; set; }
        public string MembershipTier { get; set; } = "STANDARD";
        public decimal VipEarlyBookingDiscountPercentage { get; set; }
        public decimal VipEarlyBookingDiscountAmount { get; set; }
        public string? VipEarlyBookingNote { get; set; }
        public decimal AdjustedDailyPrice { get; set; }
        public decimal RentalPrice { get; set; }
    }
}
