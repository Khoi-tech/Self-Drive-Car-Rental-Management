using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRental.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOperationalAndSprintTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "car_insurances",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    car_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    start_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    insurance_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    policy_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    coverage_summary = table.Column<string>(type: "text", nullable: true),
                    deductible_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    premium_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    certificate_image_url = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_car_insurances", x => x.id);
                    table.ForeignKey(
                        name: "FK_car_insurances_cars_car_id",
                        column: x => x.car_id,
                        principalTable: "cars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "handover_protocols",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    protocol_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    rental_request_id = table.Column<Guid>(type: "uuid", nullable: true),
                    contract_id = table.Column<Guid>(type: "uuid", nullable: true),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: true),
                    staff_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    customer_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    customer_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    start_km = table.Column<int>(type: "integer", nullable: false),
                    fuel_level = table.Column<int>(type: "integer", nullable: false),
                    damages_desc = table.Column<string>(type: "text", nullable: true),
                    images = table.Column<string>(type: "text", nullable: true),
                    exterior_condition = table.Column<string>(type: "text", nullable: true),
                    interior_condition = table.Column<string>(type: "text", nullable: true),
                    tire_condition = table.Column<string>(type: "text", nullable: true),
                    accessories_checklist = table.Column<string>(type: "text", nullable: true),
                    staff_notes = table.Column<string>(type: "text", nullable: true),
                    staff_signature = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    handover_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_handover_protocols", x => x.id);
                    table.ForeignKey(
                        name: "FK_handover_protocols_rental_contracts_contract_id",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_handover_protocols_rental_requests_rental_request_id",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "incident_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    incident_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    rental_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    car_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    customer_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    customer_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    incident_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    location = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    photo_urls = table.Column<string>(type: "text", nullable: true),
                    has_injuries = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    resolution_action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    replacement_car_id = table.Column<Guid>(type: "uuid", nullable: true),
                    estimated_damage_cost = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    insurance_coverage_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    customer_pay_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    company_pay_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    staff_notes = table.Column<string>(type: "text", nullable: true),
                    handled_by_staff_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_incident_reports", x => x.id);
                    table.ForeignKey(
                        name: "FK_incident_reports_cars_car_id",
                        column: x => x.car_id,
                        principalTable: "cars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_incident_reports_cars_replacement_car_id",
                        column: x => x.replacement_car_id,
                        principalTable: "cars",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_incident_reports_rental_requests_rental_request_id",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "maintenance_records",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    maintenance_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    car_id = table.Column<Guid>(type: "uuid", nullable: false),
                    maintenance_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    garage_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    cost = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    odo_at_maintenance = table.Column<int>(type: "integer", nullable: false),
                    scheduled_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    details = table.Column<string>(type: "text", nullable: true),
                    next_maintenance_mileage = table.Column<int>(type: "integer", nullable: true),
                    next_maintenance_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maintenance_records", x => x.id);
                    table.ForeignKey(
                        name: "FK_maintenance_records_cars_car_id",
                        column: x => x.car_id,
                        principalTable: "cars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "rental_extensions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    rental_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    old_end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    new_end_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    extended_days = table.Column<int>(type: "integer", nullable: false),
                    extended_hours = table.Column<int>(type: "integer", nullable: false),
                    additional_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    staff_notes = table.Column<string>(type: "text", nullable: true),
                    processed_by_staff_id = table.Column<Guid>(type: "uuid", nullable: true),
                    processed_by_staff_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_extensions", x => x.id);
                    table.ForeignKey(
                        name: "FK_rental_extensions_rental_requests_rental_request_id",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_car_insurances_car_id",
                table: "car_insurances",
                column: "car_id");

            migrationBuilder.CreateIndex(
                name: "IX_handover_protocols_contract_id",
                table: "handover_protocols",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_handover_protocols_rental_request_id",
                table: "handover_protocols",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_incident_reports_car_id",
                table: "incident_reports",
                column: "car_id");

            migrationBuilder.CreateIndex(
                name: "IX_incident_reports_rental_request_id",
                table: "incident_reports",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_incident_reports_replacement_car_id",
                table: "incident_reports",
                column: "replacement_car_id");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_records_car_id",
                table: "maintenance_records",
                column: "car_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_extensions_rental_request_id",
                table: "rental_extensions",
                column: "rental_request_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "car_insurances");

            migrationBuilder.DropTable(
                name: "handover_protocols");

            migrationBuilder.DropTable(
                name: "incident_reports");

            migrationBuilder.DropTable(
                name: "maintenance_records");

            migrationBuilder.DropTable(
                name: "rental_extensions");
        }
    }
}
