using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("contract_id")]
        public Guid? ContractId { get; set; }

        [ForeignKey("ContractId")]
        public virtual RentalContract? RentalContract { get; set; }

        [Column("rental_request_id")]
        public Guid? RentalRequestId { get; set; }

        [ForeignKey("RentalRequestId")]
        public virtual RentalRequest? RentalRequest { get; set; }

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("type")]
        [MaxLength(50)]
        public string Type { get; set; } = "DEPOSIT"; // DEPOSIT, SETTLEMENT, REFUND

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "PENDING"; // PENDING, SUCCESS, FAILED

        [Column("payment_method")]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "VIETQR";

        [Column("transaction_code")]
        [MaxLength(100)]
        public string? TransactionCode { get; set; }

        [Column("paid_at")]
        public DateTime? PaidAt { get; set; }

        [Column("note")]
        public string? Note { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
