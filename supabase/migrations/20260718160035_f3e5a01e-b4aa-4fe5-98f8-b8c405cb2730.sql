
-- Remove Accounts, Media Metadata, and Music modules

-- Drop dependent columns on orders / inventory_entries
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS collected_amount,
  DROP COLUMN IF EXISTS amount_approved_at,
  DROP COLUMN IF EXISTS amount_approved_by;

ALTER TABLE public.inventory_entries
  DROP COLUMN IF EXISTS account_id,
  DROP COLUMN IF EXISTS category_id,
  DROP COLUMN IF EXISTS subcategory_id;

-- Drop trigger/functions tied to accounts
DROP FUNCTION IF EXISTS public.record_order_payment_atomic(uuid, numeric, uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_account_balance() CASCADE;

-- Drop tables (CASCADE removes policies/triggers)
DROP TABLE IF EXISTS public.order_payments CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.transaction_categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;

-- Media module
DROP TABLE IF EXISTS public.media_metadata CASCADE;

-- Music module
DROP TABLE IF EXISTS public.music_tracks CASCADE;
