using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.RentalCondition
{
    public class CreateRentalConditionDto
    {
        [Range(18, 100, ErrorMessage = "Tuổi tối thiểu phải từ 18 đến 100")]
        public int? MinAge { get; set; } = 21;

        [Range(0, 50, ErrorMessage = "Kinh nghiệm lái xe không được âm")]
        public int? RequireDrivingYears { get; set; } = 1;

        [MaxLength(20)]
        public string RequiredLicenseClass { get; set; } = "B1";

        [Range(0, 1000, ErrorMessage = "Số chuyến hoàn tất tối thiểu không được âm")]
        public int MinCompletedTrips { get; set; } = 0;

        public bool RequireVerifiedKyc { get; set; } = false;

        public string? OtherConditions { get; set; }
    }
}
