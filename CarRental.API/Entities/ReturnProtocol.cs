using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarRental.API.Entities
{
    [Table("return_protocols")]
    public class ReturnProtocol
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

        [Column("return_date")]
        public DateTime ReturnDate { get; set; } = DateTime.UtcNow;

        // Mốc ODO khách trả xe và xe về bãi
        [Column("customer_return_odo")]
        public int CustomerReturnOdo { get; set; } // ODO lúc khách hoàn trả thực tế

        [Column("yard_checkin_odo")]
        public int? YardCheckinOdo { get; set; } // ODO khi xe về tới bãi trung chuyển

        // Cột cũ để duy trì tương thích ngược
        [Column("start_km")]
        public int StartOdo { get; set; }

        [Column("end_km")]
        public int EndOdo { get; set; }

        [Column("total_km_driven")]
        public int TotalKmDriven { get; set; }

        [Column("max_km_allowed")]
        public int? MaxKmAllowed { get; set; }

        [Column("excess_km")]
        public int ExcessKm { get; set; } = 0;

        // Mốc nhiên liệu / pin (decimal: % pin hoặc thang 8 vạch xăng)
        [Column("customer_return_fuel_level", TypeName = "decimal(5,2)")]
        public decimal CustomerReturnFuelLevel { get; set; } = 100;

        [Column("yard_checkin_fuel_level", TypeName = "decimal(5,2)")]
        public decimal? YardCheckinFuelLevel { get; set; }

        // Cột cũ để duy trì tương thích ngược
        [Column("initial_fuel_level")]
        public int InitialFuelLevel { get; set; } = 100;

        [Column("fuel_level")]
        public int ReturnFuelLevel { get; set; } = 100;

        [Column("fuel_difference")]
        public int FuelDifference { get; set; } = 0;

        // Ảnh đồng hồ taplo lúc trả xe
        [Column("return_dash_photo_url")]
        public string? ReturnDashPhotoUrl { get; set; }

        // Audit cảnh báo ODO chiều về
        [Column("has_return_anomaly")]
        public bool HasReturnAnomaly { get; set; } = false;

        [Column("return_anomaly_note")]
        public string? ReturnAnomalyNote { get; set; }

        // Sơ đồ xước 2D nghiệm thu trả xe
        [Column("return_damage_map")]
        public string? ReturnDamageMap { get; set; } // Marker CUSTOMER_RENTAL / TRANSIT_RETURN

        [Column("exterior_condition")]
        public string? ExteriorCondition { get; set; } = "Ngoại thất sạch sẽ, không móp méo kết cấu mới";

        [Column("interior_condition")]
        public string? InteriorCondition { get; set; } = "Nội thất sạch sẽ, ghế da và sàn xe nguyên vẹn";

        [Column("tire_condition")]
        public string? TireCondition { get; set; } = "4 lốp áp suất đạt chuẩn, không phù rách";

        [Column("new_damages_notes")]
        public string? NewDamagesNotes { get; set; }

        [Column("damage_points_json")]
        public string? DamagePointsJson { get; set; }

        [Column("accessories_checklist")]
        public string? AccessoriesChecklist { get; set; } = "Giấy đăng ký xe (Cavet);Giấy chứng nhận đăng kiểm;Bảo hiểm TNDS;Chìa khóa thông minh;Kích lốp;Lốp dự phòng;Camera hành trình";

        [Column("missing_accessories")]
        public string? MissingAccessories { get; set; }

        [Column("evidence_photo_urls")]
        public string? EvidencePhotoUrls { get; set; }

        [Column("staff_notes")]
        public string? StaffNotes { get; set; }

        [Column("staff_signature")]
        public string? StaffSignature { get; set; }

        [Column("customer_signature")]
        public string? CustomerSignature { get; set; }

        [Column("next_vehicle_status")]
        [MaxLength(50)]
        public string NextVehicleStatus { get; set; } = "READY"; // READY, CLEANING, MAINTENANCE, REPAIR

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "COMPLETED"; // DRAFT, COMPLETED

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
