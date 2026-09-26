using System;
using System.ComponentModel.DataAnnotations;
using CarRental.API.Entities;
using CarRental.API.Entities;

namespace CarRental.API.DTOs.Vehicle
{
    public class CreateVehicleDto
    {
        [Required(ErrorMessage = "Hãng xe là bắt buộc")]
        [MaxLength(100)]
        public string Make { get; set; } = null!;

        [Required(ErrorMessage = "Dòng xe là bắt buộc")]
        [MaxLength(100)]
        public string Model { get; set; } = null!;

        [Required(ErrorMessage = "Biển số là bắt buộc")]
        [MaxLength(20)]
        public string LicensePlate { get; set; } = null!;

        [Range(1, 50, ErrorMessage = "Số chỗ ngồi phải lớn hơn 0")]
        public int Seats { get; set; }

        [Required(ErrorMessage = "Loại hộp số là bắt buộc")]
        public TransmissionType Transmission { get; set; }

        public FuelType FuelType { get; set; }

        [Range(1900, 2100, ErrorMessage = "Năm sản xuất không hợp lệ")]
        public int ManufactureYear { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá thuê không được âm")]
        public decimal DailyRate { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Tiền cọc không được âm")]
        public decimal DepositAmount { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số km hiện tại không hợp lệ")]
        public int CurrentMileage { get; set; } = 0;

        [Range(1, int.MaxValue, ErrorMessage = "Giới hạn km không hợp lệ")]
        public int? MileageLimit { get; set; }

        public string? PickupLocation { get; set; }

        public string? ImageUrl { get; set; }
    }
}
