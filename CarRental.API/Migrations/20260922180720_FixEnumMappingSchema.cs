using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRental.API.Migrations
{
    /// <inheritdoc />
    public partial class FixEnumMappingSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:public.car_status", "READY,BOOKED,RENTED,INSPECTION,MAINTENANCE,REPAIR,INACTIVE")
                .Annotation("Npgsql:Enum:public.car_transmission", "AUTO,MANUAL")
                .Annotation("Npgsql:Enum:public.fuel_type", "PETROL,DIESEL,ELECTRIC");

            migrationBuilder.Sql("ALTER TABLE cars ALTER COLUMN transmission TYPE public.car_transmission USING transmission::text::public.car_transmission;");
            migrationBuilder.Sql("ALTER TABLE cars ALTER COLUMN status TYPE public.car_status USING status::text::public.car_status;");
            migrationBuilder.Sql("ALTER TABLE cars ALTER COLUMN fuel_type TYPE public.fuel_type USING fuel_type::text::public.fuel_type;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:car_status.VehicleStatus", "READY,BOOKED,RENTED,INSPECTION,MAINTENANCE,REPAIR,INACTIVE")
                .Annotation("Npgsql:Enum:car_transmission.TransmissionType", "AUTO,MANUAL")
                .Annotation("Npgsql:Enum:fuel_type.FuelType", "PETROL,DIESEL,ELECTRIC")
                .OldAnnotation("Npgsql:Enum:public.car_status", "READY,BOOKED,RENTED,INSPECTION,MAINTENANCE,REPAIR,INACTIVE")
                .OldAnnotation("Npgsql:Enum:public.car_transmission", "AUTO,MANUAL")
                .OldAnnotation("Npgsql:Enum:public.fuel_type", "PETROL,DIESEL,ELECTRIC");

            migrationBuilder.AlterColumn<int>(
                name: "transmission",
                table: "cars",
                type: "car_transmission",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "public.car_transmission");

            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "cars",
                type: "car_status",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "public.car_status");

            migrationBuilder.AlterColumn<int>(
                name: "fuel_type",
                table: "cars",
                type: "fuel_type",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "public.fuel_type");
        }
    }
}
