## Plan: Simplify order location badge to Inside/Outside Dhaka

### Goal
Update the location label on each order card in /admin/orders so it shows only two states instead of three.

### Current behavior
- Dhaka City → "Location: Dhaka City"
- Dhaka Sub-Urban → "Location: Dhaka Sub-Urban"
- Anything else → "Location: Outside Dhaka"

### Desired behavior
- District = "Dhaka City" or "Dhaka Sub-Urban" → "Location: Inside Dhaka"
- All other districts → "Location: Outside Dhaka"
- Keep existing purple text styling (`text-purple-600`, `text-[11px]`, `font-medium`)

### Files to change
- `src/pages/admin/AdminOrders.tsx` — the inline location badge added inside each order card grid item.

### Technical details
The badge already reads `order.shipping_division?.name`. We only need to adjust the conditional string mapping:
- `trim().toLowerCase()` match against `"dhaka city"` or `"dhaka sub-urban"`
- Return `"Inside Dhaka"` if matched, otherwise `"Outside Dhaka"`

No backend, schema, or hook changes required.
