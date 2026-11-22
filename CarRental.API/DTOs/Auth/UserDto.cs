using System;

namespace CarRental.API.DTOs.Auth
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = null!;
        public bool IsActive { get; set; } = true;
        public string? LockReason { get; set; }
        public string KycStatus { get; set; } = "PENDING";
        public DateTime? DateOfBirth { get; set; }
        public string? DriverLicenseClass { get; set; }
        public string? LicenseClass { get; set; }
        public DateTime? LicenseIssueDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
