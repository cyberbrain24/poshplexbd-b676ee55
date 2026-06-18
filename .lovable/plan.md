## Order Fulfillment — issue status + card cleanup

### 1. Database
Add a single nullable column `fulfillment_issue` (TEXT) to `orders`. Allowed values: `stock_out`, `print_issues`, `courier_issues`, `other_issues`, or NULL (= None). Indexed for filtering. No RLS changes (uses existing admin order policies).

### 2. Fulfillment card (`src/pages/admin/AdminOrderFulfillment.tsx`)
Per-card changes:
- Remove the COD/payment-method badge.
- Remove the address line (`MapPin` / division / thana).
- Add an order note line showing `customer_notes` (fallback `internal_notes`) — same source/style used on the All Orders card, truncated.
- Add an **Issue Status** dropdown (shadcn `Select`) on the card, mobile-friendly:
  - Options: `None`, `Stock Out`, `Print Issues`, `Courier Issues`, `Others Issues`.
  - When a non-None value is selected, the trigger renders solid dark red (`bg-red-700 text-white border-red-700`); `None` stays neutral.
  - Selecting writes `fulfillment_issue` to the order row via Supabase update; optimistic update + invalidate `fulfillment-orders` and `orders` queries.
- "Mark as Ready" button: in addition to existing local-ready toggle, clears `fulfillment_issue` back to NULL on the same click.

Top toolbar:
- Add a new **Issue filter** dropdown (`All issues / None / Stock Out / Print Issues / Courier Issues / Others Issues`) shown only when active tab is `All In Review Order` or `Mark as not Ready`. Filtering is applied client-side over the already-loaded list.

Fetch query in this page must also `select` the new field and `customer_notes` / `internal_notes`.

### 3. All Orders card (`src/pages/admin/AdminOrders.tsx`)
- Change grid from `xl:grid-cols-8` to `xl:grid-cols-7` on both the skeleton grid and the live grid (line 711 and 721).
- When `fulfillment_issue` is set, show a small dark-red badge (e.g. "Stock Out") inside the existing card details block, near the status badges. No badge when null.
- Ensure the orders list query (in `useOptimizedOrders` or wherever the list is fetched) selects `fulfillment_issue` so the badge renders. If the hook needs an extra field, add it there.

### 4. Sync behavior
Because the value lives in `orders.fulfillment_issue`, both pages read the same source. After any update on the fulfillment page, both `["fulfillment-orders"]` and the All Orders query keys are invalidated so the card reflects instantly.

### Out of scope
- No change to existing ready/not-ready local storage logic.
- No change to other order fields, RLS, or RPCs.
- No status history record for issue changes (lightweight UI flag only).

### Technical notes
- Status label map: `stock_out → Stock Out`, `print_issues → Print Issues`, `courier_issues → Courier Issues`, `other_issues → Others Issues`.
- Dark red styling uses Tailwind `bg-red-700 hover:bg-red-700/90 text-white` for the trigger and badge to match the user's "fully dark red" requirement.
- Mobile: Select trigger uses `h-9 w-full sm:w-44`, placed under the action button on small screens.