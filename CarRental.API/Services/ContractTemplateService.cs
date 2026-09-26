using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.ContractTemplate;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class ContractTemplateService : IContractTemplateService
    {
        private readonly AppDbContext _context;

        public ContractTemplateService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ContractTemplateResponseDto>> GetAllAsync(string? search = null, string? type = null, bool? isActive = null)
        {
            var query = _context.ContractTemplates.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.Trim().ToLower();
                query = query.Where(t => t.Name.ToLower().Contains(lowerSearch) || 
                                         (t.Description != null && t.Description.ToLower().Contains(lowerSearch)));
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                var upperType = type.Trim().ToUpper();
                query = query.Where(t => t.TemplateType.ToUpper() == upperType);
            }

            if (isActive.HasValue)
            {
                query = query.Where(t => t.IsActive == isActive.Value);
            }

            var templates = await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return templates.Select(MapToDto);
        }

        public async Task<ContractTemplateResponseDto?> GetByIdAsync(Guid id)
        {
            var template = await _context.ContractTemplates.FindAsync(id);
            if (template == null) return null;

            return MapToDto(template);
        }

        public async Task<ContractTemplateResponseDto> CreateAsync(CreateContractTemplateDto dto)
        {
            var template = new ContractTemplate
            {
                Name = dto.Name.Trim(),
                TemplateType = string.IsNullOrWhiteSpace(dto.TemplateType) ? "DAILY" : dto.TemplateType.Trim().ToUpper(),
                Version = string.IsNullOrWhiteSpace(dto.Version) ? "v1.0" : dto.Version.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                Content = dto.Content,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ContractTemplates.Add(template);
            await _context.SaveChangesAsync();

            return MapToDto(template);
        }

        public async Task<ContractTemplateResponseDto?> UpdateAsync(Guid id, UpdateContractTemplateDto dto)
        {
            var template = await _context.ContractTemplates.FindAsync(id);
            if (template == null) return null;

            template.Name = dto.Name.Trim();
            template.TemplateType = string.IsNullOrWhiteSpace(dto.TemplateType) ? template.TemplateType : dto.TemplateType.Trim().ToUpper();
            template.Version = string.IsNullOrWhiteSpace(dto.Version) ? template.Version : dto.Version.Trim();
            template.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            template.Content = dto.Content;
            template.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(template);
        }

        public async Task<bool> UpdateStatusAsync(Guid id, bool isActive)
        {
            var template = await _context.ContractTemplates.FindAsync(id);
            if (template == null) return false;

            template.IsActive = isActive;
            template.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var template = await _context.ContractTemplates.FindAsync(id);
            if (template == null) return false;

            _context.ContractTemplates.Remove(template);
            await _context.SaveChangesAsync();

            return true;
        }

        private static ContractTemplateResponseDto MapToDto(ContractTemplate template)
        {
            return new ContractTemplateResponseDto
            {
                Id = template.Id,
                Name = template.Name,
                TemplateType = template.TemplateType,
                Version = template.Version,
                Description = template.Description,
                Content = template.Content,
                IsActive = template.IsActive,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt
            };
        }
    }
}
