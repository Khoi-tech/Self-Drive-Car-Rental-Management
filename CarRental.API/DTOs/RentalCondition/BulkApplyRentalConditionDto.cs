using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.RentalCondition
{
    public class BulkApplyRentalConditionDto
    {
        [Required(ErrorMessage = "Vui lòng chọn ít nhất 1 xe để áp dụng.")]
        public List<Guid> VehicleIds { get; set; } = new List<Guid>();

        [Range(18, 100, ErrorMessage = "Tuổi tối thiểu phải từ 18 đến 100")]
        public int? MinAge { get; set; } = 21;

        [Range(0, 50, ErrorMessage = "Kinh nghiệm lái xe không được âm")]
        public int? MinDrivingYears { get; set; }

        [Range(0, 50, ErrorMessage = "Kinh nghiệm lái xe không được âm")]
        public int? RequireDrivingYears { get; set; }

        [MaxLength(20)]
        public string RequiredLicenseClass { get; set; } = "B1";

        [Range(0, 1000, ErrorMessage = "Số chuyến hoàn tất tối thiểu không được âm")]
        public int MinCompletedTrips { get; set; } = 0;

        public bool RequireVerifiedKyc { get; set; } = false;

        public string? OtherNotes { get; set; }
        public string? OtherConditions { get; set; }
    }
}
