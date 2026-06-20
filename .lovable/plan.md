## Goals
Four small, independent tweaks to the order module — no impact to existing data flows.

---

### 1. Show "Order Notes" on the All Orders card
On `src/pages/admin/AdminOrders.tsx`, every order box already has access to `customer_notes` (the field filled by the "Order Notes (Optional)" textarea on Checkout / Add Order). When `customer_notes` is non-empty, render a small note line inside the card details block (label "Note:" + truncated text, 2-line clamp, muted). Nothing rendered when empty.

No DB / hook changes — `customer_notes` is already in the orders payload.

---

### 2. Tag each order as **Web Order** vs **Admin Order**

**Database (migration):**
- Add column `orders.order_source TEXT` with allowed values `'web'` and `'admin'` (CHECK constraint), default `'web'`, indexed.
- Backfill existing rows to `'web'` so historical orders look unchanged.

**Code:**
- `src/pages/Checkout.tsx` order insert → set `order_source: 'web'`.
- `src/pages/admin/AdminAddOrder.tsx` order insert → set `order_source: 'admin'`.
- `src/services/order.service.ts` `CreateOrderData` gains optional `order_source`; passed through on insert (default `'web'` if omitted).
- `src/hooks/useOrders.ts` `Order` type adds `order_source: 'web' | 'admin' | null`.
- `src/pages/admin/AdminOrders.tsx` order card → small badge next to status: `Web Order` (neutral outline) or `Admin Order` (filled dark).

No filter UI added (out of scope).

---

### 3. Mobile keyboard auto-opens on Add Product sheet
On `src/pages/admin/AdminAddOrder.tsx`, the picker `<Sheet>` opens and Radix auto-focuses the first focusable element (the search `<Input>`), which triggers the mobile keyboard.

Fix: pass `onOpenAutoFocus={(e) => e.preventDefault()}` to `<SheetContent>` of the product picker sheet (line ~633). Search box stays usable — user taps it intentionally to open the keyboard. Variant sub-sheet is unaffected.

---

### 4. Status breakdown card on top of All Orders page
Replace / extend the top stats area on `src/pages/admin/AdminOrders.tsx` with a single new card that lists, per order status, both the **order count** and **total amount**.

**Hook change (`src/hooks/useOrders.ts → useOrderStats`):**
- Already fetches `id, order_status, payment_status, total_amount, created_at`. Add a `byStatus` aggregate:
  ```
  byStatus: Record<OrderStatus, { count: number; amount: number }>
  ```
  Computed client-side from the same `orders` array (no extra query).

**UI change (AdminOrders.tsx, after the existing 5 stat cards, before Filters):**
- One bordered card titled "Status Breakdown".
- Inside: a responsive row (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3`) — one mini cell per status that has count > 0, showing: status label, count (e.g. "12 orders"), total amount (`formatCurrency`). Statuses with 0 orders are hidden to keep it compact.
- Color of the label uses the same status color tokens already used on order cards.

Existing 5 cards (Total Orders / Today's Orders / Today's Order Amount / Today's Revenue / Total Revenue) stay untouched.

---

### Files touched
- `supabase` migration (new column + backfill + index)
- `src/pages/Checkout.tsx` (set `order_source: 'web'`)
- `src/pages/admin/AdminAddOrder.tsx` (set `order_source: 'admin'`, `onOpenAutoFocus` fix)
- `src/services/order.service.ts` (type + pass-through)
- `src/hooks/useOrders.ts` (`Order.order_source`, `useOrderStats.byStatus`)
- `src/pages/admin/AdminOrders.tsx` (note line, source badge, status breakdown card, switch grid back from 7 to keep current layout — no change to `xl:grid-cols-7`)

### Out of scope
No changes to RLS, fulfillment page, order creation logic beyond the source tag, or any existing styles/columns not listed above.
