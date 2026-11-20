using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CarRental.API.Data;
using CarRental.API.Services;

namespace CarRental.API.Workers
{
    /// <summary>
    /// Worker quét định kỳ hàng ngày lúc 08:00 giờ Việt Nam (01:00 UTC) để:
    /// 1. Cảnh báo các hợp đồng quyết toán đang giữ quỹ phạt nguội (2.000.000đ) đạt mốc 15-30 ngày cần hoàn trả.
    /// 2. Cảnh báo các xe có bảo hiểm sắp hết hạn trong vòng 30 ngày.
    /// </summary>
    public class DailyOperationalAlertsWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DailyOperationalAlertsWorker> _logger;

        public DailyOperationalAlertsWorker(IServiceScopeFactory scopeFactory, ILogger<DailyOperationalAlertsWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyOperationalAlertsWorker đã khởi động. Lịch trình: 08:00 sáng giờ Việt Nam (01:00 UTC) hàng ngày.");

            // Chạy kiểm tra khởi động sau 15 giây để xác nhận trạng thái hệ thống ngay khi boot
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
                _logger.LogInformation("DailyOperationalAlertsWorker: Chạy kiểm tra quét cảnh báo lúc khởi động...");
                await RunAlertChecksAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                var delay = GetDelayUntilNext8AmVn();
                _logger.LogInformation("DailyOperationalAlertsWorker: Lần quét tiếp theo sẽ diễn ra sau {Hours:N1} giờ (lúc 08:00 sáng VN).", delay.TotalHours);

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                await RunAlertChecksAsync(stoppingToken);
            }

            _logger.LogInformation("DailyOperationalAlertsWorker đã dừng.");
        }

        private async Task RunAlertChecksAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var insuranceService = scope.ServiceProvider.GetRequiredService<ICarInsuranceService>();

                var now = DateTime.UtcNow;

                // ==============================================================
                // 1. Quét cảnh báo Quỹ phạt nguội (2.000.000đ) đạt mốc 15-30 ngày
                // ==============================================================
                await CheckTrafficFineHoldAlertsAsync(db, now, stoppingToken);

                // ==============================================================
                // 2. Quét cảnh báo Bảo hiểm xe sắp hết hạn trong 30 ngày
                // ==============================================================
                await CheckCarInsuranceAlertsAsync(insuranceService, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi trong quá trình chạy kiểm tra cảnh báo vận hành hàng ngày: {Message}", ex.Message);
            }
        }

        private async Task CheckTrafficFineHoldAlertsAsync(AppDbContext db, DateTime now, CancellationToken stoppingToken)
        {
            var fifteenDaysAgo = now.AddDays(-15);

            var holdingSettlements = await db.RentalSettlements
                .Include(s => s.RentalRequest)
                .Include(s => s.RentalContract)
                .Where(s => s.TrafficFineHoldAmount > 0
                         && s.TrafficFineRefundStatus == "HOLDING"
                         && ((s.TrafficFineRefundDate != null && s.TrafficFineRefundDate <= now)
                             || (s.CreatedAt != null && s.CreatedAt <= fifteenDaysAgo)))
                .OrderBy(s => s.CreatedAt)
                .ToListAsync(stoppingToken);

            if (!holdingSettlements.Any())
            {
                _logger.LogInformation("[QUỸ PHẠT NGUỘI] Hiện tại không có hồ sơ quyết toán nào đến hạn hoàn cọc phạt nguội.");
                return;
            }

            _logger.LogWarning(
                "========================================================================================\n" +
                "[CẢNH BÁO VẬN HÀNH - QUỸ PHẠT NGUỘI] Có {Count} hồ sơ quyết toán đang giữ cọc phạt nguội 15-30 ngày cần đối soát/hoàn trả:\n" +
                "========================================================================================",
                holdingSettlements.Count);

            foreach (var s in holdingSettlements)
            {
                var daysHeld = s.CreatedAt.HasValue ? (int)(now - s.CreatedAt.Value).TotalDays : 15;
                var customerName = s.RentalRequest?.CustomerName ?? "Chưa rõ";
                var customerPhone = s.RentalRequest?.CustomerPhone ?? "Chưa rõ";
                var contractNum = s.RentalContract?.ContractNumber ?? "Chưa rõ";

                _logger.LogWarning(
                    " -> Hồ sơ #{SettlementNumber} | Hợp đồng: {Contract} | Khách hàng: {Customer} ({Phone}) | Đang giữ: {Amount:N0} VNĐ ({DaysHeld} ngày) | Ngày dự kiến hoàn: {RefundDate:dd/MM/yyyy}. => NHẮC NHỞ: Staff hãy tra cứu trên csgt.vn và tiến hành xử lý hoàn cọc trên hệ thống.",
                    s.SettlementNumber ?? s.Id.ToString()[..8].ToUpper(),
                    contractNum,
                    customerName,
                    customerPhone,
                    s.TrafficFineHoldAmount,
                    daysHeld,
                    s.TrafficFineRefundDate ?? now);
            }
        }

        private async Task CheckCarInsuranceAlertsAsync(ICarInsuranceService insuranceService, CancellationToken stoppingToken)
        {
            var insuranceAlerts = await insuranceService.GetAlertsAsync();

            if (!insuranceAlerts.Any())
            {
                _logger.LogInformation("[BẢO HIỂM XE] Tất cả bảo hiểm phương tiện đang hoạt động bình thường, không có xe nào hết hạn trong 30 ngày tới.");
                return;
            }

            _logger.LogWarning(
                "========================================================================================\n" +
                "[CẢNH BÁO VẬN HÀNH - BẢO HIỂM XE] Có {Count} gói bảo hiểm phương tiện sắp hoặc đã hết hạn:\n" +
                "========================================================================================",
                insuranceAlerts.Count);

            foreach (var alert in insuranceAlerts)
            {
                _logger.LogWarning(
                    " -> [{Level}] Xe: {LicensePlate} ({CarName}) | Loại: {Type} | Đơn vị: {Company} (HĐ: {Policy}) | Ngày hết hạn: {ExpiryDate:dd/MM/yyyy} ({Days} ngày còn lại). => NHẮC NHỞ: Liên hệ công ty bảo hiểm để gia hạn kịp thời.",
                    alert.AlertLevel,
                    alert.LicensePlate,
                    alert.CarName,
                    alert.InsuranceType,
                    alert.InsuranceCompany,
                    alert.PolicyNumber,
                    alert.ExpiryDate,
                    alert.DaysRemaining);
            }
        }

        private static TimeSpan GetDelayUntilNext8AmVn()
        {
            var nowUtc = DateTime.UtcNow;
            // 08:00 sáng VN (UTC+7) tương ứng với 01:00 UTC cùng ngày
            var targetUtc = new DateTime(nowUtc.Year, nowUtc.Month, nowUtc.Day, 1, 0, 0, DateTimeKind.Utc);
            if (nowUtc >= targetUtc)
            {
                targetUtc = targetUtc.AddDays(1);
            }
            return targetUtc - nowUtc;
        }
    }
}
