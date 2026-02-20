-- Drop the separate customer_addresses table — address data lives directly on the customers table
-- (customers already has: address, division_id, thana_id, postal_code)

DROP TABLE IF EXISTS public.customer_addresses CASCADE;