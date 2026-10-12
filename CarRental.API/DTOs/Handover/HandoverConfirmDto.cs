using System;

namespace CarRental.API.DTOs.Handover
{
    public class HandoverConfirmDto
    {
        public string? StaffName { get; set; }
        public string? CustomerSignature { get; set; }
        public string? Notes { get; set; }
    }
}
