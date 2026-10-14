import psycopg2

conn_str = "Host=aws-1-eu-west-1.pooler.supabase.com;Port=5432;Database=postgres;User=postgres.uhgvqpexkkbwejdqpjit;Password=Huynhkhoi1501"
conn = psycopg2.connect(conn_str)
cur = conn.cursor()

ddl = """
CREATE TABLE IF NOT EXISTS return_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_number VARCHAR(50),
    rental_request_id UUID REFERENCES rental_requests(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES rental_contracts(id) ON DELETE SET NULL,
    staff_id UUID,
    staff_name VARCHAR(100) DEFAULT 'Nhân viên kiểm định VELORA',
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    return_date TIMESTAMPTZ DEFAULT NOW(),
    start_odo INT NOT NULL DEFAULT 0,
    end_odo INT NOT NULL DEFAULT 0,
    total_km_driven INT NOT NULL DEFAULT 0,
    max_km_allowed INT,
    excess_km INT NOT NULL DEFAULT 0,
    initial_fuel_level INT NOT NULL DEFAULT 100,
    return_fuel_level INT NOT NULL DEFAULT 100,
    fuel_difference INT NOT NULL DEFAULT 0,
    exterior_condition TEXT,
    interior_condition TEXT,
    tire_condition TEXT,
    new_damages_notes TEXT,
    accessories_checklist TEXT,
    missing_accessories TEXT,
    evidence_photo_urls TEXT,
    staff_notes TEXT,
    staff_signature TEXT,
    customer_signature TEXT,
    next_vehicle_status VARCHAR(50) DEFAULT 'READY',
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rental_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_number VARCHAR(50),
    rental_request_id UUID REFERENCES rental_requests(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES rental_contracts(id) ON DELETE SET NULL,
    return_protocol_id UUID REFERENCES return_protocols(id) ON DELETE SET NULL,
    rental_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    deposit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    extra_km_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    late_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    late_return_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    fuel_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    damage_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    cleaning_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    other_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    other_fee_notes TEXT,
    total_deduction DECIMAL(18,2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    settlement_type VARCHAR(50) DEFAULT 'REFUND_TO_CUSTOMER',
    refund_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    additional_amount_due DECIMAL(18,2) NOT NULL DEFAULT 0,
    refund_status VARCHAR(50) DEFAULT 'PENDING',
    refund_method VARCHAR(50) DEFAULT 'VIETQR',
    refund_bank_name VARCHAR(100),
    refund_account_number VARCHAR(50),
    refund_account_name VARCHAR(100),
    refund_transaction_code VARCHAR(100),
    refund_proof_url TEXT,
    refunded_at TIMESTAMPTZ,
    staff_notes TEXT,
    status VARCHAR(50) DEFAULT 'SETTLED',
    settled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
"""

cur.execute(ddl)
conn.commit()
print("SUCCESS: Tables return_protocols and rental_settlements created or already exist.")
cur.close()
conn.close()
