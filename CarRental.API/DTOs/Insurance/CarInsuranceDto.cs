using System;

namespace CarRental.API.DTOs.Insurance
{
    public class CarInsuranceDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public string? LicensePlate { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string InsuranceType { get; set; } = "TNDS";
        public string InsuranceCompany { get; set; } = null!;
        public string PolicyNumber { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string? CoverageSummary { get; set; }
        public decimal DeductibleAmount { get; set; }
        public decimal PremiumAmount { get; set; }
        public string? CertificateImageUrl { get; set; }
        public string Status { get; set; } = "ACTIVE"; // ACTIVE, EXPIRING_SOON, EXPIRED
        public int DaysUntilExpiry { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class CreateCarInsuranceDto
    {
        public Guid CarId { get; set; }
        public string InsuranceType { get; set; } = "TNDS";
        public string InsuranceCompany { get; set; } = null!;
        public string PolicyNumber { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string? CoverageSummary { get; set; }
        public decimal DeductibleAmount { get; set; } = 0;
        public decimal PremiumAmount { get; set; } = 0;
        public string? CertificateImageUrl { get; set; }
    }

    public class UpdateCarInsuranceDto
    {
        public string InsuranceType { get; set; } = "TNDS";
        public string InsuranceCompany { get; set; } = null!;
        public string PolicyNumber { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string? CoverageSummary { get; set; }
        public decimal DeductibleAmount { get; set; }
        public decimal PremiumAmount { get; set; }
        public string? CertificateImageUrl { get; set; }
        public string Status { get; set; } = "ACTIVE";
    }

    public class InsuranceAlertDto
    {
        public Guid CarId { get; set; }
        public string LicensePlate { get; set; } = null!;
        public string CarName { get; set; } = null!;
        public Guid InsuranceId { get; set; }
        public string InsuranceType { get; set; } = null!;
        public string InsuranceCompany { get; set; } = null!;
        public string PolicyNumber { get; set; } = null!;
        public DateTime ExpiryDate { get; set; }
        public int DaysRemaining { get; set; }
        public string AlertLevel { get; set; } = "WARNING"; // WARNING (< 30 days), CRITICAL (< 7 days), EXPIRED (< 0 days)
    }
}
