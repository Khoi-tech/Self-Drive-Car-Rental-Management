using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CarRental.API.Data;
using CarRental.API.DTOs.ReturnProtocol;
using CarRental.API.Entities;

namespace CarRental.API.Services
{
    public class ReturnProtocolService : IReturnProtocolService
    {
        private readonly AppDbContext _context;

        public ReturnProtocolService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ReturnProtocolResponseDto>> GetAllAsync()
        {
            var protocols = await _context.ReturnProtocols
                .Include(p => p.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return protocols.Select(MapToDto);
        }

        public async Task<ReturnProtocolResponseDto?> GetByIdAsync(Guid id)
        {
            var protocol = await _context.ReturnProtocols
                .Include(p => p.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .FirstOrDefaultAsync(p => p.Id == id);

            return protocol != null ? MapToDto(protocol) : null;
        }

        public async Task<ReturnProtocolResponseDto?> GetByRequestIdAsync(Guid requestId)
        {
            var protocol = await _context.ReturnProtocols
                .Include(p => p.RentalRequest)
                    .ThenInclude(r => r!.Vehicle)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(p => p.RentalRequestId == requestId);

            return protocol != null ? MapToDto(protocol) : null;
        }

        public async Task<ReturnProtocolResponseDto> CreateAsync(CreateReturnProtocolDto dto, Guid? staffId, string staffName)
        {
            var request = await _context.RentalRequests
                .Include(r => r.Vehicle)
                .FirstOrDefaultAsync(r => r.Id == dto.RentalRequestId);

            if (request == null)
            {
                throw new KeyNotFoundException("Không tìm thấy thông tin đơn thuê xe tương ứng.");
            }

            var contract = await _context.RentalContracts
                .FirstOrDefaultAsync(c => c.RequestId == dto.RentalRequestId);

            // Tìm biên bản bàn giao nhận xe ban đầu để đối chiếu
            var handover = await _context.HandoverProtocols
                .OrderByDescending(h => h.CreatedAt)
                .FirstOrDefaultAsync(h => h.RentalRequestId == dto.RentalRequestId);

            int startOdo = handover?.OdoAtHandover ?? request.Vehicle?.CurrentMileage ?? 0;
            int initialFuelLevel = handover?.FuelLevel ?? 100;

            int totalKm = Math.Max(0, dto.EndOdo - startOdo);

            // Giới hạn km từ hợp đồng hoặc theo ngày thuê * hạn mức xe
            int? maxKm = contract?.MaxKm;
            if (maxKm == null || maxKm <= 0)
            {
                if (request.Vehicle?.MileageLimit != null && request.Vehicle.MileageLimit > 0)
                {
                    maxKm = request.Vehicle.MileageLimit.Value * Math.Max(1, request.TotalDays);
                }
            }

            int excessKm = 0;
            if (maxKm.HasValue && totalKm > maxKm.Value)
            {
                excessKm = totalKm - maxKm.Value;
            }

            int fuelDiff = Math.Max(0, initialFuelLevel - dto.ReturnFuelLevel);

            string protocolNumber = $"BBHT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";

            var protocol = new ReturnProtocol
            {
                Id = Guid.NewGuid(),
                ProtocolNumber = protocolNumber,
                RentalRequestId = dto.RentalRequestId,
                ContractId = contract?.Id ?? dto.ContractId,
                StaffId = staffId,
                StaffName = string.IsNullOrWhiteSpace(staffName) ? "Nhân viên kiểm định VELORA" : staffName,
                CustomerName = request.CustomerName,
                CustomerPhone = request.CustomerPhone,
                ReturnDate = dto.ReturnDate != default ? dto.ReturnDate : DateTime.UtcNow,
                StartOdo = startOdo,
                EndOdo = dto.EndOdo,
                TotalKmDriven = totalKm,
                MaxKmAllowed = maxKm,
                ExcessKm = excessKm,
                InitialFuelLevel = initialFuelLevel,
                ReturnFuelLevel = dto.ReturnFuelLevel,
                FuelDifference = fuelDiff,
                ExteriorCondition = dto.ExteriorCondition ?? "Ngoại thất bình thường",
                InteriorCondition = dto.InteriorCondition ?? "Nội thất bình thường",
                TireCondition = dto.TireCondition ?? "Lốp xe bình thường",
                NewDamagesNotes = dto.NewDamagesNotes,
                AccessoriesChecklist = dto.AccessoriesChecklist,
                MissingAccessories = dto.MissingAccessories,
                EvidencePhotoUrls = dto.EvidencePhotoUrls,
                StaffNotes = dto.StaffNotes,
                StaffSignature = dto.StaffSignature,
                CustomerSignature = dto.CustomerSignature,
                NextVehicleStatus = dto.NextVehicleStatus ?? "READY",
                Status = "COMPLETED",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ReturnProtocols.Add(protocol);

            // Cập nhật ODO xe
            if (request.Vehicle != null)
            {
                if (dto.EndOdo > request.Vehicle.CurrentMileage)
                {
                    request.Vehicle.CurrentMileage = dto.EndOdo;
                }
            }

            await _context.SaveChangesAsync();

            // Tải lại để map DTO đầy đủ
            protocol.RentalRequest = request;
            return MapToDto(protocol);
        }

        private static ReturnProtocolResponseDto MapToDto(ReturnProtocol entity)
        {
            var vehicle = entity.RentalRequest?.Vehicle;
            return new ReturnProtocolResponseDto
            {
                Id = entity.Id,
                ProtocolNumber = entity.ProtocolNumber,
                RentalRequestId = entity.RentalRequestId,
                ContractId = entity.ContractId,
                CarId = vehicle?.Id,
                CarMake = vehicle?.Make,
                CarModel = vehicle?.Model,
                LicensePlate = vehicle?.LicensePlate,
                StaffId = entity.StaffId,
                StaffName = entity.StaffName,
                CustomerName = entity.CustomerName ?? entity.RentalRequest?.CustomerName,
                CustomerPhone = entity.CustomerPhone ?? entity.RentalRequest?.CustomerPhone,
                ReturnDate = entity.ReturnDate,
                StartOdo = entity.StartOdo,
                EndOdo = entity.EndOdo,
                TotalKmDriven = entity.TotalKmDriven,
                MaxKmAllowed = entity.MaxKmAllowed,
                ExcessKm = entity.ExcessKm,
                InitialFuelLevel = entity.InitialFuelLevel,
                ReturnFuelLevel = entity.ReturnFuelLevel,
                FuelDifference = entity.FuelDifference,
                ExteriorCondition = entity.ExteriorCondition,
                InteriorCondition = entity.InteriorCondition,
                TireCondition = entity.TireCondition,
                NewDamagesNotes = entity.NewDamagesNotes,
                AccessoriesChecklist = entity.AccessoriesChecklist,
                MissingAccessories = entity.MissingAccessories,
                EvidencePhotoUrls = entity.EvidencePhotoUrls,
                StaffNotes = entity.StaffNotes,
                StaffSignature = entity.StaffSignature,
                CustomerSignature = entity.CustomerSignature,
                NextVehicleStatus = entity.NextVehicleStatus,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt
            };
        }
    }
}
