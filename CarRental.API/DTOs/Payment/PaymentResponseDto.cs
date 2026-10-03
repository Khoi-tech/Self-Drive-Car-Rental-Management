using System;

namespace CarRental.API.DTOs.Payment
{
    public class PaymentResponseDto
    {
        public Guid Id { get; set; }
        public Guid? ContractId { get; set; }
        public Guid? RentalRequestId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentType { get; set; } = "DEPOSIT";
        public string PaymentMethod { get; set; } = "VIETQR";
        public string TransactionCode { get; set; } = null!;
        public string Status { get; set; } = "PENDING";
        public DateTime? PaidAt { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }

        // Bank / QR Info for Customer Payment
        public string AccountName { get; set; } = "VELORA CAR RENTAL CORP";
        public string AccountNumber { get; set; } = "21011501030206";
        public string BankName { get; set; } = "MBBank (Ngan hang Quan Doi)";
        public string TransferContent { get; set; } = null!;
        public string QrCodeUrl { get; set; } = null!;
    }
}
