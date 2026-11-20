using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("system_settings")]
    public class SystemSetting
    {
        [Key]
        [Column("key")]
        [StringLength(100)]
        public string Key { get; set; } = string.Empty;

        [Required]
        [Column("value")]
        public string Value { get; set; } = string.Empty;

        [Required]
        [Column("data_type")]
        [StringLength(50)]
        public string DataType { get; set; } = "STRING"; // DECIMAL, INTEGER, STRING, BOOLEAN

        [Column("description")]
        public string? Description { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
