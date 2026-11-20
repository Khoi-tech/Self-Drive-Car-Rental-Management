using System;
using System.Collections.Generic;

namespace CarRental.API.DTOs.Handover
{
    public class HandoverProtocolDto
    {
        public Guid Id { get; set; }
        public string ProtocolNumber { get; set; } = null!;
        public Guid RentalRequestId { get; set; }
        public Guid? ContractId { get; set; }
        public string? ContractNumber { get; set; }
        public Guid CarId { get; set; }
        public string? LicensePlate { get; set; }
        public string? CarMake { get; set; }
        public string? CarModel { get; set; }
        public string? CarImageUrl { get; set; }
        public DateTime HandoverDate { get; set; }
        public string StaffName { get; set; } = null!;
        public Guid? StaffId { get; set; }
        public string CustomerName { get; set; } = null!;
        public string CustomerPhone { get; set; } = null!;

        // ODO mốc xuất bãi & bàn giao khách
        public int? DispatchOdo { get; set; }
        public int HandoverOdo { get; set; }

        // Nhiên liệu mốc xuất bãi & bàn giao khách
        public decimal? DispatchFuelLevel { get; set; }
        public decimal HandoverFuelLevel { get; set; } = 100;
        public string? HandoverDashPhotoUrl { get; set; }

        // Audit cảnh báo ODO trung chuyển
        public bool HasTransitAnomaly { get; set; }
        public string? TransitAnomalyNote { get; set; }

        // Sơ đồ xước 2D phân tầng
        public string? DispatchDamageMap { get; set; }
        public string? HandoverDamageMap { get; set; }

        // Cột cũ để duy trì tương thích ngược
        public int OdoAtHandover { get; set; }
        public string FuelLevel { get; set; } = "100%";
        public string ExteriorCondition { get; set; } = null!;
        public string InteriorCondition { get; set; } = null!;
        public string TireCondition { get; set; } = null!;
        public string AccessoriesChecklist { get; set; } = null!;
        public string? ExistingScratchesNotes { get; set; }
        public string? DamagePointsJson { get; set; }
        public string? EvidencePhotoUrls { get; set; }
        public string? StaffNotes { get; set; }
        public string? StaffSignature { get; set; }
        public string? CustomerSignature { get; set; }
        public string Status { get; set; } = "IN_TRANSIT";
        public DateTime? CreatedAt { get; set; }
    }

    public class CreateHandoverProtocolDto
    {
        public Guid RentalRequestId { get; set; }
        public string? StaffName { get; set; }

        // ODO mốc mới
        public int? DispatchOdo { get; set; }
        public int? HandoverOdo { get; set; }

        // Nhiên liệu mốc mới
        public decimal? DispatchFuelLevel { get; set; }
        public decimal? HandoverFuelLevel { get; set; }
        public string? HandoverDashPhotoUrl { get; set; }

        // Audit ODO & sơ đồ 2D
        public string? TransitAnomalyNote { get; set; }
        public string? DispatchDamageMap { get; set; }
        public string? HandoverDamageMap { get; set; }

        // Trường cũ tương thích
        public int OdoAtHandover { get; set; }
        public string FuelLevel { get; set; } = "100%";
        public string ExteriorCondition { get; set; } = "Ngoại thất sạch sẽ, không biến dạng kết cấu";
        public string InteriorCondition { get; set; } = "Nội thất sạch sẽ, da ghế nguyên vẹn, đầy đủ thảm sàn";
        public string TireCondition { get; set; } = "4 lốp áp suất tiêu chuẩn, gai lốp tốt, mâm không cấn lề";
        public string AccessoriesChecklist { get; set; } = "Giấy đăng ký xe (Cavet);Giấy chứng nhận đăng kiểm;Bảo hiểm TNDS;Chìa khóa thông minh;Kích lốp;Lốp dự phòng;Camera hành trình";
        public string? ExistingScratchesNotes { get; set; }
        public string? DamagePointsJson { get; set; }
        public string? EvidencePhotoUrls { get; set; }
        public string? StaffNotes { get; set; }
        public string? StaffSignature { get; set; }
        public string? CustomerSignature { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateHandoverProtocolDto
    {
        public int? DispatchOdo { get; set; }
        public int? HandoverOdo { get; set; }
        public decimal? DispatchFuelLevel { get; set; }
        public decimal? HandoverFuelLevel { get; set; }
        public string? HandoverDashPhotoUrl { get; set; }
        public string? TransitAnomalyNote { get; set; }
        public string? DispatchDamageMap { get; set; }
        public string? HandoverDamageMap { get; set; }

        public int OdoAtHandover { get; set; }
        public string FuelLevel { get; set; } = "100%";
        public string ExteriorCondition { get; set; } = null!;
        public string InteriorCondition { get; set; } = null!;
        public string TireCondition { get; set; } = null!;
        public string AccessoriesChecklist { get; set; } = null!;
        public string? ExistingScratchesNotes { get; set; }
        public string? DamagePointsJson { get; set; }
        public string? EvidencePhotoUrls { get; set; }
        public string? StaffNotes { get; set; }
        public string? StaffSignature { get; set; }
        public string? CustomerSignature { get; set; }
        public string Status { get; set; } = "IN_TRANSIT";
    }
}
