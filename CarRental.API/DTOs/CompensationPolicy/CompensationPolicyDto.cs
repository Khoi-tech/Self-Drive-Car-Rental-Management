using System;

namespace CarRental.API.DTOs.CompensationPolicy
{
    public class CompensationPolicyDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string CalculationType { get; set; } = null!;
        public decimal Amount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
