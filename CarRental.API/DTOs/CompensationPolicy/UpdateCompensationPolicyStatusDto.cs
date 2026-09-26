using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.CompensationPolicy
{
    public class UpdateCompensationPolicyStatusDto
    {
        [Required]
        public bool IsActive { get; set; }
    }
}
