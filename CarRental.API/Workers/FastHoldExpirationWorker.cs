using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CarRental.API.Data;
using CarRental.API.Entities;

namespace CarRental.API.Workers
{
    /// <summary>
    /// Worker quét định kỳ mỗi 5 phút để hủy các đơn Fast Hold quá hạn 4 giờ
    /// mà chưa hoàn tất giấy tờ CCCD/GPLX hoặc tiền cọc thế chân, và tự động giải phóng xe về READY.
    /// </summary>
    public class FastHoldExpirationWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<FastHoldExpirationWorker> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);

        public FastHoldExpirationWorker(IServiceScopeFactory scopeFactory, ILogger<FastHoldExpirationWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("FastHoldExpirationWorker đã khởi động. Chu kỳ quét: mỗi {IntervalMinutes} phút.", _checkInterval.TotalMinutes);

            // Chờ 10 giây sau khi ứng dụng khởi động trước khi thực hiện lần quét đầu tiên
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            using var timer = new PeriodicTimer(_checkInterval);

            // Thực thi ngay lần đầu sau delay khởi động
            await ProcessExpiredFastHoldsAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessExpiredFastHoldsAsync(stoppingToken);
            }

            _logger.LogInformation("FastHoldExpirationWorker đã dừng.");
        }

        private async Task ProcessExpiredFastHoldsAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var now = DateTime.UtcNow;

                // Tìm các đơn FAST_HOLD đã quá hạn hold_expires_at nhưng chưa hoàn tất
                var expiredRequests = await db.RentalRequests
                    .Include(r => r.Vehicle)
                    .Where(r => r.BookingType == "FAST_HOLD"
                             && r.HoldExpiresAt != null
                             && r.HoldExpiresAt < now
                             && r.Status != "CANCELLED"
                             && r.Status != "REJECTED"
                             && r.Status != "COMPLETED"
                             && r.Status != "SIGNED"
                             && r.Status != "ACTIVE"
                             && (!r.IsSecurityDepositPaid
                                 || string.IsNullOrEmpty(r.CustomerIdCard)
                                 || r.CustomerIdCard == "CHƯA_CẬP_NHẬT"
                                 || string.IsNullOrEmpty(r.DriverLicenseNumber)
                                 || r.DriverLicenseNumber == "CHƯA_CẬP_NHẬT"))
                    .ToListAsync(stoppingToken);

                if (!expiredRequests.Any())
                {
                    _logger.LogDebug("FastHoldExpirationWorker: Không có đơn Fast Hold nào quá hạn tại {Time:yyyy-MM-dd HH:mm:ss} UTC.", now);
                    return;
                }

                _logger.LogInformation("FastHoldExpirationWorker: Phát hiện {Count} đơn Fast Hold quá hạn cần tự động hủy.", expiredRequests.Count);

                foreach (var request in expiredRequests)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    try
                    {
                        using var transaction = await db.Database.BeginTransactionAsync(stoppingToken);

                        request.Status = "CANCELLED";
                        request.RejectReason = "Hết hạn giữ chỗ 4 giờ (Fast Hold) mà chưa hoàn tất giấy tờ hoặc thanh toán cọc thế chân.";
                        request.Notes = string.IsNullOrWhiteSpace(request.Notes)
                            ? $"[HỆ THỐNG {now:dd/MM/yyyy HH:mm} UTC] Tự động hủy đơn do quá hạn 4 giờ Fast Hold."
                            : $"{request.Notes}\n[HỆ THỐNG {now:dd/MM/yyyy HH:mm} UTC] Tự động hủy đơn do quá hạn 4 giờ Fast Hold.";
                        request.UpdatedAt = now;

                        // Tự động giải phóng xe về READY nếu xe đang ở trạng thái BOOKED
                        if (request.Vehicle != null && request.Vehicle.Status == VehicleStatus.BOOKED)
                        {
                            request.Vehicle.Status = VehicleStatus.READY;
                            request.Vehicle.UpdatedAt = now;
                        }

                        await db.SaveChangesAsync(stoppingToken);
                        await transaction.CommitAsync(stoppingToken);

                        _logger.LogInformation(
                            "-> Đã tự động hủy đơn Fast Hold {RequestId} (Hết hạn lúc: {ExpiredAt:yyyy-MM-dd HH:mm:ss} UTC). Xe {VehicleId} ({LicensePlate}) đã được hoàn trả về READY.",
                            request.Id,
                            request.HoldExpiresAt,
                            request.CarId,
                            request.Vehicle?.LicensePlate ?? "Chưa rõ");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Lỗi khi tự động hủy đơn Fast Hold {RequestId}: {Message}", request.Id, ex.Message);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FastHoldExpirationWorker gặp lỗi trong quá trình quét đơn: {Message}", ex.Message);
            }
        }
    }
}
