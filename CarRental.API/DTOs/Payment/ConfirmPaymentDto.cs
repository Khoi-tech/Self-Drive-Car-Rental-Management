using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Payment
{
    public class ConfirmPaymentDto
    {
        [Required(ErrorMessage = "Mã giao dịch không được để trống")]
        public string TransactionCode { get; set; } = null!;
    }
}
