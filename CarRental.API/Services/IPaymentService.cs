using System;
using System.Threading.Tasks;
using CarRental.API.DTOs.Payment;

namespace CarRental.API.Services
{
    public interface IPaymentService
    {
        Task<PaymentResponseDto> CreateDepositPaymentAsync(CreatePaymentDto dto);
        Task<PaymentResponseDto> ConfirmPaymentAsync(string transactionCode);
        Task<PaymentResponseDto?> GetPaymentByRequestIdAsync(Guid requestId);
    }
}
