# Order Fulfillment Module

A dedicated packing/dispatch workspace listed right below **All Orders** in the admin sidebar. It surfaces only orders that still need to be prepared & packed (not shipped, delivered, cancelled, returned, failed, or RTO), in a visual, image-first layout — so warehouse staff can pack the right items without opening each order.

## What it shows

A vertical list of **"in‑review" order cards** (paginated, 20/page). An order is "in‑review" when:
- `order_status` ∈ `pending`, `confirmed`, `processing`
- AND `consignment_id` is NULL (not yet pushed to Steadfast)

### Each card

```
┌──────────────────────────────────────────────────────────────┐
│ [img1] [img2] [img3]   PO-1042 · Parcel: —                   │
│  x2 L   x1 M    x1     Rakib Hasan · 01XXXXXXXXX             │
│  Black  Red    Blue    Dhaka / Mirpur · ৳2,450 · COD          │
│                                                              │
│                                       [ Mark Ready to Ship ] │
└──────────────────────────────────────────────────────────────┘
```

- Top row: **square thumbnails** for each line item (first product image, 64–80px, rounded-xl), with **qty + size + color** chip directly under each image.
- Right side: **PO number**, **Parcel/Consignment ID** (or "—"), **customer name**, **phone** (click-to-copy), shipping district/thana, total, payment method.
- One **status button per order** (not per product): "Mark Ready to Ship". Pressing it sets `order_status = 'processing'` (interpreted as "packed & ready"), records an `order_status_history` entry, and removes the card from the list.
- Card is clickable → opens the existing `OrderDetailModal` for full editing (re-uses what already works).
- Empty state: "All caught up — no orders waiting to be packed."

### Filters / header
- Search (PO / phone / name) — same debounce pattern as AdminOrders.
- Quick filter chips: All · Pending · Confirmed · Processing.
- Count badge next to title showing number of pending fulfillment orders.

## Files to add / change

**New**
- `src/pages/admin/AdminOrderFulfillment.tsx` — the page (list, filters, cards, mark-ready action).
- `src/components/admin/FulfillmentCard.tsx` — single order card with thumbnail strip + meta + action.

**Edit**
- `src/App.tsx` — lazy-load `AdminOrderFulfillment` and add `<Route path="order-fulfillment" element={<AdminOrderFulfillment />} />` inside the existing admin route block.
- `src/components/admin/AdminSidebar.tsx` — add `{ icon: PackageCheck, label: "Order Fulfillment", path: "/admin/order-fulfillment" }` directly under the "All Orders" entry in `orderItems`.

## Data layer (no schema changes)

Re-uses existing tables — no migration needed.

```ts
supabase.from("orders").select(`
  id, order_number, order_status, payment_status, total_amount,
  payment_method_type, consignment_id, created_at,
  shipping_name, shipping_phone, shipping_address,
  shipping_division:divisions(name), shipping_thana:thanas(name),
  items:order_items(
    id, product_id, product_name, variant_sku, variant_details, quantity, unit_price,
    product:products(
      id,
      images:product_images(image_url, sort_order)
    )
  )
`, { count: "exact" })
.in("order_status", ["pending","confirmed","processing"])
.is("consignment_id", null)
.order("created_at", { ascending: true })   // oldest first → pack queue
.range(from, to);
```

- "First image" picked client-side from `product.images` sorted by `sort_order`.
- "Size / color" pulled from `variant_details` JSON (already populated at checkout). Falls back to `variant_sku` if details are missing.
- Phone copy uses the same `navigator.clipboard.writeText` + `toast.success` pattern as the new Shipped-ID copy button.

## Mark Ready action

```ts
import { updateOrderStatus } from "@/services/order.service";

await updateOrderStatus(orderId, "processing", "Marked ready to ship from Fulfillment module");
queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
```

Uses the existing `updateOrderStatus` service (already writes to `order_status_history`). No new server code.

## Non-goals (keeps existing system untouched)

- Does **not** modify `AdminOrders.tsx`, `order.service.ts`, or any DB schema/policies/RPCs.
- Does **not** push to Steadfast — staff continue to use the existing "Sync Steadfast" flow on All Orders once items are packed.
- Does **not** introduce a new order status enum value — reuses `processing` as the "ready/packed" signal so reports, filters, and current automations keep working.
- Does **not** touch storefront, checkout, or customer-facing order views.

## Acceptance

- New "Order Fulfillment" link appears under "All Orders" in the admin sidebar.
- `/admin/order-fulfillment` lists only un-shipped, non-cancelled orders without a consignment ID.
- Each card shows product thumbnails with qty/size/color under each, plus PO #, parcel ID, customer name, phone, location.
- "Mark Ready to Ship" updates the order, logs history, and removes the card.
- All Orders page behavior is unchanged.
