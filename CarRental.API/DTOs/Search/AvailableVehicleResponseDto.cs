using System;
using CarRental.API.DTOs.Vehicle;

namespace CarRental.API.DTOs.Search
{
    public class AvailableVehicleResponseDto
    {
        public VehicleResponseDto Vehicle { get; set; } = null!;
        public int TotalDays { get; set; }
        public decimal EstimatedTotalFee { get; set; }
        public decimal AppliedDiscountPercent { get; set; }
        public decimal AppliedHolidaySurchargePercent { get; set; }
        public decimal DepositAmount { get; set; }
    }
}
