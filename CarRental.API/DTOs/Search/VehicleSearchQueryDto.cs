using System;

namespace CarRental.API.DTOs.Search
{
    public class VehicleSearchQueryDto
    {
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? PickupLocation { get; set; }
        public string? Brand { get; set; }
        public int? Seats { get; set; }
        public string? Transmission { get; set; }
        public string? FuelType { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? SortBy { get; set; } // price_asc, price_desc, new_year
    }
}
