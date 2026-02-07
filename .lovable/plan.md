
# Steadfast Courier Integration for Orders Module

## Overview
This plan integrates Steadfast courier functionality directly into the Orders admin module, adding single-click shipment creation, real-time Steadfast delivery status display, enhanced customer details in order view, and renaming "Division" to "District" throughout the system.

## Changes Summary

### 1. Orders Table Enhancement
**File: `src/pages/admin/AdminOrders.tsx`**

Add the following features:
- **New "Courier" column** showing Steadfast delivery status (fetched via tracking code)
- **"Ship to Steadfast" button** in each row for orders without tracking numbers
- Color-coded Steadfast status badges using the existing `STEADFAST_STATUS_MAP`
- Integrate the `useCreateShipment` hook for one-click shipping

```text
Table columns:
Order | Customer | Items | Total | Status | Payment | Courier Status | Date | Actions
                                            ^^^^^^^^^^^^^^^^^
                                            (NEW: Shows Steadfast status or "Ship" button)
```

### 2. Enhanced Order Detail Modal
**File: `src/components/admin/OrderDetailModal.tsx`**

Add comprehensive customer and shipping details:
- **Customer Details Section**: Display customer name, phone, email, address, District (renamed from Division), Thana
- **"Send to Steadfast" button** in the modal header (if no tracking exists)
- **Live Steadfast tracking status** with auto-refresh
- Show the COD amount being sent to Steadfast
- Display item descriptions being sent to courier

### 3. Rename "Division" to "District"
Update the UI labels across all relevant files (keeping the database column names unchanged):

| File | Changes |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Sidebar menu: "Divisions" → "Districts" |
| `src/pages/admin/AdminDivisions.tsx` | Page title: "Divisions" → "Districts" |
| `src/components/admin/DivisionModal.tsx` | Modal title/labels: "Division" → "District" |
| `src/components/admin/CustomerModal.tsx` | Form label: "Division" → "District" |
| `src/pages/admin/AdminThanas.tsx` | Filter label: "All Divisions" → "All Districts" |
| `src/components/admin/ThanaModal.tsx` | Form label: "Division" → "District" |
| `src/components/admin/OrderDetailModal.tsx` | Display label: "Division" → "District" |
| `src/components/admin/SmsCampaignModal.tsx` | Filter section: "Division" → "District" |
| `src/components/admin/WhatsappCampaignModal.tsx` | Filter section: "Division" → "District" |

### 4. Update Edge Function Payload
**File: `supabase/functions/steadfast-courier/index.ts`**

Enhance the order payload sent to Steadfast:
- Include District and Thana names in the address
- Build comprehensive address string: `{address}, {thana}, {district}`
- Add order items description with quantities

---

## Technical Implementation Details

### AdminOrders.tsx Changes:
```typescript
// New imports
import { useCreateShipment, STEADFAST_STATUS_MAP, useTrackShipment } from "@/hooks/useSteadfast";
import { Truck, Send } from "lucide-react";

// Add Steadfast status column to table
// Add inline "Ship" button that calls createShipment.mutate(order.id)
// Show tracking code and status if already shipped
```

### OrderDetailModal.tsx Changes:
```typescript
// Enhanced query to include division and thana relations
const { data: order } = useOrder(orderId);
// Already fetches: shipping_division:divisions(id, name), shipping_thana:thanas(id, name)

// Add Steadfast section with:
// - "Send to Steadfast" button (useCreateShipment hook)
// - Live tracking status display (useTrackShipment hook with order.tracking_number)
// - Customer details with District/Thana display
```

### Steadfast Edge Function Enhancement:
```typescript
// Fetch division and thana names along with order
const { data: order } = await supabase
  .from("orders")
  .select(`
    *,
    order_items(product_name, quantity, variant_sku),
    shipping_division:divisions(name),
    shipping_thana:thanas(name)
  `)
  .eq("id", order_id)
  .single();

// Build comprehensive address
const fullAddress = [
  order.shipping_address,
  order.shipping_thana?.name,
  order.shipping_division?.name
].filter(Boolean).join(", ");

// Payload to Steadfast
const payload = {
  invoice: order.order_number,
  recipient_name: order.shipping_name,
  recipient_phone: order.shipping_phone,
  recipient_address: fullAddress,
  cod_amount: order.payment_method_type === "cod" ? order.total_amount : 0,
  item_description: itemsDescription,
  // ...
};
```

---

## Files to Modify

1. **`src/pages/admin/AdminOrders.tsx`** - Add Courier column and Ship button
2. **`src/components/admin/OrderDetailModal.tsx`** - Enhanced customer details and Steadfast integration
3. **`supabase/functions/steadfast-courier/index.ts`** - Include district/thana in address payload
4. **`src/components/admin/AdminSidebar.tsx`** - Rename "Divisions" to "Districts"
5. **`src/pages/admin/AdminDivisions.tsx`** - Rename page title/content
6. **`src/components/admin/DivisionModal.tsx`** - Rename modal labels
7. **`src/components/admin/CustomerModal.tsx`** - Rename form label
8. **`src/pages/admin/AdminThanas.tsx`** - Rename filter label
9. **`src/components/admin/ThanaModal.tsx`** - Rename form label
10. **`src/components/admin/SmsCampaignModal.tsx`** - Rename filter section
11. **`src/components/admin/WhatsappCampaignModal.tsx`** - Rename filter section

---

## User Experience Flow

1. **Order List View**: Admin sees all orders with a "Courier" column
   - Orders without tracking show a "Ship" button with truck icon
   - Orders with tracking show Steadfast status badge (e.g., "In Review", "Delivered")

2. **Single-Click Shipping**: Admin clicks "Ship" button
   - System sends order data to Steadfast API
   - On success, tracking code appears, order status updates to "processing"
   - Toast notification confirms success with tracking code

3. **Order Detail Modal**: Admin clicks eye icon to view order
   - Full customer details including District and Thana
   - "Send to Steadfast" button if not yet shipped
   - Live tracking information if already shipped
   - Order items and amounts clearly displayed

4. **Consistent Terminology**: "Division" renamed to "District" everywhere in the UI

---

## Testing Considerations

After implementation:
1. Test shipping an order from the order list (Ship button)
2. Test shipping from order detail modal
3. Verify tracking status updates correctly
4. Verify District/Thana names appear in Steadfast console
5. Confirm all "Division" → "District" renames are complete
