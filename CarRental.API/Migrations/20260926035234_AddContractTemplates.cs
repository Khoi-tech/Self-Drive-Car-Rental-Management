using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRental.API.Migrations
{
    /// <inheritdoc />
    public partial class AddContractTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contract_templates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    template_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_templates", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "contract_templates",
                columns: new[] { "id", "content", "created_at", "description", "is_active", "name", "template_type", "updated_at", "version" },
                values: new object[] { new Guid("a0000000-0000-0000-0000-000000000001"), "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n---o0o---\n\nHỢP ĐỒNG THUÊ XE Ô TÔ TỰ LÁI TIÊU CHUẨN\nMã hợp đồng: HD-{{LicensePlate}}-{{StartDate}}\n\nHôm nay, ngày ký hợp đồng, các bên gồm:\n\nBÊN CHO THUÊ (BÊN A):\n- Đơn vị: CÔNG TY TNHH DỊCH VỤ VẬN TẢI VELORA\n- Đại diện: Ban Điều Hành Hệ Thống Thuê Xe Tự Lái VELORA\n- Hotline hỗ trợ 24/7: 1900 6868\n- Trụ sở / Trạm bàn giao: {{PickupLocation}}\n\nBÊN THUÊ XE (BÊN B):\n- Họ và tên khách hàng: {{CustomerName}}\n- Giấy phép lái xe: Đã xác thực thành công trên hệ thống VELORA\n- Trạng thái xác thực hồ sơ: HỢP LỆ\n\nHai bên cùng thống nhất thỏa thuận và ký kết Hợp đồng thuê xe ô tô tự lái với các điều khoản chi tiết như sau:\n\nĐIỀU 1: THÔNG TIN PHƯƠNG TIỆN VÀ THỜI GIAN THUÊ\n1.1. Thông tin phương tiện:\n- Dòng xe: {{CarModel}}\n- Biển số đăng ký: {{LicensePlate}}\n- Tình trạng kỹ thuật: Xe bảo đảm an toàn vận hành, đầy đủ giấy tờ đăng kiểm, bảo hiểm và đã được vệ sinh sạch sẽ trước khi bàn giao.\n1.2. Thời gian và địa điểm:\n- Thời gian bắt đầu: {{StartDate}}\n- Thời gian kết thúc dự kiến: {{EndDate}}\n- Địa điểm nhận và bàn giao xe: {{PickupLocation}}\n\nĐIỀU 2: GIÁ THUÊ VÀ NGHĨA VỤ ĐẶT CỌC\n2.1. Đơn giá thuê: {{DailyRate}} VNĐ/ngày (theo bảng giá niêm yết của hệ thống).\n2.2. Tiền đặt cọc bảo đảm: {{DepositAmount}} VNĐ.\nKhoản tiền đặt cọc này sẽ được hoàn trả đầy đủ cho Bên B sau khi kết thúc hợp đồng, hoàn tất biên bản kiểm tra trả xe và đối soát không phát sinh vi phạm giao thông / hư hỏng.\n2.3. Phương thức thanh toán: Thanh toán trực tuyến qua cổng thanh toán liên kết hoặc ví điện tử của hệ thống.\n\nĐIỀU 3: TRÁCH NHIỆM VÀ NGHĨA VỤ CỦA KHÁCH HÀNG (BÊN B)\n3.1. Chỉ khách hàng đã được định danh và xác minh GPLX hợp lệ mới được quyền điều khiển phương tiện.\n3.2. Không được sử dụng xe vào các mục đích trái pháp luật, chở hàng cấm, đua xe trái phép hoặc cho thuê lại bên thứ ba.\n3.3. Tự chịu trách nhiệm hoàn toàn đối với các lỗi vi phạm luật an toàn giao thông đường bộ (bao gồm cả phạt nguội) trong thời gian nhận bàn giao đến khi hoàn trả xe.\n3.4. Hoàn trả xe đúng giờ thỏa thuận. Trường hợp cần gia hạn, Bên B phải gửi yêu cầu gia hạn trên ứng dụng trước thời hạn trả xe ít nhất 04 giờ.\n\nĐIỀU 4: PHỤ PHÍ VÀ QUY ĐỊNH BỒI THƯỜNG THIỆT HẠI\n4.1. Phụ phí phát sinh vượt km quy định hoặc trễ giờ trả xe sẽ được tính theo Chính sách phụ phí niêm yết hiện hành của VELORA.\n4.2. Mức nhiên liệu khi trả xe phải tương đương mức nhiên liệu lúc nhận xe. Nếu thấp hơn, Bên B chịu phí chênh lệch nhiên liệu cộng phí dịch vụ.\n4.3. Trường hợp xảy ra trầy xước, va chạm, hỏng hóc hoặc sự cố, mức phạt và bồi thường sẽ căn cứ theo Bảng chính sách bồi thường thiệt hại và hợp đồng bảo hiểm đã công bố của VELORA.\n\nĐIỀU 5: HIỆU LỰC HỢP ĐỒNG\n5.1. Hai bên cam kết tuân thủ nghiêm túc các điều khoản đã thỏa thuận trong hợp đồng điện tử này.\n5.2. Hợp đồng có hiệu lực pháp lý kể từ thời điểm Bên B hoàn tất thanh toán tiền cọc và ký nhận biên bản bàn giao phương tiện.", new DateTime(2026, 9, 26, 0, 0, 0, 0, DateTimeKind.Utc), "Áp dụng cho tất cả các giao dịch thuê xe tự lái theo ngày trên hệ thống VELORA.", true, "Mẫu hợp đồng thuê xe tự lái tiêu chuẩn (v1.0)", "DAILY", null, "v1.0" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "contract_templates");
        }
    }
}
