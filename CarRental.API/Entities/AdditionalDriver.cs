using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("additional_drivers")]
    public class AdditionalDriver
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("user_id")]
        public Guid? UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [Column("rental_request_id")]
        public Guid? RentalRequestId { get; set; }

        [ForeignKey("RentalRequestId")]
        public virtual RentalRequest? RentalRequest { get; set; }

        [Required]
        [Column("full_name")]
        public string FullName { get; set; } = null!;

        [Required]
        [Column("phone_number")]
        public string PhoneNumber { get; set; } = null!;

        [Column("id_card_number")]
        public string? IdCardNumber { get; set; }

        [Column("license_number")]
        public string? LicenseNumber { get; set; }

        [Column("relationship")]
        public string? Relationship { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("license_class")]
        public string? LicenseClass { get; set; } = "B2";

        [Column("license_expiry")]
        public DateTime? LicenseExpiry { get; set; }

        [Column("status")]
        public string Status { get; set; } = "VERIFIED";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
