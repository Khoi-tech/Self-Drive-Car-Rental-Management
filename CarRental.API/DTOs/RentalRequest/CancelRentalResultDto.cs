using System;

namespace CarRental.API.DTOs.RentalRequest
{
    public class CancelRentalResultDto
    {
        public Guid RequestId { get; set; }
        public string Status { get; set; } = "CANCELLED";
        public decimal DepositAmount { get; set; }
        public decimal PenaltyPercent { get; set; }
        public decimal PenaltyAmount { get; set; }
        public decimal RefundAmount { get; set; }
        public string PenaltyReason { get; set; } = string.Empty;
        public DateTime CancelledAt { get; set; }
    }
}
