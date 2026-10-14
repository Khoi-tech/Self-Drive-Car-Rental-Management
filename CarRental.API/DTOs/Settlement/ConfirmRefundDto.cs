using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Settlement
{
    public class ConfirmRefundDto
    {
        [Required]
        public string RefundTransactionCode { get; set; } = string.Empty;

        public string? RefundProofUrl { get; set; }

        public string RefundMethod { get; set; } = "VIETQR"; // VIETQR, BANK_TRANSFER, CASH

        public string? RefundBankName { get; set; }

        public string? RefundAccountNumber { get; set; }

        public string? RefundAccountName { get; set; }

        public string? StaffNotes { get; set; }
    }

    public class ConfirmAdditionalPaymentDto
    {
        [Required]
        public string TransactionCode { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = "VIETQR";

        public string? ProofUrl { get; set; }

        public string? StaffNotes { get; set; }
    }
}
