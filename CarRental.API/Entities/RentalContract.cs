using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("rental_contracts")]
    public class RentalContract
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("request_id")]
        public Guid? RequestId { get; set; }

        [ForeignKey("RequestId")]
        public virtual RentalRequest? RentalRequest { get; set; }

        [Column("contract_number")]
        [MaxLength(50)]
        public string? ContractNumber { get; set; }

        [Column("total_fee")]
        public decimal TotalFee { get; set; }

        [Column("deposit_amt")]
        public decimal DepositAmount { get; set; }

        [Column("max_km")]
        public int? MaxKm { get; set; }

        [Column("content")]
        public string? Content { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "WAITING_SIGNATURE"; // WAITING_SIGNATURE, SIGNED, DEPOSIT_PAID, ACTIVE, COMPLETED, CANCELLED

        [Column("customer_signature")]
        public string? CustomerSignature { get; set; }

        [Column("customer_signed_at")]
        public DateTime? CustomerSignedAt { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
