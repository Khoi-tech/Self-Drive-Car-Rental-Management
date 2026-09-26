using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.ContractTemplate
{
    public class UpdateContractTemplateDto
    {
        [Required(ErrorMessage = "Tên mẫu hợp đồng là bắt buộc")]
        [StringLength(255, ErrorMessage = "Tên mẫu hợp đồng tối đa 255 ký tự")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Loại mẫu hợp đồng là bắt buộc")]
        [StringLength(50)]
        public string TemplateType { get; set; } = "DAILY";

        [StringLength(20)]
        public string Version { get; set; } = "v1.0";

        public string? Description { get; set; }

        [Required(ErrorMessage = "Nội dung mẫu hợp đồng là bắt buộc")]
        public string Content { get; set; } = null!;
    }
}
