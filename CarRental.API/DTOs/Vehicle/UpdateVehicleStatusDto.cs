using System.ComponentModel.DataAnnotations;
using CarRental.API.Entities;

namespace CarRental.API.DTOs.Vehicle
{
    public class UpdateVehicleStatusDto
    {
        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        public VehicleStatus Status { get; set; }
    }
}
