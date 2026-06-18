# Add Order (Admin Order Placement)

A new mobile-first admin page that lets ecommerce executives place orders on behalf of customers. It reuses the existing atomic order creation pipeline so the resulting order shows up in All Orders and behaves identically to storefront orders.

## Navigation

- Add a new sidebar item **Add Order** in the Orders group, placed **above** "All Orders".
  - Icon: `PlusCircle`, path: `/admin/add-order`.
- Register the route in `src/App.tsx` (lazy-loaded), rendered inside `AdminLayout`.

## Page: `src/pages/admin/AdminAddOrder.tsx`

Single-column, mobile-first layout with stacked sections (no multi-step wizard). Uses existing shadcn primitives (`Card`, `Input`, `Button`, `Sheet`, `Dialog`).

Sections, top-to-bottom:

1. **Customer**
   - Phone field with debounced lookup (uses existing `find_customer_id_by_phone` / `useCustomers`). If found: autofill name, email, default address, division, thana. If not: inline "Create new customer" with name, phone, email, gender.
   - Address: address line, Division (Districts) + Thana selects via `useLocationData`, postal code. Reuses the same shipping rate logic as checkout (Thana-based, see `useCheckout`).

2. **Products**
   - "Add Product" button opens a bottom Sheet (mobile-friendly) with debounced product search (reuse `useProductSearch`) showing thumbnail, name, price.
   - On select, if the product has variants, show variant chips (size/color, etc.) and qty stepper; show variant image when available.
   - Selected items render as a compact list: thumbnail, name, variant summary, qty stepper, unit price, line total, remove button.

3. **Discount & Promo**
   - Manual discount input (flat amount, optional).
   - Promo code input with "Apply" button — reuses existing promo validation logic from `useCheckout` (`src/lib/promo.ts`) so rules stay consistent.

4. **Payment**
   - Payment method select via `usePaymentMethods` (COD default).
   - Optional fields: transaction id, sender number, paid amount (for partially-paid).

5. **Summary & Place Order**
   - Live totals: subtotal, discount, promo discount, shipping (from Thana), total.
   - Customer notes textarea.
   - Sticky "Place Order" button at bottom on mobile.

## Order creation

- Reuse the existing `useCreateOrder` mutation, which calls the `create_order_atomic` RPC. Same payload shape as `Checkout.tsx` builds.
- On success: toast + navigate to `/admin/orders` (or to the order detail). The new order appears in All Orders automatically.

## Creator tracking (future RBAC-ready)

Two columns added to `orders` so we can later show "placed by" and gate access by role:

- `created_by_user_id uuid` — `auth.users(id)`, nullable (storefront orders stay null).
- `created_by_source text` — `'storefront' | 'admin'`, default `'storefront'`.

The admin page sets both via the RPC. To avoid changing the RPC signature, we follow it with a quick `update` on the returned order id (admin RLS already permits this). Storefront flow is untouched.

A small migration adds the columns + index on `created_by_user_id`. No RLS change is required now; future role gating will read these columns.

## Out of scope (intentionally)

- No new role checks yet — page is admin-only via existing `/admin/*` guard. The `created_by_*` columns are the hook for future RBAC.
- No editing of existing orders here — that stays in All Orders / Order Detail.
- No inventory adjustments — same behavior as storefront orders.

## Files

- New: `src/pages/admin/AdminAddOrder.tsx`, plus small subcomponents in `src/components/admin/add-order/` (ProductPickerSheet, CustomerPicker, OrderSummary).
- Edit: `src/components/admin/AdminSidebar.tsx` (add nav item above All Orders), `src/App.tsx` (route).
- Migration: add `created_by_user_id`, `created_by_source` to `public.orders`.
