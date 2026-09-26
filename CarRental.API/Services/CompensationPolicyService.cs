using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.CompensationPolicy;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class CompensationPolicyService : ICompensationPolicyService
    {
        private readonly AppDbContext _context;

        public CompensationPolicyService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CompensationPolicyDto>> GetAllAsync()
        {
            var policies = await _context.CompensationPolicies
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return policies.Select(MapToDto);
        }

        public async Task<CompensationPolicyDto?> GetByIdAsync(Guid id)
        {
            var policy = await _context.CompensationPolicies.FindAsync(id);
            if (policy == null) return null;

            return MapToDto(policy);
        }

        public async Task<CompensationPolicyDto> CreateAsync(CreateCompensationPolicyDto createDto)
        {
            var policy = new CompensationPolicy
            {
                Name = createDto.Name,
                Description = createDto.Description,
                CalculationType = createDto.CalculationType,
                Amount = createDto.Amount,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.CompensationPolicies.Add(policy);
            await _context.SaveChangesAsync();

            return MapToDto(policy);
        }

        public async Task<CompensationPolicyDto?> UpdateAsync(Guid id, UpdateCompensationPolicyDto updateDto)
        {
            var policy = await _context.CompensationPolicies.FindAsync(id);
            if (policy == null) return null;

            policy.Name = updateDto.Name;
            policy.Description = updateDto.Description;
            policy.CalculationType = updateDto.CalculationType;
            policy.Amount = updateDto.Amount;
            policy.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(policy);
        }

        public async Task<bool> UpdateStatusAsync(Guid id, bool isActive)
        {
            var policy = await _context.CompensationPolicies.FindAsync(id);
            if (policy == null) return false;

            policy.IsActive = isActive;
            policy.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        private static CompensationPolicyDto MapToDto(CompensationPolicy policy)
        {
            return new CompensationPolicyDto
            {
                Id = policy.Id,
                Name = policy.Name,
                Description = policy.Description,
                CalculationType = policy.CalculationType,
                Amount = policy.Amount,
                IsActive = policy.IsActive,
                CreatedAt = policy.CreatedAt,
                UpdatedAt = policy.UpdatedAt
            };
        }
    }
}
