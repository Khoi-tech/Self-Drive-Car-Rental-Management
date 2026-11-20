using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRental.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemSettingsAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_incident_reports_cars_car_id",
                table: "incident_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_incident_reports_rental_requests_rental_request_id",
                table: "incident_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_maintenance_records_cars_car_id",
                table: "maintenance_records");

            migrationBuilder.DropForeignKey(
                name: "FK_rental_extensions_rental_requests_rental_request_id",
                table: "rental_extensions");

            migrationBuilder.DropIndex(
                name: "IX_rental_requests_car_id",
                table: "rental_requests");

            migrationBuilder.DropIndex(
                name: "IX_payments_rental_request_id",
                table: "payments");

            migrationBuilder.RenameIndex(
                name: "IX_rental_contracts_request_id",
                table: "rental_contracts",
                newName: "ix_rental_contracts_request_id");

            migrationBuilder.AddColumn<string>(
                name: "booking_type",
                table: "rental_requests",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "deposit_method",
                table: "rental_requests",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "driver_license_class",
                table: "rental_requests",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "driver_license_expiry",
                table: "rental_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "hold_deposit_amount",
                table: "rental_requests",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "hold_expires_at",
                table: "rental_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_security_deposit_paid",
                table: "rental_requests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "customer_signature",
                table: "handover_protocols",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "damage_points_json",
                table: "handover_protocols",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "driver_license_back_url",
                table: "app_users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "driver_license_class",
                table: "app_users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "driver_license_expiry",
                table: "app_users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "driver_license_front_url",
                table: "app_users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "driver_license_number",
                table: "app_users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "id_card_back_url",
                table: "app_users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "id_card_front_url",
                table: "app_users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "id_card_number",
                table: "app_users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "kyc_note",
                table: "app_users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "kyc_reviewed_at",
                table: "app_users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "kyc_status",
                table: "app_users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "lock_reason",
                table: "app_users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "trust_score",
                table: "app_users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<Guid>(
                name: "rental_request_id",
                table: "additional_drivers",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<string>(
                name: "license_number",
                table: "additional_drivers",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "id_card_number",
                table: "additional_drivers",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "additional_drivers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "date_of_birth",
                table: "additional_drivers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "license_class",
                table: "additional_drivers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "license_expiry",
                table: "additional_drivers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "relationship",
                table: "additional_drivers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "additional_drivers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "additional_drivers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "customer_violations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    points_change = table.Column<int>(type: "integer", nullable: false),
                    reason = table.Column<string>(type: "text", nullable: false),
                    officer = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_violations", x => x.id);
                    table.ForeignKey(
                        name: "FK_customer_violations_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reference_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    action_url = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_notifications_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    replaced_by_token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_app_users_user_id",
                        column: x => x.user_id,
                        principalTable: "app_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "return_protocols",
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
                    return_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    start_km = table.Column<int>(type: "integer", nullable: false),
                    end_km = table.Column<int>(type: "integer", nullable: false),
                    total_km_driven = table.Column<int>(type: "integer", nullable: false),
                    max_km_allowed = table.Column<int>(type: "integer", nullable: true),
                    excess_km = table.Column<int>(type: "integer", nullable: false),
                    initial_fuel_level = table.Column<int>(type: "integer", nullable: false),
                    fuel_level = table.Column<int>(type: "integer", nullable: false),
                    fuel_difference = table.Column<int>(type: "integer", nullable: false),
                    exterior_condition = table.Column<string>(type: "text", nullable: true),
                    interior_condition = table.Column<string>(type: "text", nullable: true),
                    tire_condition = table.Column<string>(type: "text", nullable: true),
                    new_damages_notes = table.Column<string>(type: "text", nullable: true),
                    damage_points_json = table.Column<string>(type: "text", nullable: true),
                    accessories_checklist = table.Column<string>(type: "text", nullable: true),
                    missing_accessories = table.Column<string>(type: "text", nullable: true),
                    evidence_photo_urls = table.Column<string>(type: "text", nullable: true),
                    staff_notes = table.Column<string>(type: "text", nullable: true),
                    staff_signature = table.Column<string>(type: "text", nullable: true),
                    customer_signature = table.Column<string>(type: "text", nullable: true),
                    next_vehicle_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_return_protocols", x => x.id);
                    table.ForeignKey(
                        name: "FK_return_protocols_rental_contracts_contract_id",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_return_protocols_rental_requests_rental_request_id",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "system_settings",
                columns: table => new
                {
                    key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    value = table.Column<string>(type: "text", nullable: false),
                    data_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_settings", x => x.key);
                });

            migrationBuilder.CreateTable(
                name: "rental_settlements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    settlement_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    rental_request_id = table.Column<Guid>(type: "uuid", nullable: true),
                    contract_id = table.Column<Guid>(type: "uuid", nullable: true),
                    return_protocol_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rental_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    extra_km_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    late_hours = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    late_return_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    fuel_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    damage_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    cleaning_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    other_fee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    other_fee_notes = table.Column<string>(type: "text", nullable: true),
                    total_deduction = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    balance_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    settlement_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    refund_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    traffic_fine_hold_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    traffic_fine_refund_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    traffic_fine_refund_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    traffic_fine_actual_deduction = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    traffic_fine_actual_refund = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    traffic_fine_refunded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    traffic_fine_transaction_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    traffic_fine_notes = table.Column<string>(type: "text", nullable: true),
                    traffic_fine_violation_proof_url = table.Column<string>(type: "text", nullable: true),
                    additional_amount_due = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    refund_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    refund_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    refund_bank_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    refund_account_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    refund_account_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    refund_transaction_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    refund_proof_url = table.Column<string>(type: "text", nullable: true),
                    refunded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    staff_notes = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    settled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_settlements", x => x.id);
                    table.ForeignKey(
                        name: "FK_rental_settlements_rental_contracts_contract_id",
                        column: x => x.contract_id,
                        principalTable: "rental_contracts",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_rental_settlements_rental_requests_rental_request_id",
                        column: x => x.rental_request_id,
                        principalTable: "rental_requests",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "FK_rental_settlements_return_protocols_return_protocol_id",
                        column: x => x.return_protocol_id,
                        principalTable: "return_protocols",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_rental_requests_car_id_status_start_end",
                table: "rental_requests",
                columns: new[] { "car_id", "status", "start_time", "end_time" });

            migrationBuilder.CreateIndex(
                name: "ix_rental_requests_customer_email_created_at",
                table: "rental_requests",
                columns: new[] { "customer_email", "created_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_payments_rental_request_id_type_status",
                table: "payments",
                columns: new[] { "rental_request_id", "type", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_payments_transaction_code_unique",
                table: "payments",
                column: "transaction_code",
                unique: true,
                filter: "transaction_code IS NOT NULL AND transaction_code <> ''");

            migrationBuilder.CreateIndex(
                name: "ix_car_insurances_end_date",
                table: "car_insurances",
                column: "end_date");

            migrationBuilder.CreateIndex(
                name: "IX_additional_drivers_user_id",
                table: "additional_drivers",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_customer_violations_user_id",
                table: "customer_violations",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_user_id_is_read_created_at",
                table: "notifications",
                columns: new[] { "user_id", "is_read", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_user_id",
                table: "refresh_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_settlements_contract_id",
                table: "rental_settlements",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_settlements_rental_request_id",
                table: "rental_settlements",
                column: "rental_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_rental_settlements_return_protocol_id",
                table: "rental_settlements",
                column: "return_protocol_id");

            migrationBuilder.CreateIndex(
                name: "IX_return_protocols_contract_id",
                table: "return_protocols",
                column: "contract_id");

            migrationBuilder.CreateIndex(
                name: "IX_return_protocols_rental_request_id",
                table: "return_protocols",
                column: "rental_request_id");

            migrationBuilder.AddForeignKey(
                name: "FK_additional_drivers_app_users_user_id",
                table: "additional_drivers",
                column: "user_id",
                principalTable: "app_users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_incident_reports_cars_car_id",
                table: "incident_reports",
                column: "car_id",
                principalTable: "cars",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_incident_reports_rental_requests_rental_request_id",
                table: "incident_reports",
                column: "rental_request_id",
                principalTable: "rental_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_maintenance_records_cars_car_id",
                table: "maintenance_records",
                column: "car_id",
                principalTable: "cars",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_rental_extensions_rental_requests_rental_request_id",
                table: "rental_extensions",
                column: "rental_request_id",
                principalTable: "rental_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_additional_drivers_app_users_user_id",
                table: "additional_drivers");

            migrationBuilder.DropForeignKey(
                name: "FK_incident_reports_cars_car_id",
                table: "incident_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_incident_reports_rental_requests_rental_request_id",
                table: "incident_reports");

            migrationBuilder.DropForeignKey(
                name: "FK_maintenance_records_cars_car_id",
                table: "maintenance_records");

            migrationBuilder.DropForeignKey(
                name: "FK_rental_extensions_rental_requests_rental_request_id",
                table: "rental_extensions");

            migrationBuilder.DropTable(
                name: "customer_violations");

            migrationBuilder.DropTable(
                name: "notifications");

            migrationBuilder.DropTable(
                name: "refresh_tokens");

            migrationBuilder.DropTable(
                name: "rental_settlements");

            migrationBuilder.DropTable(
                name: "system_settings");

            migrationBuilder.DropTable(
                name: "return_protocols");

            migrationBuilder.DropIndex(
                name: "ix_rental_requests_car_id_status_start_end",
                table: "rental_requests");

            migrationBuilder.DropIndex(
                name: "ix_rental_requests_customer_email_created_at",
                table: "rental_requests");

            migrationBuilder.DropIndex(
                name: "ix_payments_rental_request_id_type_status",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "ix_payments_transaction_code_unique",
                table: "payments");

            migrationBuilder.DropIndex(
                name: "ix_car_insurances_end_date",
                table: "car_insurances");

            migrationBuilder.DropIndex(
                name: "IX_additional_drivers_user_id",
                table: "additional_drivers");

            migrationBuilder.DropColumn(
                name: "booking_type",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "deposit_method",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "driver_license_class",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "driver_license_expiry",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "hold_deposit_amount",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "hold_expires_at",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "is_security_deposit_paid",
                table: "rental_requests");

            migrationBuilder.DropColumn(
                name: "customer_signature",
                table: "handover_protocols");

            migrationBuilder.DropColumn(
                name: "damage_points_json",
                table: "handover_protocols");

            migrationBuilder.DropColumn(
                name: "driver_license_back_url",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "driver_license_class",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "driver_license_expiry",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "driver_license_front_url",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "driver_license_number",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "id_card_back_url",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "id_card_front_url",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "id_card_number",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "kyc_note",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "kyc_reviewed_at",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "kyc_status",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "lock_reason",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "trust_score",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "additional_drivers");

            migrationBuilder.DropColumn(
                name: "date_of_birth",
                table: "additional_drivers");

            migrationBuilder.DropColumn(
                name: "license_class",
                table: "additional_drivers");

            migrationBuilder.DropColumn(
                name: "license_expiry",
                table: "additional_drivers");

            migrationBuilder.DropColumn(
                name: "relationship",
                table: "additional_drivers");

            migrationBuilder.DropColumn(
                name: "status",
                table: "additional_drivers");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "additional_drivers");

            migrationBuilder.RenameIndex(
                name: "ix_rental_contracts_request_id",
                table: "rental_contracts",
                newName: "IX_rental_contracts_request_id");

            migrationBuilder.AlterColumn<Guid>(
                name: "rental_request_id",
                table: "additional_drivers",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "license_number",
                table: "additional_drivers",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "id_card_number",
                table: "additional_drivers",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_rental_requests_car_id",
                table: "rental_requests",
                column: "car_id");

            migrationBuilder.CreateIndex(
                name: "IX_payments_rental_request_id",
                table: "payments",
                column: "rental_request_id");

            migrationBuilder.AddForeignKey(
                name: "FK_incident_reports_cars_car_id",
                table: "incident_reports",
                column: "car_id",
                principalTable: "cars",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_incident_reports_rental_requests_rental_request_id",
                table: "incident_reports",
                column: "rental_request_id",
                principalTable: "rental_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_maintenance_records_cars_car_id",
                table: "maintenance_records",
                column: "car_id",
                principalTable: "cars",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_rental_extensions_rental_requests_rental_request_id",
                table: "rental_extensions",
                column: "rental_request_id",
                principalTable: "rental_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
