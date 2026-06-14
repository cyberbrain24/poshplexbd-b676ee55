# Order Fulfillment — Tab + In-place Ready Toggle

## Changes to `src/pages/admin/AdminOrderFulfillment.tsx`

### 1. Filter tabs (top right)
Replace the current 2 filters with 3:
- **All In Review Order** (default, selected on page load)
- **Mark as not Ready**
- **Mark as Ready**

Query logic per tab:
- `all` → `order_status IN ('confirmed', 'processing')`
- `not_ready` → `order_status = 'confirmed'`
- `ready` → `order_status = 'processing'`

Default `statusFilter` state becomes `"all"`.

### 2. Mark as Ready button behavior
Currently: clicking the button moves the order to the other tab (it disappears from the current view because the query refetches and the order no longer matches `confirmed`).

New behavior on the **All** tab (and visually on any tab):
- The order **stays in place** — do not invalidate/refetch the list after the mutation. Instead, update the cached row's `order_status` to `processing` via `queryClient.setQueryData(["fulfillment-orders", ...], ...)` so the card stays mounted.
- When `order_status === 'processing'`, render the button as:
  - Background: **tilt/light green** (`bg-green-500 hover:bg-green-600 text-white`)
  - Label: **"Ready to deliver"**
  - Icon: `CheckCircle2`
- Clicking "Ready to deliver" calls `updateOrderStatus(orderId, 'confirmed', 'Reverted from Ready in Fulfillment')` and again updates the cache in place → button flips back to the default dark **"Mark as Ready"**.

### 3. Filtering on the "Mark as Ready" / "Mark as not Ready" tabs
On those two tabs the list is scoped by status, so toggling a row will naturally remove it from the visible list after cache update — that matches expectation (only the All tab shows both sides together).

### 4. Empty-state copy
Add a third message for the `all` tab: "No orders in review."

## Out of scope
- No schema changes, no RLS changes, no changes to `updateOrderStatus` service.
- No UI changes to the order cards beyond the button color/label swap.
- Modal, thumbnails, search input, and count badge remain unchanged.
