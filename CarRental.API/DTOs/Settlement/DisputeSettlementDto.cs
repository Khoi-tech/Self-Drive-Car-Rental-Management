using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Settlement
{
    public class DisputeSettlementDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }
}
