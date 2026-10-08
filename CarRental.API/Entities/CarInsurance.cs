using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("car_insurances")]
    public class CarInsurance
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("car_id")]
        public Guid CarId { get; set; }

        [ForeignKey("CarId")]
        public virtual Vehicle? Vehicle { get; set; }

        [Required]
        [Column("provider")]
        [MaxLength(150)]
        public string InsuranceCompany { get; set; } = null!; // Bảo Việt, PVI, PTI, PJICO, MIC, Bảo Minh

        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Column("end_date")]
        public DateTime ExpiryDate { get; set; }

        [Column("insurance_type")]
        [MaxLength(50)]
        public string InsuranceType { get; set; } = "TNDS"; // TNDS (Bắt buộc), PHYSICAL (Vật chất thân vỏ 2 chiều), OCCUPANT

        [Column("policy_number")]
        [MaxLength(100)]
        public string PolicyNumber { get; set; } = string.Empty;

        [Column("coverage_summary")]
        public string? CoverageSummary { get; set; }

        [Column("deductible_amount")]
        public decimal DeductibleAmount { get; set; } = 0;

        [Column("premium_amount")]
        public decimal PremiumAmount { get; set; } = 0;

        [Column("certificate_image_url")]
        public string? CertificateImageUrl { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "ACTIVE"; // ACTIVE, EXPIRING_SOON, EXPIRED

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
