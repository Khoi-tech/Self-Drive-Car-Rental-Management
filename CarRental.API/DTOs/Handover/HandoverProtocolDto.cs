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
        public int OdoAtHandover { get; set; }
        public string FuelLevel { get; set; } = "100%";
        public string ExteriorCondition { get; set; } = null!;
        public string InteriorCondition { get; set; } = null!;
        public string TireCondition { get; set; } = null!;
        public string AccessoriesChecklist { get; set; } = null!;
        public string? ExistingScratchesNotes { get; set; }
        public string? EvidencePhotoUrls { get; set; }
        public string? StaffNotes { get; set; }
        public string? StaffSignature { get; set; }
        public string Status { get; set; } = "PENDING_CUSTOMER";
        public DateTime? CreatedAt { get; set; }
    }

    public class CreateHandoverProtocolDto
    {
        public Guid RentalRequestId { get; set; }
        public string? StaffName { get; set; }
        public int OdoAtHandover { get; set; }
        public string FuelLevel { get; set; } = "100%";
        public string ExteriorCondition { get; set; } = "Ngoại thất sạch sẽ, không biến dạng kết cấu";
        public string InteriorCondition { get; set; } = "Nội thất sạch sẽ, da ghế nguyên vẹn, đầy đủ thảm sàn";
        public string TireCondition { get; set; } = "4 lốp áp suất tiêu chuẩn, gai lốp tốt, mâm không cấn lề";
        public string AccessoriesChecklist { get; set; } = "Giấy đăng ký xe (Cavet);Giấy chứng nhận đăng kiểm;Bảo hiểm TNDS;Chìa khóa thông minh;Kích lốp;Lốp dự phòng;Camera hành trình";
        public string? ExistingScratchesNotes { get; set; }
        public string? EvidencePhotoUrls { get; set; }
        public string? StaffNotes { get; set; }
        public string? StaffSignature { get; set; }
    }

    public class UpdateHandoverProtocolDto
    {
        public int OdoAtHandover { get; set; }
        public string FuelLevel { get; set; } = "100%";
        public string ExteriorCondition { get; set; } = null!;
        public string InteriorCondition { get; set; } = null!;
        public string TireCondition { get; set; } = null!;
        public string AccessoriesChecklist { get; set; } = null!;
        public string? ExistingScratchesNotes { get; set; }
        public string? EvidencePhotoUrls { get; set; }
        public string? StaffNotes { get; set; }
        public string? StaffSignature { get; set; }
        public string Status { get; set; } = "PENDING_CUSTOMER";
    }
}
