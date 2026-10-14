using System;

namespace CarRental.API.DTOs.Settlement
{
    public class SettlementResponseDto
    {
        public Guid Id { get; set; }
        public string? SettlementNumber { get; set; }
        public Guid? RentalRequestId { get; set; }
        public Guid? ContractId { get; set; }
        public Guid? ReturnProtocolId { get; set; }

        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? LicensePlate { get; set; }

        public decimal RentalFee { get; set; }
        public decimal DepositAmount { get; set; }
        public decimal ExtraKmFee { get; set; }
        public decimal LateHours { get; set; }
        public decimal LateReturnFee { get; set; }
        public decimal FuelFee { get; set; }
        public decimal DamageFee { get; set; }
        public decimal CleaningFee { get; set; }
        public decimal OtherFee { get; set; }
        public string? OtherFeeNotes { get; set; }

        public decimal TotalDeduction { get; set; }
        public decimal BalanceAmount { get; set; }
        public string SettlementType { get; set; } = "REFUND_TO_CUSTOMER";
        public decimal RefundAmount { get; set; }
        public decimal AdditionalAmountDue { get; set; }

        public string RefundStatus { get; set; } = "PENDING";
        public string RefundMethod { get; set; } = "VIETQR";
        public string? RefundBankName { get; set; }
        public string? RefundAccountNumber { get; set; }
        public string? RefundAccountName { get; set; }
        public string? RefundTransactionCode { get; set; }
        public string? RefundProofUrl { get; set; }
        public DateTime? RefundedAt { get; set; }

        public string? StaffNotes { get; set; }
        public string Status { get; set; } = "SETTLED";
        public DateTime? SettledAt { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
