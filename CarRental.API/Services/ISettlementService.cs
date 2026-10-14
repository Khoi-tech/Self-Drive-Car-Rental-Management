using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CarRental.API.DTOs.Settlement;

namespace CarRental.API.Services
{
    public interface ISettlementService
    {
        Task<PreviewSettlementDto> PreviewSettlementAsync(Guid requestId);
        Task<SettlementResponseDto> CreateSettlementAsync(CreateSettlementDto dto, Guid? staffId, string staffName);
        Task<SettlementResponseDto?> GetByIdAsync(Guid id);
        Task<SettlementResponseDto?> GetByRequestIdAsync(Guid requestId);
        Task<IEnumerable<SettlementResponseDto>> GetAllAsync();
        Task<SettlementResponseDto> ConfirmRefundAsync(Guid id, ConfirmRefundDto dto);
        Task<SettlementResponseDto> ConfirmAdditionalPaymentAsync(Guid id, ConfirmAdditionalPaymentDto dto);
    }
}
