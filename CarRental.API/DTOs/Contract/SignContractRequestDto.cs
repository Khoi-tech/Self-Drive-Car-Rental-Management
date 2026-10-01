using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.Contract
{
    public class SignContractRequestDto
    {
        [Required(ErrorMessage = "Vui lòng nhập chữ ký số hoặc họ tên người ký.")]
        [MaxLength(100)]
        public string Signature { get; set; } = null!;

        public bool AgreeTerms { get; set; } = true;
    }
}
