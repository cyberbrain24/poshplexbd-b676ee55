## Plan: Enhance Add Order page

Three focused changes to `src/pages/admin/AdminAddOrder.tsx` — no DB or business-logic changes. Existing `create_order_atomic` flow, creator tagging, totals, promo, payment and shipping logic all stay identical.

### 1. Customer information — full parity with checkout/CRM

Expand the Customer card to capture every field the storefront checkout / Admin Customers form collects:

- Phone * (with existing lookup)
- Name *
- Email
- **Gender** (Select: male / female / other)
- **Date of Birth *** (required) — using the existing `BirthDatePicker` component (`src/components/ui/birth-date-picker.tsx`, year ≥ 1940), persisted via the customer's profile
- Address *, District *, Thana *, Postal Code
- Notes (already present, moved here)

Validation: `dob` becomes mandatory alongside name/phone/address/district/thana. If existing customer is loaded by phone and already has a DOB, prefill it; otherwise the admin must enter one before placing the order.

Persistence: `upsert_checkout_customer` RPC does not accept gender/dob today, so after it returns the customer id, do a lightweight `supabase.from('customers').update({ gender, date_of_birth })` on that id (admin-only RLS already permits this — same pattern as the existing creator-tag update). No migration needed.

### 2. Product picker — category/sub-category browsing + search

Rebuild the product picker `Sheet` to be a mobile-first browse-and-search experience:

```
┌──────────────────────────────┐
│ Search field (existing)      │
├──────────────────────────────┤
│ [All] [Cat A] [Cat B] [Cat C]│  ← horizontal scroll chips (parent categories)
│ [Sub 1] [Sub 2] [Sub 3] ...  │  ← appears when a parent is selected
├──────────────────────────────┤
│ Product grid (2 cols mobile, │
│ 3 cols ≥sm) — image, name,   │
│ price                        │
└──────────────────────────────┘
```

- Categories pulled from existing `categories` table via a new `useQuery` (parent_id null = top-level; children when a parent is picked). Reuses the same query pattern as `AdminCategories`.
- When a category/sub-category is selected, list products filtered by `product_categories` junction (matches the multi-category architecture memo). Default sort: newest first, `is_active = true`.
- Search field stays — when the user types, search results take over the grid; clearing search returns to the category browse view.
- Tapping a product opens the existing variant picker step (unchanged).
- Sheet opens full-height on mobile (`h-[100dvh]`) with sticky search/category header and scrollable grid below.

### 3. Mobile-friendly UI polish

- Increase tap targets: qty +/- buttons to `h-9 w-9`, primary inputs `h-11`.
- Sticky bottom action bar already exists — keep, ensure it sits above mobile footer nav (`z-40`, `pb-[env(safe-area-inset-bottom)]`).
- Customer/Products/Promo/Payment cards stack in a single column on mobile; on `≥md` keep the same single-column layout (admin pages aren't used on wide screens for order entry per the request).
- Picker grid: 2 cols on mobile, 3 on `sm`, 4 on `md`. Square thumbnails (`aspect-square rounded-lg`).
- Category chip row: horizontal scroll with `snap-x`, no scrollbar.

### Tracking, integrations, sync — unchanged

- Order creation still goes through `useCreateOrder` → `create_order_atomic` RPC (same shape as storefront checkout), so:
  - Order number generation, status history, item insertion, payment/shipping fields, promo usage tracking — all identical.
  - Steadfast push, SMS triggers, FB pixel/CAPI, GA4, financial sync, fulfillment workflow — all driven downstream by the same order row, no changes required.
  - Creator tagging (`created_by_user_id`, `created_by_source = 'admin'`) stays.

### Files touched

- `src/pages/admin/AdminAddOrder.tsx` — customer fields, picker rewrite, mobile polish, post-create gender/DOB update.
- No new files, no migration, no changes to hooks/services/RPCs.
