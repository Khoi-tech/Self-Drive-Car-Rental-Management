using System;

namespace CarRental.API.DTOs.RentalRequest
{
    public class UpdateRentalDocumentsDto
    {
        public string? CustomerIdCard { get; set; }
        public string? DriverLicenseNumber { get; set; }
        public string? DriverLicenseClass { get; set; }
        public DateTime? DriverLicenseExpiry { get; set; }
        public string? IdCardFrontUrl { get; set; }
        public string? IdCardBackUrl { get; set; }
        public string? DriverLicenseFrontUrl { get; set; }
        public string? DriverLicenseBackUrl { get; set; }
    }
}
