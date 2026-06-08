## Goal
On every order card in `/admin/orders`, display a small purple line showing the shipping location classification.

## Logic
Use the order's `shipping_division.name`:
- `"Dhaka City"` → show `Location: Dhaka City`
- `"Dhaka Sub-Urban"` → show `Location: Dhaka Sub-Urban`
- Anything else (or missing) → show `Location: Outside Dhaka`

Match is case-insensitive and trimmed for safety.

## Implementation
Single edit in `src/pages/admin/AdminOrders.tsx` — inside the order card render (around line 603, right after the payment method line, before the Parcel/Courier block):

```tsx
{(() => {
  const div = order.shipping_division?.name?.trim().toLowerCase();
  let label = "Outside Dhaka";
  if (div === "dhaka city") label = "Dhaka City";
  else if (div === "dhaka sub-urban") label = "Dhaka Sub-Urban";
  return (
    <div className="text-[11px] font-medium text-purple-600 truncate">
      Location: {label}
    </div>
  );
})()}
```

No backend, hook, or schema changes. `shipping_division` is already fetched in `useOrders.ts`.

## Out of scope
- Order detail modal, packing PDF, mobile-only views — only the card grid on the Orders page per the screenshot.
