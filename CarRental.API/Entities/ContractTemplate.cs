using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("contract_templates")]
    public class ContractTemplate
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(255)]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        [Column("template_type")]
        public string TemplateType { get; set; } = "DAILY"; // e.g. DAILY, MONTHLY

        [MaxLength(20)]
        [Column("version")]
        public string Version { get; set; } = "v1.0";

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("content")]
        public string Content { get; set; } = null!;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
