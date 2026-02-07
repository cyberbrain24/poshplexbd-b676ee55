-- Add consignment_id column to orders table to store Steadfast parcel ID
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consignment_id text;