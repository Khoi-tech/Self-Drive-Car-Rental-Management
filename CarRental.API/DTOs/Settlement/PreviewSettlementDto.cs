using System;

namespace CarRental.API.DTOs.Settlement
{
    public class PreviewSettlementDto
    {
        public Guid RentalRequestId { get; set; }
        public Guid? ContractId { get; set; }
        public Guid? ReturnProtocolId { get; set; }

        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CarName { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;

        public decimal RentalFee { get; set; }
        public decimal DepositAmount { get; set; }

        // Mốc ODO
        public int HandoverOdo { get; set; }
        public int CustomerReturnOdo { get; set; }
        public int StartOdo { get; set; }
        public int EndOdo { get; set; }
        public int TotalKmDriven { get; set; }
        public int? MaxKmAllowed { get; set; }
        public int ExcessKm { get; set; }
        public decimal ExtraKmRate { get; set; }
        public decimal ExtraKmFee { get; set; }

        public DateTime ScheduledEndTime { get; set; }
        public DateTime ActualReturnTime { get; set; }
        public decimal LateHours { get; set; }
        public decimal LateReturnFee { get; set; }

        // Nhiên liệu & Dung sai
        public decimal HandoverFuelLevel { get; set; } = 100;
        public decimal CustomerReturnFuelLevel { get; set; } = 100;
        public decimal FuelTolerancePercent { get; set; } = 3.0m;
        public decimal FuelDeficit { get; set; } = 0;
        public int InitialFuelLevel { get; set; }
        public int ReturnFuelLevel { get; set; }
        public int FuelDifference { get; set; }
        public decimal FuelFee { get; set; }

        public decimal DamageFee { get; set; }
        public string? DamageNotes { get; set; }
        public string? DamagePointsJson { get; set; }
        public string? ReturnDamageMap { get; set; }
        public string? EvidencePhotoUrls { get; set; }

        public decimal CleaningFee { get; set; }
        public string CustomerMembershipTier { get; set; } = "STANDARD";
        public bool IsCleaningFeeWaived { get; set; }
        public string? CleaningFeeWaiverNote { get; set; }
        public decimal OtherFee { get; set; }
        public string? OtherFeeNotes { get; set; }

        public decimal TotalDeduction { get; set; }
        public decimal BalanceAmount { get; set; } // DepositAmount - TotalDeduction

        public decimal TrafficFineHoldAmount { get; set; } = 2000000m;

        public string SettlementType { get; set; } = "REFUND_TO_CUSTOMER"; // REFUND_TO_CUSTOMER, ADDITIONAL_PAYMENT_REQUIRED, EVEN
        public decimal RefundAmount { get; set; }
        public decimal AdditionalAmountDue { get; set; }
    }
}
