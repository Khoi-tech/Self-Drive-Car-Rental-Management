using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRental.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRentalRequestsAndDrivers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "rental_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    car_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_name = table.Column<string>(type: "text", nullable: false),
                    customer_phone = table.Column<string>(type: "text", nullable: false),
                    customer_email = table.Column<string>(type: "text", nullable: false),
                    customer_id_card = table.Column<string>(type: "text", nullable: false),
                    id_card_front_url = table.Column<string>(type: "text", nullable: true),
                    id_card_back_url = table.Column<string>(type: "text", nullable: true),
                    driver_license_number = table.Column<string>(type: "text", nullable: false),
                    driver_license_front_url = table.Column<string>(type: "text", nullable: true),
                    driver_license_back_url = table.Column<string>(type: "text", nullable: true),
                    start_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    pickup_location = table.Column<string>(type: "text", nullable: false),
                    dropoff_location = table.Column<string>(type: "text", nullable: false),
                    total_days = table.Column<int>(type: "integer", nullable: false),
                    daily_rate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    discount_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    holiday_surcharge_percent = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    estimated_total_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    reject_reason = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_rental_requests_cars_car_id",
                        column: x => x.car_id,
                        principalTable: "cars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "additional_drivers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    rental_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    phone_number = table.Column<string>(type: "text", nullable: false),
                    id_card_number = table.Column<string>(type: "text", nullable: false),
                    license_number = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_additional_drivers", x => x.id);
                    table.ForeignKey(
                        name: "FK_additional_drivers_rental_requests_rental_request_id",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_additional_drivers_rental_request_id",
                table: "additional_drivers",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_requests_car_id",
                table: "rental_requests",
                column: "car_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "additional_drivers");

            migrationBuilder.DropTable(
                name: "rental_requests");
        }
    }
}
