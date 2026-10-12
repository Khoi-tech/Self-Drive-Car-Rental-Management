using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("rental_extensions")]
    public class RentalExtension
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("rental_request_id")]
        public Guid RentalRequestId { get; set; }

        [ForeignKey("RentalRequestId")]
        public virtual RentalRequest? RentalRequest { get; set; }

        [Column("old_end_time")]
        public DateTime OldEndTime { get; set; }

        [Column("new_end_time")]
        public DateTime NewEndTime { get; set; }

        [Column("extended_days")]
        public int ExtendedDays { get; set; }

        [Column("extended_hours")]
        public int ExtendedHours { get; set; }

        [Column("additional_fee", TypeName = "decimal(18,2)")]
        public decimal AdditionalFee { get; set; }

        [Column("reason")]
        public string Reason { get; set; } = null!;

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED

        [Column("staff_notes")]
        public string? StaffNotes { get; set; }

        [Column("processed_by_staff_id")]
        public Guid? ProcessedByStaffId { get; set; }

        [Column("processed_by_staff_name")]
        [MaxLength(100)]
        public string? ProcessedByStaffName { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("processed_at")]
        public DateTime? ProcessedAt { get; set; }
    }
}
