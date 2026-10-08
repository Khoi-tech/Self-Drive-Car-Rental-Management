using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Insurance;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class CarInsuranceService : ICarInsuranceService
    {
        private readonly AppDbContext _context;

        public CarInsuranceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CarInsuranceDto>> GetAllAsync(Guid? carId = null, string? status = null)
        {
            var query = _context.CarInsurances
                .Include(i => i.Vehicle)
                .AsQueryable();

            if (carId.HasValue)
            {
                query = query.Where(i => i.CarId == carId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(i => i.Status == status);
            }

            var list = await query
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return list.Select(MapToDto).ToList();
        }

        public async Task<CarInsuranceDto?> GetByIdAsync(Guid id)
        {
            var item = await _context.CarInsurances
                .Include(i => i.Vehicle)
                .FirstOrDefaultAsync(i => i.Id == id);

            return item == null ? null : MapToDto(item);
        }

        public async Task<List<CarInsuranceDto>> GetByCarIdAsync(Guid carId)
        {
            var list = await _context.CarInsurances
                .Include(i => i.Vehicle)
                .Where(i => i.CarId == carId)
                .OrderByDescending(i => i.ExpiryDate)
                .ToListAsync();

            return list.Select(MapToDto).ToList();
        }

        public async Task<CarInsuranceDto> CreateAsync(CreateCarInsuranceDto dto)
        {
            var carExists = await _context.Vehicles.AnyAsync(v => v.Id == dto.CarId);
            if (!carExists)
            {
                throw new InvalidOperationException("Phương tiện không tồn tại trong hệ thống.");
            }

            var status = ComputeStatus(dto.ExpiryDate);

            var insurance = new CarInsurance
            {
                Id = Guid.NewGuid(),
                CarId = dto.CarId,
                InsuranceType = dto.InsuranceType,
                InsuranceCompany = dto.InsuranceCompany,
                PolicyNumber = dto.PolicyNumber,
                StartDate = dto.StartDate,
                ExpiryDate = dto.ExpiryDate,
                CoverageSummary = dto.CoverageSummary,
                DeductibleAmount = dto.DeductibleAmount,
                PremiumAmount = dto.PremiumAmount,
                CertificateImageUrl = dto.CertificateImageUrl,
                Status = status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CarInsurances.Add(insurance);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(insurance.Id))!;
        }

        public async Task<CarInsuranceDto> UpdateAsync(Guid id, UpdateCarInsuranceDto dto)
        {
            var insurance = await _context.CarInsurances.FindAsync(id);
            if (insurance == null)
            {
                throw new InvalidOperationException("Không tìm thấy hợp đồng bảo hiểm.");
            }

            insurance.InsuranceType = dto.InsuranceType;
            insurance.InsuranceCompany = dto.InsuranceCompany;
            insurance.PolicyNumber = dto.PolicyNumber;
            insurance.StartDate = dto.StartDate;
            insurance.ExpiryDate = dto.ExpiryDate;
            insurance.CoverageSummary = dto.CoverageSummary;
            insurance.DeductibleAmount = dto.DeductibleAmount;
            insurance.PremiumAmount = dto.PremiumAmount;
            insurance.CertificateImageUrl = dto.CertificateImageUrl;
            insurance.Status = string.IsNullOrWhiteSpace(dto.Status) ? ComputeStatus(dto.ExpiryDate) : dto.Status;
            insurance.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (await GetByIdAsync(insurance.Id))!;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var item = await _context.CarInsurances.FindAsync(id);
            if (item == null) return false;

            _context.CarInsurances.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<InsuranceAlertDto>> GetAlertsAsync()
        {
            var now = DateTime.UtcNow;
            var alertThreshold = now.AddDays(30);

            var list = await _context.CarInsurances
                .Include(i => i.Vehicle)
                .Where(i => i.ExpiryDate <= alertThreshold)
                .OrderBy(i => i.ExpiryDate)
                .ToListAsync();

            var alerts = new List<InsuranceAlertDto>();
            foreach (var item in list)
            {
                var daysRemaining = (int)Math.Ceiling((item.ExpiryDate - now).TotalDays);
                string alertLevel = daysRemaining switch
                {
                    < 0 => "EXPIRED",
                    <= 7 => "CRITICAL",
                    _ => "WARNING"
                };

                alerts.Add(new InsuranceAlertDto
                {
                    CarId = item.CarId,
                    LicensePlate = item.Vehicle?.LicensePlate ?? "Chưa rõ",
                    CarName = $"{item.Vehicle?.Make} {item.Vehicle?.Model}",
                    InsuranceId = item.Id,
                    InsuranceType = item.InsuranceType,
                    InsuranceCompany = item.InsuranceCompany,
                    PolicyNumber = item.PolicyNumber,
                    ExpiryDate = item.ExpiryDate,
                    DaysRemaining = daysRemaining,
                    AlertLevel = alertLevel
                });
            }

            return alerts;
        }

        private static string ComputeStatus(DateTime expiryDate)
        {
            var diff = (expiryDate - DateTime.UtcNow).TotalDays;
            if (diff < 0) return "EXPIRED";
            if (diff <= 30) return "EXPIRING_SOON";
            return "ACTIVE";
        }

        private static CarInsuranceDto MapToDto(CarInsurance entity)
        {
            var daysUntil = (int)Math.Ceiling((entity.ExpiryDate - DateTime.UtcNow).TotalDays);
            return new CarInsuranceDto
            {
                Id = entity.Id,
                CarId = entity.CarId,
                LicensePlate = entity.Vehicle?.LicensePlate,
                CarMake = entity.Vehicle?.Make,
                CarModel = entity.Vehicle?.Model,
                InsuranceType = entity.InsuranceType,
                InsuranceCompany = entity.InsuranceCompany,
                PolicyNumber = entity.PolicyNumber,
                StartDate = entity.StartDate,
                ExpiryDate = entity.ExpiryDate,
                CoverageSummary = entity.CoverageSummary,
                DeductibleAmount = entity.DeductibleAmount,
                PremiumAmount = entity.PremiumAmount,
                CertificateImageUrl = entity.CertificateImageUrl,
                Status = entity.Status,
                DaysUntilExpiry = daysUntil,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}
