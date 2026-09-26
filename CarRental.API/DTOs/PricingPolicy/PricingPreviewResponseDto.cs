namespace CarRental.API.DTOs.PricingPolicy
{
    public class PricingPreviewResponseDto
    {
        public decimal BasePrice { get; set; }
        public int RentalDays { get; set; }
        public int? SelectedMinDays { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal HolidaySurcharge { get; set; }
        public decimal AdjustedDailyPrice { get; set; }
        public decimal RentalPrice { get; set; }
    }
}
