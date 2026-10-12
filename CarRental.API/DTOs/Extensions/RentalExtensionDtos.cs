using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Extensions
{
    public class CreateRentalExtensionDto
    {
        [Required]
        public Guid RentalRequestId { get; set; }

        [Required]
        public DateTime NewEndTime { get; set; }

        [Required]
        public string Reason { get; set; } = null!;
    }

    public class ProcessRentalExtensionDto
    {
        public string? StaffNotes { get; set; }
        public string? StaffName { get; set; }
    }

    public class RentalExtensionDto
    {
        public Guid Id { get; set; }
        public Guid RentalRequestId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerEmail { get; set; }
        public Guid? CarId { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? CarLicensePlate { get; set; }
        public string? CarImageUrl { get; set; }
        public decimal DailyRate { get; set; }

        public DateTime OldEndTime { get; set; }
        public DateTime NewEndTime { get; set; }
        public int ExtendedDays { get; set; }
        public int ExtendedHours { get; set; }
        public decimal AdditionalFee { get; set; }
        public string Reason { get; set; } = null!;
        public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED
        public string? StaffNotes { get; set; }
        public string? ProcessedByStaffName { get; set; }
        public bool HasScheduleConflict { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
    }
}
