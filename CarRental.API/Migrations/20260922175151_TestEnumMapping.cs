using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRental.API.Migrations
{
    /// <inheritdoc />
    public partial class TestEnumMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Vehicles",
                table: "Vehicles");

            migrationBuilder.RenameTable(
                name: "Vehicles",
                newName: "cars");

            migrationBuilder.RenameColumn(
                name: "Transmission",
                table: "cars",
                newName: "transmission");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "cars",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Seats",
                table: "cars",
                newName: "seats");

            migrationBuilder.RenameColumn(
                name: "Model",
                table: "cars",
                newName: "model");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "cars",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "cars",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "PickupLocation",
                table: "cars",
                newName: "pickup_location");

            migrationBuilder.RenameColumn(
                name: "NextMaintenanceMileage",
                table: "cars",
                newName: "next_maintenance_mileage");

            migrationBuilder.RenameColumn(
                name: "NextMaintenanceDate",
                table: "cars",
                newName: "next_maintenance_date");

            migrationBuilder.RenameColumn(
                name: "MileageLimit",
                table: "cars",
                newName: "included_km_per_day");

            migrationBuilder.RenameColumn(
                name: "ManufactureYear",
                table: "cars",
                newName: "manufacture_year");

            migrationBuilder.RenameColumn(
                name: "Make",
                table: "cars",
                newName: "brand");

            migrationBuilder.RenameColumn(
                name: "LicensePlate",
                table: "cars",
                newName: "license_plate");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "cars",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "cars",
                newName: "image_url");

            migrationBuilder.RenameColumn(
                name: "FuelType",
                table: "cars",
                newName: "fuel_type");

            migrationBuilder.RenameColumn(
                name: "DepositAmount",
                table: "cars",
                newName: "deposit_amount");

            migrationBuilder.RenameColumn(
                name: "DailyRate",
                table: "cars",
                newName: "base_price");

            migrationBuilder.RenameColumn(
                name: "CurrentMileage",
                table: "cars",
                newName: "current_mileage");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "cars",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Vehicles_LicensePlate",
                table: "cars",
                newName: "IX_cars_license_plate");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:car_status.VehicleStatus", "READY,BOOKED,RENTED,INSPECTION,MAINTENANCE,REPAIR,INACTIVE")
                .Annotation("Npgsql:Enum:car_transmission.TransmissionType", "AUTO,MANUAL")
                .Annotation("Npgsql:Enum:fuel_type.FuelType", "PETROL,DIESEL,ELECTRIC");

            migrationBuilder.Sql("ALTER TABLE cars ALTER COLUMN transmission TYPE car_transmission.\"TransmissionType\" USING 'AUTO'::car_transmission.\"TransmissionType\";");
            migrationBuilder.Sql("ALTER TABLE cars ALTER COLUMN status TYPE car_status.\"VehicleStatus\" USING 'READY'::car_status.\"VehicleStatus\";");
            migrationBuilder.Sql("ALTER TABLE cars ALTER COLUMN fuel_type TYPE fuel_type.\"FuelType\" USING 'PETROL'::fuel_type.\"FuelType\";");

            migrationBuilder.AddColumn<decimal>(
                name: "extra_km_rate",
                table: "cars",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "fuel_return_policy",
                table: "cars",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_cars",
                table: "cars",
                column: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_cars",
                table: "cars");

            migrationBuilder.DropColumn(
                name: "extra_km_rate",
                table: "cars");

            migrationBuilder.DropColumn(
                name: "fuel_return_policy",
                table: "cars");

            migrationBuilder.RenameTable(
                name: "cars",
                newName: "Vehicles");

            migrationBuilder.RenameColumn(
                name: "transmission",
                table: "Vehicles",
                newName: "Transmission");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Vehicles",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "seats",
                table: "Vehicles",
                newName: "Seats");

            migrationBuilder.RenameColumn(
                name: "model",
                table: "Vehicles",
                newName: "Model");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Vehicles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Vehicles",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "pickup_location",
                table: "Vehicles",
                newName: "PickupLocation");

            migrationBuilder.RenameColumn(
                name: "next_maintenance_mileage",
                table: "Vehicles",
                newName: "NextMaintenanceMileage");

            migrationBuilder.RenameColumn(
                name: "next_maintenance_date",
                table: "Vehicles",
                newName: "NextMaintenanceDate");

            migrationBuilder.RenameColumn(
                name: "manufacture_year",
                table: "Vehicles",
                newName: "ManufactureYear");

            migrationBuilder.RenameColumn(
                name: "license_plate",
                table: "Vehicles",
                newName: "LicensePlate");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "Vehicles",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "included_km_per_day",
                table: "Vehicles",
                newName: "MileageLimit");

            migrationBuilder.RenameColumn(
                name: "image_url",
                table: "Vehicles",
                newName: "ImageUrl");

            migrationBuilder.RenameColumn(
                name: "fuel_type",
                table: "Vehicles",
                newName: "FuelType");

            migrationBuilder.RenameColumn(
                name: "deposit_amount",
                table: "Vehicles",
                newName: "DepositAmount");

            migrationBuilder.RenameColumn(
                name: "current_mileage",
                table: "Vehicles",
                newName: "CurrentMileage");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Vehicles",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "brand",
                table: "Vehicles",
                newName: "Make");

            migrationBuilder.RenameColumn(
                name: "base_price",
                table: "Vehicles",
                newName: "DailyRate");

            migrationBuilder.RenameIndex(
                name: "IX_cars_license_plate",
                table: "Vehicles",
                newName: "IX_Vehicles_LicensePlate");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:Enum:car_status.VehicleStatus", "READY,BOOKED,RENTED,INSPECTION,MAINTENANCE,REPAIR,INACTIVE")
                .OldAnnotation("Npgsql:Enum:car_transmission.TransmissionType", "AUTO,MANUAL")
                .OldAnnotation("Npgsql:Enum:fuel_type.FuelType", "PETROL,DIESEL,ELECTRIC");

            migrationBuilder.AlterColumn<string>(
                name: "Transmission",
                table: "Vehicles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "car_transmission");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Vehicles",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "car_status");

            migrationBuilder.AlterColumn<int>(
                name: "FuelType",
                table: "Vehicles",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "fuel_type");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Vehicles",
                table: "Vehicles",
                column: "Id");
        }
    }
}
