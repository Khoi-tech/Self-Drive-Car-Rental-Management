namespace CarRental.API.Entities
{
    public enum VehicleStatus
    {
        READY,
        BOOKED,
        RENTED,
        INSPECTION,
        MAINTENANCE,
        REPAIR,
        INACTIVE
    }

    public enum FuelType
    {
        PETROL,
        DIESEL,
        ELECTRIC
    }

    public enum TransmissionType
    {
        AUTO,
        MANUAL
    }
}
