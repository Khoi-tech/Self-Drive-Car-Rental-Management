using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarRental.API.Migrations
{
    /// <inheritdoc />
    public partial class StandardizeDatabaseAndAuditSafety : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Enable PostgreSQL btree_gist extension for UUID + Range GiST indexing
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");

            // 2. Add PostgreSQL Exclusion Constraint on rental_requests to prevent double booking
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_rentals'
                    ) THEN
                        ALTER TABLE rental_requests
                        ADD CONSTRAINT no_overlapping_rentals
                        EXCLUDE USING gist (
                            car_id WITH =,
                            tstzrange(start_time, end_time, '[)') WITH &&
                        )
                        WHERE (status NOT IN ('CANCELLED', 'REJECTED'));
                    END IF;
                END $$;
            ");

            // 3. Drop existing ON DELETE CASCADE foreign keys on audit/financial tables and re-create with ON DELETE RESTRICT
            migrationBuilder.Sql(@"
                -- incident_reports -> cars
                ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS ""FK_incident_reports_cars_car_id"";
                ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS ""incident_reports_car_id_fkey"";
                ALTER TABLE incident_reports
                    ADD CONSTRAINT ""FK_incident_reports_cars_car_id""
                    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT;

                -- incident_reports -> rental_requests
                ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS ""FK_incident_reports_rental_requests_rental_request_id"";
                ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS ""incident_reports_rental_request_id_fkey"";
                ALTER TABLE incident_reports
                    ADD CONSTRAINT ""FK_incident_reports_rental_requests_rental_request_id""
                    FOREIGN KEY (rental_request_id) REFERENCES rental_requests(id) ON DELETE RESTRICT;

                -- maintenance_records -> cars
                ALTER TABLE maintenance_records DROP CONSTRAINT IF EXISTS ""FK_maintenance_records_cars_car_id"";
                ALTER TABLE maintenance_records DROP CONSTRAINT IF EXISTS ""maintenance_records_car_id_fkey"";
                ALTER TABLE maintenance_records
                    ADD CONSTRAINT ""FK_maintenance_records_cars_car_id""
                    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT;

                -- rental_extensions -> rental_requests
                ALTER TABLE rental_extensions DROP CONSTRAINT IF EXISTS ""FK_rental_extensions_rental_requests_rental_request_id"";
                ALTER TABLE rental_extensions DROP CONSTRAINT IF EXISTS ""rental_extensions_rental_request_id_fkey"";
                ALTER TABLE rental_extensions
                    ADD CONSTRAINT ""FK_rental_extensions_rental_requests_rental_request_id""
                    FOREIGN KEY (rental_request_id) REFERENCES rental_requests(id) ON DELETE RESTRICT;
            ");

            // 4. Create composite indexes for high-frequency queries
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ix_rental_requests_car_id_status_start_end
                    ON rental_requests (car_id, status, start_time, end_time);

                CREATE INDEX IF NOT EXISTS ix_rental_requests_customer_email_created_at
                    ON rental_requests (customer_email, created_at DESC);

                CREATE INDEX IF NOT EXISTS ix_rental_contracts_request_id
                    ON rental_contracts (request_id);

                CREATE UNIQUE INDEX IF NOT EXISTS ix_payments_transaction_code_unique
                    ON payments (transaction_code)
                    WHERE transaction_code IS NOT NULL AND transaction_code <> '';

                CREATE INDEX IF NOT EXISTS ix_payments_rental_request_id_type_status
                    ON payments (rental_request_id, type, status);

                CREATE INDEX IF NOT EXISTS ix_car_insurances_end_date
                    ON car_insurances (end_date);
            ");

            // 5. Clean up legacy unused tables
            migrationBuilder.Sql(@"
                DROP TABLE IF EXISTS contract_extensions CASCADE;
                DROP TABLE IF EXISTS customer_profiles CASCADE;
                DROP TABLE IF EXISTS settlements CASCADE;
                DROP TABLE IF EXISTS incidents CASCADE;
                DROP TABLE IF EXISTS users CASCADE;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE rental_requests DROP CONSTRAINT IF EXISTS no_overlapping_rentals;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_rental_requests_car_id_status_start_end;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_rental_requests_customer_email_created_at;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_rental_contracts_request_id;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_payments_transaction_code_unique;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_payments_rental_request_id_type_status;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_car_insurances_end_date;");
        }
    }
}
