using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("notifications")]
    public class Notification
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
        [Column("title")]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [Required]
        [Column("type")]
        [StringLength(50)]
        public string Type { get; set; } = "SYSTEM"; // RENTAL, PAYMENT, ACCOUNT, SYSTEM

        [Column("reference_id")]
        [StringLength(100)]
        public string? ReferenceId { get; set; }

        [Column("action_url")]
        [StringLength(255)]
        public string? ActionUrl { get; set; }

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
