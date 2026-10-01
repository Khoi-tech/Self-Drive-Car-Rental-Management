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

    public enum ContractStatus
    {
        WAITING_SIGNATURE,
        SIGNED,
        DEPOSIT_PAID,
        ACTIVE,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    public enum PaymentType
    {
        DEPOSIT,
        SETTLEMENT,
        REFUND
    }

    public enum PaymentStatus
    {
        PENDING,
        SUCCESS,
        FAILED
    }
}
