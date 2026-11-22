using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("app_users")]
    public class User
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("email")]
        [MaxLength(255)]
        public string Email { get; set; } = null!;

        [Required]
        [Column("password_hash")]
        [MaxLength(255)]
        public string PasswordHash { get; set; } = null!;

        [Required]
        [Column("full_name")]
        [MaxLength(100)]
        public string FullName { get; set; } = null!;

        [Column("phone_number")]
        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required]
        [Column("role")]
        [MaxLength(20)]
        public string Role { get; set; } = "CUSTOMER";

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("lock_reason")]
        public string? LockReason { get; set; }

        [Column("kyc_status")]
        [MaxLength(50)]
        public string KycStatus { get; set; } = "PENDING"; // PENDING, VERIFIED, REJECTED

        [Column("kyc_reviewed_at")]
        public DateTime? KycReviewedAt { get; set; }

        [Column("kyc_note")]
        public string? KycNote { get; set; }

        [Column("trust_score")]
        public int TrustScore { get; set; } = 100;

        [Column("id_card_number")]
        [MaxLength(50)]
        public string? IdCardNumber { get; set; }

        [Column("driver_license_number")]
        [MaxLength(50)]
        public string? DriverLicenseNumber { get; set; }

        [Column("driver_license_class")]
        [MaxLength(20)]
        public string? DriverLicenseClass { get; set; } = "B2";

        [Column("driver_license_expiry")]
        public DateTime? DriverLicenseExpiry { get; set; }

        [Column("date_of_birth", TypeName = "date")]
        public DateTime? DateOfBirth { get; set; }

        [Column("license_class")]
        [MaxLength(20)]
        public string? LicenseClass { get; set; }

        [Column("license_issue_date", TypeName = "date")]
        public DateTime? LicenseIssueDate { get; set; }

        [Column("id_card_front_url")]
        public string? IdCardFrontUrl { get; set; }

        [Column("id_card_back_url")]
        public string? IdCardBackUrl { get; set; }

        [Column("driver_license_front_url")]
        public string? DriverLicenseFrontUrl { get; set; }

        [Column("driver_license_back_url")]
        public string? DriverLicenseBackUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public virtual ICollection<CustomerViolation> Violations { get; set; } = new List<CustomerViolation>();
        public virtual ICollection<AdditionalDriver> AdditionalDrivers { get; set; } = new List<AdditionalDriver>();
    }
}
