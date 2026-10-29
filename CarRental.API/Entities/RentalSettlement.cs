using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("rental_settlements")]
    public class RentalSettlement
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("settlement_number")]
        [MaxLength(50)]
        public string? SettlementNumber { get; set; }

        [Column("rental_request_id")]
        public Guid? RentalRequestId { get; set; }

        [ForeignKey("RentalRequestId")]
        public virtual RentalRequest? RentalRequest { get; set; }

        [Column("contract_id")]
        public Guid? ContractId { get; set; }

        [ForeignKey("ContractId")]
        public virtual RentalContract? RentalContract { get; set; }

        [Column("return_protocol_id")]
        public Guid? ReturnProtocolId { get; set; }

        [ForeignKey("ReturnProtocolId")]
        public virtual ReturnProtocol? ReturnProtocol { get; set; }

        [Column("rental_fee", TypeName = "decimal(18,2)")]
        public decimal RentalFee { get; set; }

        [Column("deposit_amount", TypeName = "decimal(18,2)")]
        public decimal DepositAmount { get; set; }

        [Column("extra_km_fee", TypeName = "decimal(18,2)")]
        public decimal ExtraKmFee { get; set; } = 0;

        [Column("late_hours", TypeName = "decimal(5,2)")]
        public decimal LateHours { get; set; } = 0;

        [Column("late_return_fee", TypeName = "decimal(18,2)")]
        public decimal LateReturnFee { get; set; } = 0;

        [Column("fuel_fee", TypeName = "decimal(18,2)")]
        public decimal FuelFee { get; set; } = 0;

        [Column("damage_fee", TypeName = "decimal(18,2)")]
        public decimal DamageFee { get; set; } = 0;

        [Column("cleaning_fee", TypeName = "decimal(18,2)")]
        public decimal CleaningFee { get; set; } = 0;

        [Column("other_fee", TypeName = "decimal(18,2)")]
        public decimal OtherFee { get; set; } = 0;

        [Column("other_fee_notes")]
        public string? OtherFeeNotes { get; set; }

        [Column("total_deduction", TypeName = "decimal(18,2)")]
        public decimal TotalDeduction { get; set; } = 0;

        [Column("balance_amount", TypeName = "decimal(18,2)")]
        public decimal BalanceAmount { get; set; } = 0;

        [Column("settlement_type")]
        [MaxLength(50)]
        public string SettlementType { get; set; } = "REFUND_TO_CUSTOMER"; // REFUND_TO_CUSTOMER, ADDITIONAL_PAYMENT_REQUIRED, EVEN

        [Column("refund_amount", TypeName = "decimal(18,2)")]
        public decimal RefundAmount { get; set; } = 0;

        [Column("traffic_fine_hold_amount", TypeName = "decimal(18,2)")]
        public decimal TrafficFineHoldAmount { get; set; } = 0; // Số tiền giữ lại làm quỹ cọc phạt nguội

        [Column("traffic_fine_refund_date")]
        public DateTime? TrafficFineRefundDate { get; set; } // Ngày dự kiến hoàn trả cọc phạt nguội (sau 15-30 ngày)

        [Column("traffic_fine_refund_status")]
        [MaxLength(50)]
        public string TrafficFineRefundStatus { get; set; } = "NONE"; // NONE, HOLDING, REFUNDED, DEDUCTED

        [Column("traffic_fine_actual_deduction", TypeName = "decimal(18,2)")]
        public decimal TrafficFineActualDeduction { get; set; } = 0; // Tiền phạt thực tế khấu trừ nếu có lỗi phạt nguội

        [Column("traffic_fine_actual_refund", TypeName = "decimal(18,2)")]
        public decimal TrafficFineActualRefund { get; set; } = 0; // Tiền thực tế hoàn lại cho khách đợt 2

        [Column("traffic_fine_refunded_at")]
        public DateTime? TrafficFineRefundedAt { get; set; }

        [Column("traffic_fine_transaction_code")]
        [MaxLength(100)]
        public string? TrafficFineTransactionCode { get; set; }

        [Column("traffic_fine_notes")]
        public string? TrafficFineNotes { get; set; }

        [Column("traffic_fine_violation_proof_url")]
        public string? TrafficFineViolationProofUrl { get; set; }

        [Column("additional_amount_due", TypeName = "decimal(18,2)")]
        public decimal AdditionalAmountDue { get; set; } = 0;

        [Column("refund_status")]
        [MaxLength(50)]
        public string RefundStatus { get; set; } = "PENDING"; // PENDING, REFUNDED, NOT_APPLICABLE

        [Column("refund_method")]
        [MaxLength(50)]
        public string RefundMethod { get; set; } = "VIETQR"; // VIETQR, BANK_TRANSFER, CASH

        [Column("refund_bank_name")]
        [MaxLength(100)]
        public string? RefundBankName { get; set; }

        [Column("refund_account_number")]
        [MaxLength(50)]
        public string? RefundAccountNumber { get; set; }

        [Column("refund_account_name")]
        [MaxLength(100)]
        public string? RefundAccountName { get; set; }

        [Column("refund_transaction_code")]
        [MaxLength(100)]
        public string? RefundTransactionCode { get; set; }

        [Column("refund_proof_url")]
        public string? RefundProofUrl { get; set; }

        [Column("refunded_at")]
        public DateTime? RefundedAt { get; set; }

        [Column("staff_notes")]
        public string? StaffNotes { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "SETTLED"; // PENDING, SETTLED

        [Column("settled_at")]
        public DateTime? SettledAt { get; set; } = DateTime.UtcNow;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
