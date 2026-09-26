using System;
using System.ComponentModel.DataAnnotations;

namespace CarRental.API.DTOs.RentalCondition
{
    public class UpdateRentalConditionDto
    {
        [Range(18, int.MaxValue, ErrorMessage = "Tuổi tối thiểu phải lớn hơn hoặc bằng 18")]
        public int? MinAge { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Kinh nghiệm lái xe không được âm")]
        public int? RequireDrivingYears { get; set; }

        public string? OtherConditions { get; set; }
    }
}
