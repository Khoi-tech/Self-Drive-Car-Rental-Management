using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Settlement
{
    public class CreateSettlementDto
    {
        [Required]
        public Guid RentalRequestId { get; set; }

        public Guid? ContractId { get; set; }

        public Guid? ReturnProtocolId { get; set; }

        public decimal RentalFee { get; set; }

        public decimal DepositAmount { get; set; }

        public decimal ExtraKmFee { get; set; } = 0;

        public decimal LateHours { get; set; } = 0;

        public decimal LateReturnFee { get; set; } = 0;

        public decimal FuelFee { get; set; } = 0;

        public decimal DamageFee { get; set; } = 0;

        public decimal CleaningFee { get; set; } = 0;

        public decimal OtherFee { get; set; } = 0;

        public string? OtherFeeNotes { get; set; }

        public string? RefundBankName { get; set; }

        public string? RefundAccountNumber { get; set; }

        public string? RefundAccountName { get; set; }

        public string? StaffNotes { get; set; }
    }
}
