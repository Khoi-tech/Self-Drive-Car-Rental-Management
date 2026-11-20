using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("customer_violations")]
    public class CustomerViolation
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("user_id")]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [Required]
        [Column("type")]
        [MaxLength(100)]
        public string Type { get; set; } = null!;

        [Column("points_change")]
        public int PointsChange { get; set; }

        [Required]
        [Column("reason")]
        public string Reason { get; set; } = null!;

        [Column("officer")]
        [MaxLength(100)]
        public string Officer { get; set; } = "Trưởng ca Vận hành";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
