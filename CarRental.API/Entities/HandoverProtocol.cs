using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("handover_protocols")]
    public class HandoverProtocol
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Column("protocol_number")]
        [MaxLength(50)]
        public string? ProtocolNumber { get; set; }

        [Column("rental_request_id")]
        public Guid? RentalRequestId { get; set; }

        [ForeignKey("RentalRequestId")]
        public virtual RentalRequest? RentalRequest { get; set; }

        [Column("contract_id")]
        public Guid? ContractId { get; set; }

        [ForeignKey("ContractId")]
        public virtual RentalContract? RentalContract { get; set; }

        [Column("staff_id")]
        public Guid? StaffId { get; set; }

        [Column("staff_name")]
        [MaxLength(100)]
        public string StaffName { get; set; } = "Nhân viên kiểm định VELORA";

        [Column("customer_name")]
        [MaxLength(100)]
        public string? CustomerName { get; set; }

        [Column("customer_phone")]
        [MaxLength(20)]
        public string? CustomerPhone { get; set; }

        [Column("start_km")]
        public int OdoAtHandover { get; set; } // Số km lúc bàn giao

        [Column("fuel_level")]
        public int FuelLevel { get; set; } = 100; // 25, 50, 75, 100

        [Column("damages_desc")]
        public string? ExistingScratchesNotes { get; set; } // Mô tả vết xước, móp cũ đã có trước khi giao

        [Column("images")]
        public string? EvidencePhotoUrls { get; set; } // Danh sách URL ảnh minh chứng

        [Column("exterior_condition")]
        public string? ExteriorCondition { get; set; } = "Ngoại thất sạch sẽ, không biến dạng kết cấu";

        [Column("interior_condition")]
        public string? InteriorCondition { get; set; } = "Nội thất sạch sẽ, da ghế nguyên vẹn, đầy đủ thảm sàn";

        [Column("tire_condition")]
        public string? TireCondition { get; set; } = "4 lốp áp suất tiêu chuẩn, gai lốp tốt, mâm không cấn lề";

        [Column("accessories_checklist")]
        public string? AccessoriesChecklist { get; set; } = "Giấy đăng ký xe (Cavet);Giấy chứng nhận đăng kiểm;Bảo hiểm TNDS;Chìa khóa thông minh;Kích lốp;Lốp dự phòng;Camera hành trình";

        [Column("staff_notes")]
        public string? StaffNotes { get; set; }

        [Column("staff_signature")]
        public string? StaffSignature { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "PENDING_CUSTOMER"; // DRAFT, PENDING_CUSTOMER, CONFIRMED, COMPLETED

        [Column("handover_date")]
        public DateTime HandoverDate { get; set; } = DateTime.UtcNow;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
