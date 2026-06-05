## Problem

The 6 recent orders all have `customer_id = NULL` and no matching record in the `customers` table. Root cause: Checkout calls `supabase.from('customers').insert(...)` directly, but RLS only allows authenticated users to insert customers:

```
Policy "Authenticated users can insert customers": WITH CHECK (auth.uid() IS NOT NULL)
```

Guest checkouts (no logged-in user) silently fail the insert (`createError` is logged to console but ignored), so no customer record is created and the order keeps `customer_id = NULL`. Admin's Customers page therefore doesn't show them.

## Fix (minimal, non-disruptive)

### 1. New SECURITY DEFINER RPC: `upsert_customer_for_checkout`

Migration creates one function that anon/authenticated can call. It:
- Looks up customer by phone.
- If found: updates name + any provided non-null fields (email, gender, address, division_id, thana_id, postal_code).
- If not found: inserts a new row with the provided fields.
- Returns the customer UUID.

Granted EXECUTE to `anon` and `authenticated`. No table grants or RLS changes — the function runs as definer and bypasses the insert policy safely (only writes the checkout fields, never roles/membership).

### 2. Update `src/pages/Checkout.tsx` → `findOrCreateCustomer`

Replace the manual lookup-update-insert block (lines ~338-412) with a single `supabase.rpc('upsert_customer_for_checkout', { ... })` call. Then still call `createCustomerAccount(...)` afterward (unchanged) so the auth account + auto-login keep working.

### 3. Backfill the 6 existing guest orders

One-off data update: for each of the 6 orders with `customer_id IS NULL`, upsert a `customers` row by `guest_phone` (using shipping_name/email/division/thana from the order) and set `orders.customer_id` to that id. This makes the existing orders show up under the right customer immediately.

## Out of scope (untouched)

- `useCheckout.ts`, order creation RPC, payment flow, edge functions, auth/login flow.
- `create-customer-account` edge function (already works once a customer_id exists).
- RLS policies on `customers` (unchanged — RPC is the only new write path).
