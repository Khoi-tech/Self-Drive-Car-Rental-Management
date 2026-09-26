using System;
using System.ComponentModel.DataAnnotations;
using CarRental.API.Entities;

namespace CarRental.API.DTOs.Vehicle
{
    public class UpdateVehicleDto
    {
        [Range(1, 50, ErrorMessage = "Số chỗ ngồi phải lớn hơn 0")]
        public int Seats { get; set; }

        public TransmissionType Transmission { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá thuê không được âm")]
        public decimal DailyRate { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Tiền cọc không được âm")]
        public decimal DepositAmount { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số km hiện tại không hợp lệ")]
        public int CurrentMileage { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Giới hạn km không hợp lệ")]
        public int? MileageLimit { get; set; }

        public DateTime? NextMaintenanceDate { get; set; }

        public int? NextMaintenanceMileage { get; set; }

        public string? PickupLocation { get; set; }

        public string? ImageUrl { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Phí vượt km không được âm")]
        public decimal? ExtraKmRate { get; set; }

        public string? FuelReturnPolicy { get; set; }
    }
}
