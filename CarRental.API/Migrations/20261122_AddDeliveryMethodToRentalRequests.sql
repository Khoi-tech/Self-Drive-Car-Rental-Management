-- Safe idempotent migration: Add delivery_method to rental_requests
-- Preserves 100% of existing data with default 'SELF_PICKUP'

ALTER TABLE rental_requests
    ADD COLUMN IF NOT EXISTS delivery_method character varying(30) NOT NULL DEFAULT 'SELF_PICKUP';

ALTER TABLE rental_requests
    ADD COLUMN IF NOT EXISTS estimated_delivery_distance_km numeric(8,2) NULL;
