using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("rental_requests")]
    public class RentalRequest
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("car_id")]
        public Guid CarId { get; set; }

        [ForeignKey("CarId")]
        public virtual Vehicle Vehicle { get; set; } = null!;

        [Column("customer_name")]
        public string CustomerName { get; set; } = null!;

        [Column("customer_phone")]
        public string CustomerPhone { get; set; } = null!;

        [Column("customer_email")]
        public string CustomerEmail { get; set; } = null!;

        [Column("customer_id_card")]
        public string CustomerIdCard { get; set; } = null!;

        [Column("id_card_front_url")]
        public string? IdCardFrontUrl { get; set; }

        [Column("id_card_back_url")]
        public string? IdCardBackUrl { get; set; }

        [Column("driver_license_number")]
        public string DriverLicenseNumber { get; set; } = null!;

        [Column("driver_license_front_url")]
        public string? DriverLicenseFrontUrl { get; set; }

        [Column("driver_license_back_url")]
        public string? DriverLicenseBackUrl { get; set; }

        [Column("start_time")]
        public DateTime StartTime { get; set; }

        [Column("end_time")]
        public DateTime EndTime { get; set; }

        [Column("pickup_location")]
        public string PickupLocation { get; set; } = null!;

        [Column("dropoff_location")]
        public string DropoffLocation { get; set; } = null!;

        [Column("total_days")]
        public int TotalDays { get; set; }

        [Column("daily_rate", TypeName = "decimal(18,2)")]
        public decimal DailyRate { get; set; }

        [Column("discount_percent", TypeName = "decimal(5,2)")]
        public decimal DiscountPercent { get; set; }

        [Column("holiday_surcharge_percent", TypeName = "decimal(5,2)")]
        public decimal HolidaySurchargePercent { get; set; }

        [Column("estimated_total_fee", TypeName = "decimal(18,2)")]
        public decimal EstimatedTotalFee { get; set; }

        [Column("deposit_amount", TypeName = "decimal(18,2)")]
        public decimal DepositAmount { get; set; }

        [Column("status")]
        public string Status { get; set; } = "PENDING";

        [Column("reject_reason")]
        public string? RejectReason { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public virtual ICollection<AdditionalDriver> AdditionalDrivers { get; set; } = new List<AdditionalDriver>();
    }
}
