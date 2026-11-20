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
        PENDING_SIGNATURE = WAITING_SIGNATURE,
        SIGNED,
        DEPOSIT_PAID,
        ACTIVE,
        COMPLETED,
        DISPUTED,
        VOID,
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

    public enum RentalRequestStatus
    {
        PENDING,
        PENDING_HOLD_PAYMENT,
        HOLD_CONFIRMED,
        APPROVED,
        CONFIRMED,
        ACTIVE,
        RETURNED,
        SETTLED,
        COMPLETED,
        CANCELLED,
        REJECTED
    }

    public enum HandoverStatus
    {
        IN_TRANSIT,
        COMPLETED
    }

    public enum DamageStage
    {
        PRE_EXISTING,
        TRANSIT_DELIVERY,
        CUSTOMER_RENTAL,
        TRANSIT_RETURN
    }

    public enum IncidentResponsibleParty
    {
        STAFF,
        CUSTOMER,
        THIRD_PARTY,
        FORCE_MAJEURE
    }

    public enum IncidentType
    {
        INTERNAL_TRANSIT,
        COLLISION,
        BREAKDOWN,
        WEATHER,
        THEFT_VANDALISM
    }
}
