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

        // ODO mốc xuất bãi và giao khách
        [Column("dispatch_odo")]
        public int? DispatchOdo { get; set; } // ODO lúc xe rời bãi

        [Column("handover_odo")]
        public int HandoverOdo { get; set; } // ODO lúc bàn giao cho khách thực tế

        // Cột cũ để duy trì tương thích ngược
        [Column("start_km")]
        public int OdoAtHandover { get; set; }

        // Mức nhiên liệu mốc xuất bãi và giao khách (decimal: % pin hoặc thang 8 vạch xăng)
        [Column("dispatch_fuel_level", TypeName = "decimal(5,2)")]
        public decimal? DispatchFuelLevel { get; set; }

        [Column("handover_fuel_level", TypeName = "decimal(5,2)")]
        public decimal HandoverFuelLevel { get; set; } = 100;

        // Cột cũ fuel_level
        [Column("fuel_level")]
        public int FuelLevel { get; set; } = 100;

        // Ảnh taplo bắt buộc lúc giao xe
        [Column("handover_dash_photo_url")]
        public string? HandoverDashPhotoUrl { get; set; }

        // Audit cảnh báo ODO trung chuyển
        [Column("has_transit_anomaly")]
        public bool HasTransitAnomaly { get; set; } = false;

        [Column("transit_anomaly_note")]
        public string? TransitAnomalyNote { get; set; }

        // Sơ đồ xước 2D phân tầng diff marker
        [Column("dispatch_damage_map")]
        public string? DispatchDamageMap { get; set; } // Marker kế thừa PRE_EXISTING

        [Column("handover_damage_map")]
        public string? HandoverDamageMap { get; set; } // Marker lúc gặp khách (PRE_EXISTING + TRANSIT_DELIVERY)

        // Cột cũ để duy trì tương thích ngược
        [Column("damages_desc")]
        public string? ExistingScratchesNotes { get; set; }

        [Column("damage_points_json")]
        public string? DamagePointsJson { get; set; }

        [Column("images")]
        public string? EvidencePhotoUrls { get; set; }

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

        [Column("customer_signature")]
        public string? CustomerSignature { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "IN_TRANSIT"; // IN_TRANSIT, COMPLETED

        [Column("handover_date")]
        public DateTime HandoverDate { get; set; } = DateTime.UtcNow;

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
