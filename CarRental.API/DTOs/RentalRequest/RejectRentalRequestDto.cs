using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.RentalRequest
{
    public class RejectRentalRequestDto
    {
        [Required(ErrorMessage = "Lý do từ chối là bắt buộc")]
        [MinLength(5, ErrorMessage = "Lý do từ chối phải có ít nhất 5 ký tự")]
        public string Reason { get; set; } = null!;
    }
}
