using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Payment
{
    public class CreatePaymentDto
    {
        [Required]
        public Guid RentalRequestId { get; set; }

        public Guid? ContractId { get; set; }

        public string PaymentMethod { get; set; } = "VIETQR"; // VIETQR or VNPAY
    }
}
