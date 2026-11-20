using Microsoft.EntityFrameworkCore;
using CarRental.API.Entities;

namespace CarRental.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Vehicle> Vehicles { get; set; } = null!;
        public DbSet<PricingPolicy> PricingPolicies { get; set; } = null!;
        public DbSet<RentalCondition> RentalConditions { get; set; } = null!;
        public DbSet<CompensationPolicy> CompensationPolicies { get; set; } = null!;
        public DbSet<ContractTemplate> ContractTemplates { get; set; } = null!;
        public DbSet<RentalRequest> RentalRequests { get; set; } = null!;
        public DbSet<AdditionalDriver> AdditionalDrivers { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<RentalContract> RentalContracts { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<CarInsurance> CarInsurances { get; set; } = null!;
        public DbSet<HandoverProtocol> HandoverProtocols { get; set; } = null!;
        public DbSet<RentalExtension> RentalExtensions { get; set; } = null!;
        public DbSet<IncidentReport> IncidentReports { get; set; } = null!;
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; } = null!;
        public DbSet<ReturnProtocol> ReturnProtocols { get; set; } = null!;
        public DbSet<RentalSettlement> RentalSettlements { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
        public DbSet<CustomerViolation> CustomerViolations { get; set; } = null!;
        public DbSet<SystemSetting> SystemSettings { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            base.ConfigureConventions(configurationBuilder);
            configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
            configurationBuilder.Properties<DateTime?>().HaveConversion<NullableUtcDateTimeConverter>();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var nameTranslator = new Npgsql.NameTranslation.NpgsqlNullNameTranslator();
            modelBuilder.HasPostgresEnum<VehicleStatus>("public", "car_status", nameTranslator: nameTranslator);
            modelBuilder.HasPostgresEnum<FuelType>("public", "fuel_type", nameTranslator: nameTranslator);
            modelBuilder.HasPostgresEnum<TransmissionType>("public", "car_transmission", nameTranslator: nameTranslator);

            // Configure User Email to be unique
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure LicensePlate to be unique
            modelBuilder.Entity<Vehicle>()
                .HasIndex(v => v.LicensePlate)
                .IsUnique();

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.Transmission)
                .HasConversion<string>();

            modelBuilder.Entity<Vehicle>()
                .Property(v => v.FuelType)
                .HasConversion<string>();

            // Configure 1-to-0..1 relationship
            modelBuilder.Entity<RentalCondition>()
                .HasOne(rc => rc.Vehicle)
                .WithOne(v => v.RentalCondition)
                .HasForeignKey<RentalCondition>(rc => rc.CarId);

            // Configure Cascade Delete for RentalRequest -> AdditionalDriver
            modelBuilder.Entity<RentalRequest>()
                .HasMany(rr => rr.AdditionalDrivers)
                .WithOne(ad => ad.RentalRequest)
                .HasForeignKey(ad => ad.RentalRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure ON DELETE RESTRICT on audit/financial/history tables to prevent accidental data loss
            modelBuilder.Entity<IncidentReport>()
                .HasOne(i => i.Vehicle)
                .WithMany()
                .HasForeignKey(i => i.CarId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<IncidentReport>()
                .HasOne(i => i.RentalRequest)
                .WithMany()
                .HasForeignKey(i => i.RentalRequestId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MaintenanceRecord>()
                .HasOne(m => m.Vehicle)
                .WithMany()
                .HasForeignKey(m => m.CarId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RentalExtension>()
                .HasOne(re => re.RentalRequest)
                .WithMany()
                .HasForeignKey(re => re.RentalRequestId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<CustomerViolation>()
                .HasOne(v => v.User)
                .WithMany(u => u.Violations)
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AdditionalDriver>()
                .HasOne(ad => ad.User)
                .WithMany(u => u.AdditionalDrivers)
                .HasForeignKey(ad => ad.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Composite Indexes for high-throughput queries
            modelBuilder.Entity<RentalRequest>()
                .HasIndex(r => new { r.CarId, r.Status, r.StartTime, r.EndTime })
                .HasDatabaseName("ix_rental_requests_car_id_status_start_end");

            modelBuilder.Entity<RentalRequest>()
                .HasIndex(r => new { r.CustomerEmail, r.CreatedAt })
                .IsDescending(false, true)
                .HasDatabaseName("ix_rental_requests_customer_email_created_at");

            modelBuilder.Entity<RentalContract>()
                .HasIndex(c => c.RequestId)
                .HasDatabaseName("ix_rental_contracts_request_id");

            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.TransactionCode)
                .IsUnique()
                .HasFilter("transaction_code IS NOT NULL AND transaction_code <> ''")
                .HasDatabaseName("ix_payments_transaction_code_unique");

            modelBuilder.Entity<Payment>()
                .HasIndex(p => new { p.RentalRequestId, p.Type, p.Status })
                .HasDatabaseName("ix_payments_rental_request_id_type_status");

            modelBuilder.Entity<CarInsurance>()
                .HasIndex(ci => ci.ExpiryDate)
                .HasDatabaseName("ix_car_insurances_end_date");


            // Configure SystemSettings
            modelBuilder.Entity<SystemSetting>(entity =>
            {
                entity.ToTable("system_settings");
                entity.HasKey(e => e.Key);
            });

            // Configure Notifications
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("notifications");
                entity.HasKey(e => e.Id);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt });
            });

            // Seed initial standard contract template
            modelBuilder.Entity<ContractTemplate>().HasData(
                new ContractTemplate
                {
                    Id = Guid.Parse("a0000000-0000-0000-0000-000000000001"),
                    Name = "Mẫu hợp đồng thuê xe tự lái tiêu chuẩn (v1.0)",
                    TemplateType = "DAILY",
                    Version = "v1.0",
                    Description = "Áp dụng cho tất cả các giao dịch thuê xe tự lái theo ngày trên hệ thống VELORA.",
                    Content = @"CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---o0o---

HỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI TIÊU CHUẨN
Mã hợp đồng: HD-{{LicensePlate}}-{{StartDate}}

Hôm nay, ngày ký hợp đồng, các bên gồm:

BÊN CHO THUÊ (BÊN A):
- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA
- Đại diện: Ban Điều Hành Hệ Thống Thuê Xe Tự Lái VELORA
- Hotline hỗ trợ 24/7: 1900 6868
- Trụ sở / Trạm bàn giao: {{PickupLocation}}

BÊN THUÊ XE (BÊN B):
- Họ và tên khách hàng: {{CustomerName}}
- Giấy phép lái xe: Đã xác thực thành công trên hệ thống VELORA
- Trạng thái xác thực hồ sơ: HỢP LỆ

Hai bên cùng thống nhất thỏa thuận và ký kết Hợp đồng thuê xe ô tô tự lái với các điều khoản chi tiết như sau:

ĐIỀU 1: THÔNG TIN PHƯƠNG TIỆN VÀ THỜI GIAN THUÊ
1.1. Thông tin phương tiện:
- Dòng xe: {{CarModel}}
- Biển số đăng ký: {{LicensePlate}}
- Tình trạng kỹ thuật: Xe bảo đảm an toàn vận hành, đầy đủ giấy tờ đăng kiểm, bảo hiểm và đã được vệ sinh sạch sẽ trước khi bàn giao.
1.2. Thời gian và địa điểm:
- Thời gian bắt đầu: {{StartDate}}
- Thời gian kết thúc dự kiến: {{EndDate}}
- Địa điểm nhận và bàn giao xe: {{PickupLocation}}

ĐIỀU 2: GIÁ THUÊ VÀ NGHĨA VỤ ĐẶT CỌC
2.1. Đơn giá thuê: {{DailyRate}} VNĐ/ngày (theo bảng giá niêm yết của hệ thống).
2.2. Tiền đặt cọc bảo đảm: {{DepositAmount}} VNĐ.
Khoản tiền đặt cọc này sẽ được hoàn trả đầy đủ cho Bên B sau khi kết thúc hợp đồng, hoàn tất biên bản kiểm tra trả xe và đối soát không phát sinh vi phạm giao thông / hư hỏng.
2.3. Phương thức thanh toán: Thanh toán trực tuyến qua cổng thanh toán liên kết hoặc ví điện tử của hệ thống.

ĐIỀU 3: TRÁCH NHIỆM VÀ NGHĨA VỤ CỦA KHÁCH HÀNG (BÊN B)
3.1. Chỉ khách hàng đã được định danh và xác minh GPLX hợp lệ mới được quyền điều khiển phương tiện.
3.2. Không được sử dụng xe vào các mục đích trái pháp luật, chở hàng cấm, đua xe trái phép hoặc cho thuê lại bên thứ ba.
3.3. Tự chịu trách nhiệm hoàn toàn đối với các lỗi vi phạm luật an toàn giao thông đường bộ (bao gồm cả phạt nguội) trong thời gian nhận bàn giao đến khi hoàn trả xe.
3.4. Hoàn trả xe đúng giờ thỏa thuận. Trường hợp cần gia hạn, Bên B phải gửi yêu cầu gia hạn trên ứng dụng trước thời hạn trả xe ít nhất 04 giờ.

ĐIỀU 4: PHỤ PHÍ VÀ QUY ĐỊNH BỒI THƯỜNG THIỆT HẠI
4.1. Phụ phí phát sinh vượt km quy định hoặc trễ giờ trả xe sẽ được tính theo Chính sách phụ phí niêm yết hiện hành của VELORA.
4.2. Mức nhiên liệu khi trả xe phải tương đương mức nhiên liệu lúc nhận xe. Nếu thấp hơn, Bên B chịu phí chênh lệch nhiên liệu cộng phí dịch vụ.
4.3. Trường hợp xảy ra trầy xước, va chạm, hỏng hóc hoặc sự cố, mức phạt và bồi thường sẽ căn cứ theo Bảng chính sách bồi thường thiệt hại và hợp đồng bảo hiểm đã công bố của VELORA.

ĐIỀU 5: HIỆU LỰC HỢP ĐỒNG
5.1. Hai bên cam kết tuân thủ nghiêm túc các điều khoản đã thỏa thuận trong hợp đồng điện tử này.
5.2. Hợp đồng có hiệu lực pháp lý kể từ thời điểm Bên B hoàn tất thanh toán tiền cọc và ký nhận biên bản bàn giao phương tiện.",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 26, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = null
                }
            );
        }
    }
}
