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

        [Required]
        [Column("rental_request_id")]
        public Guid RentalRequestId { get; set; }

        [ForeignKey("RentalRequestId")]
        public virtual RentalRequest RentalRequest { get; set; } = null!;

        [Column("full_name")]
        public string FullName { get; set; } = null!;

        [Column("phone_number")]
        public string PhoneNumber { get; set; } = null!;

        [Column("id_card_number")]
        public string IdCardNumber { get; set; } = null!;

        [Column("license_number")]
        public string LicenseNumber { get; set; } = null!;
    }
}
