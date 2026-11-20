using System;

namespace CarRental.API.DTOs.Handover
{
    public class HandoverConfirmDto
    {
        public int? HandoverOdo { get; set; }
        public decimal? HandoverFuelLevel { get; set; }
        public string? HandoverDashPhotoUrl { get; set; }
        public string? HandoverDamageMap { get; set; }
        public string? TransitAnomalyNote { get; set; }

        public string? StaffName { get; set; }
        public string? StaffSignature { get; set; }
        public string? CustomerSignature { get; set; }
        public string? Notes { get; set; }
    }
}
