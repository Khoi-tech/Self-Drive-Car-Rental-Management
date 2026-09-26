using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.CompensationPolicy
{
    public class UpdateCompensationPolicyDto
    {
        [Required(ErrorMessage = "Tên chính sách là bắt buộc")]
        [StringLength(255)]
        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Cách tính là bắt buộc")]
        [RegularExpression("^(FIXED|UNIT)$", ErrorMessage = "Cách tính chỉ được là FIXED hoặc UNIT")]
        public string CalculationType { get; set; } = null!;

        [Range(0, double.MaxValue, ErrorMessage = "Mức phí không được âm")]
        public decimal Amount { get; set; }
    }
}
