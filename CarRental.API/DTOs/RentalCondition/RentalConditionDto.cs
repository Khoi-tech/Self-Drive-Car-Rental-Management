using System;

namespace CarRental.API.DTOs.RentalCondition
{
    public class RentalConditionDto
    {
        public Guid Id { get; set; }
        public Guid? CarId { get; set; }
        public int? MinAge { get; set; }
        public int? RequireDrivingYears { get; set; }
        public string RequiredLicenseClass { get; set; } = "B1";
        public int MinCompletedTrips { get; set; } = 0;
        public bool RequireVerifiedKyc { get; set; } = false;
        public string? OtherConditions { get; set; }
        public bool IsCustom { get; set; } = true;
    }
}
