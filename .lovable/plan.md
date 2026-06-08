## Fix: Location badge always shows "Outside Dhaka"

### Root cause
The list query in `useOrders` (lines 138-147 of `src/hooks/useOrders.ts`) does not select the `shipping_division` relation. The card UI reads `order.shipping_division?.name`, which is always `undefined`, so the conditional falls through to "Outside Dhaka" for every order.

The single-order query (line 186) already joins divisions correctly; only the list query is missing it.

### Fix
Add the division join to the list select:

```ts
.select(`
  *,
  customer:customers(id, name, phone, email),
  payment_method:payment_methods(id, name, type),
  shipping_division:divisions(id, name),
  items:order_items(...)
`)
```

### Files to change
- `src/hooks/useOrders.ts` — add `shipping_division:divisions(id, name)` to the list query select.

No other changes needed; AdminOrders.tsx already handles the data correctly.
