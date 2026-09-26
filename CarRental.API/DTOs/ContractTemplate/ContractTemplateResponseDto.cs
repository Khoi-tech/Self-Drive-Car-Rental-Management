using System;

namespace CarRental.API.DTOs.ContractTemplate
{
    public class ContractTemplateResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string TemplateType { get; set; } = null!;
        public string Version { get; set; } = null!;
        public string? Description { get; set; }
        public string Content { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
