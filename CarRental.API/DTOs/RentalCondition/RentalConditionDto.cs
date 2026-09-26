using System;

namespace CarRental.API.DTOs.RentalCondition
{
    public class RentalConditionDto
    {
        public Guid Id { get; set; }
        public Guid? CarId { get; set; }
        public int? MinAge { get; set; }
        public int? RequireDrivingYears { get; set; }
        public string? OtherConditions { get; set; }
    }
}
