using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("refresh_tokens")]
    public class RefreshToken
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("user_id")]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }

        [Required]
        [Column("token")]
        [MaxLength(255)]
        public string Token { get; set; } = null!;

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("revoked_at")]
        public DateTime? RevokedAt { get; set; }

        [Column("replaced_by_token")]
        [MaxLength(255)]
        public string? ReplacedByToken { get; set; }

        [NotMapped]
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

        [NotMapped]
        public bool IsRevoked => RevokedAt != null;

        [NotMapped]
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}
