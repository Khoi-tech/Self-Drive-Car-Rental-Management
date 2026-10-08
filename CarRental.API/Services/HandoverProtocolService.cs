using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.Handover;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class HandoverProtocolService : IHandoverProtocolService
    {
        private readonly AppDbContext _context;

        public HandoverProtocolService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<HandoverProtocolDto>> GetAllAsync(string? status = null)
        {
            var query = _context.HandoverProtocols
                .Include(h => h.RentalContract)
                .Include(h => h.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(h => h.Status == status);
            }

            var list = await query
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return list.Select(MapToDto).ToList();
        }

        public async Task<HandoverProtocolDto?> GetByIdAsync(Guid id)
        {
            var item = await _context.HandoverProtocols
                .Include(h => h.RentalContract)
                .Include(h => h.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(h => h.Id == id);

            return item == null ? null : MapToDto(item);
        }

        public async Task<HandoverProtocolDto?> GetByRequestIdAsync(Guid requestId)
        {
            var item = await _context.HandoverProtocols
                .Include(h => h.RentalContract)
                .Include(h => h.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(h => h.CreatedAt)
                .FirstOrDefaultAsync(h => h.RentalRequestId == requestId);

            return item == null ? null : MapToDto(item);
        }

        public async Task<HandoverProtocolDto> CreateAsync(CreateHandoverProtocolDto dto)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
            {
                throw new InvalidOperationException("Không tìm thấy yêu cầu thuê xe.");
            }

            int fuelInt = ParseFuelLevel(dto.FuelLevel);

            // Check if protocol already exists
            var existing = await _context.HandoverProtocols
                .FirstOrDefaultAsync(h => h.RentalRequestId == dto.RentalRequestId);

            if (existing != null)
            {
                existing.OdoAtHandover = dto.OdoAtHandover > 0 ? dto.OdoAtHandover : (request.Vehicle?.CurrentMileage ?? 0);
                existing.FuelLevel = fuelInt;
                existing.ExteriorCondition = dto.ExteriorCondition ?? existing.ExteriorCondition;
                existing.InteriorCondition = dto.InteriorCondition ?? existing.InteriorCondition;
                existing.TireCondition = dto.TireCondition ?? existing.TireCondition;
                existing.AccessoriesChecklist = dto.AccessoriesChecklist ?? existing.AccessoriesChecklist;
                existing.ExistingScratchesNotes = dto.ExistingScratchesNotes ?? existing.ExistingScratchesNotes;
                existing.EvidencePhotoUrls = dto.EvidencePhotoUrls ?? existing.EvidencePhotoUrls;
                existing.StaffNotes = dto.StaffNotes ?? existing.StaffNotes;
                existing.StaffSignature = dto.StaffSignature ?? existing.StaffSignature;
                existing.StaffName = !string.IsNullOrWhiteSpace(dto.StaffName) ? dto.StaffName : existing.StaffName;
                existing.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return (await GetByIdAsync(existing.Id))!;
            }

            // Find associated contract if exists
            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == dto.RentalRequestId);

            string protocolNumber = $"BBBG-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
            int odo = dto.OdoAtHandover > 0 ? dto.OdoAtHandover : (request.Vehicle?.CurrentMileage ?? 0);

            var protocol = new HandoverProtocol
            {
                Id = Guid.NewGuid(),
                ProtocolNumber = protocolNumber,
                RentalRequestId = request.Id,
                ContractId = contract?.Id,
                HandoverDate = DateTime.UtcNow,
                StaffName = !string.IsNullOrWhiteSpace(dto.StaffName) ? dto.StaffName : "Nhân viên kiểm định VELORA",
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                OdoAtHandover = odo,
                FuelLevel = fuelInt,
                ExteriorCondition = dto.ExteriorCondition ?? "Ngoại thất sạch sẽ, không biến dạng kết cấu",
                InteriorCondition = dto.InteriorCondition ?? "Nội thất sạch sẽ, da ghế nguyên vẹn, đầy đủ thảm sàn",
                TireCondition = dto.TireCondition ?? "4 lốp áp suất tiêu chuẩn, gai lốp tốt, mâm không cấn lề",
                AccessoriesChecklist = dto.AccessoriesChecklist ?? "Giấy đăng ký xe (Cavet);Giấy chứng nhận đăng kiểm;Bảo hiểm TNDS;Chìa khóa thông minh;Kích lốp;Lốp dự phòng;Camera hành trình",
                ExistingScratchesNotes = dto.ExistingScratchesNotes,
                EvidencePhotoUrls = dto.EvidencePhotoUrls,
                StaffNotes = dto.StaffNotes,
                StaffSignature = dto.StaffSignature,
                Status = "PENDING_CUSTOMER",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.HandoverProtocols.Add(protocol);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(protocol.Id))!;
        }

        public async Task<HandoverProtocolDto> UpdateAsync(Guid id, UpdateHandoverProtocolDto dto)
        {
            var protocol = await _context.HandoverProtocols.FindAsync(id);
            if (protocol == null)
            {
                throw new InvalidOperationException("Không tìm thấy biên bản bàn giao.");
            }

            protocol.OdoAtHandover = dto.OdoAtHandover;
            protocol.FuelLevel = ParseFuelLevel(dto.FuelLevel);
            protocol.ExteriorCondition = dto.ExteriorCondition;
            protocol.InteriorCondition = dto.InteriorCondition;
            protocol.TireCondition = dto.TireCondition;
            protocol.AccessoriesChecklist = dto.AccessoriesChecklist;
            protocol.ExistingScratchesNotes = dto.ExistingScratchesNotes;
            protocol.EvidencePhotoUrls = dto.EvidencePhotoUrls;
            protocol.StaffNotes = dto.StaffNotes;
            protocol.StaffSignature = dto.StaffSignature;
            protocol.Status = dto.Status;
            protocol.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return (await GetByIdAsync(protocol.Id))!;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var protocol = await _context.HandoverProtocols.FindAsync(id);
            if (protocol == null) return false;

            _context.HandoverProtocols.Remove(protocol);
            await _context.SaveChangesAsync();
            return true;
        }

        private static int ParseFuelLevel(string? fl)
        {
            if (string.IsNullOrWhiteSpace(fl)) return 100;
            var digits = new string(fl.Where(char.IsDigit).ToArray());
            return int.TryParse(digits, out int val) ? val : 100;
        }

        private static HandoverProtocolDto MapToDto(HandoverProtocol h)
        {
            var car = h.RentalRequest?.Vehicle;
            return new HandoverProtocolDto
            {
                Id = h.Id,
                ProtocolNumber = h.ProtocolNumber ?? $"BBBG-{h.Id.ToString()[..8].ToUpper()}",
                RentalRequestId = h.RentalRequestId ?? Guid.Empty,
                ContractId = h.ContractId,
                ContractNumber = h.RentalContract?.ContractNumber,
                CarId = car?.Id ?? Guid.Empty,
                LicensePlate = car?.LicensePlate,
                CarMake = car?.Make,
                CarModel = car?.Model,
                CarImageUrl = car?.ImageUrl,
                HandoverDate = h.HandoverDate,
                StaffName = h.StaffName,
                StaffId = h.StaffId,
                CustomerName = h.CustomerName ?? h.RentalRequest?.CustomerName ?? string.Empty,
                CustomerPhone = h.CustomerPhone ?? h.RentalRequest?.CustomerPhone ?? string.Empty,
                OdoAtHandover = h.OdoAtHandover,
                FuelLevel = $"{h.FuelLevel}%",
                ExteriorCondition = h.ExteriorCondition,
                InteriorCondition = h.InteriorCondition,
                TireCondition = h.TireCondition,
                AccessoriesChecklist = h.AccessoriesChecklist,
                ExistingScratchesNotes = h.ExistingScratchesNotes,
                EvidencePhotoUrls = h.EvidencePhotoUrls,
                StaffNotes = h.StaffNotes,
                StaffSignature = h.StaffSignature,
                Status = h.Status,
                CreatedAt = h.CreatedAt
            };
        }
    }
}
