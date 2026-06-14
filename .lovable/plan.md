## Performance Fix Plan (Tier 1 + 2 + 3)

Safe, no UI/data/RLS changes. Pixel integration untouched.

### Tier 1 — Cache settings hooks
- `src/providers/TypographyProvider.tsx`: staleTime 60min, gcTime 2h, disable refetchOnWindowFocus/Reconnect, localStorage hydration
- `src/hooks/useFacebookPixel.ts`: localStorage cache with 60min TTL (keep useRef guard)
- `src/hooks/usePixelSettings.ts`: add staleTime 10min, gcTime 30min, refetchOnWindowFocus false
- `src/hooks/useSiteBranding.ts`: add gcTime 1h, refetchOnWindowFocus false

### Tier 2 — Throttle visitor tracking
- `src/hooks/useVisitorTracking.ts`: dedupe by (session_id, path) in sessionStorage; use `navigator.sendBeacon` fire-and-forget

### Tier 3 — Slim heavy admin queries (biggest win)
- Admin products list: replace `select('*', joins)` with pinned columns (id, name, sku, base_price, is_active, created_at, category, main image only)
- Admin orders list: use existing `SLIM_COLUMNS.ordersList` from `src/utils/performance.ts`

### Expected impact
- Admin products/orders: ~438ms → ~50ms per page load
- Storefront: fewer settings round-trips, faster repeat navigation
- Visitor tracking: ~80% fewer page_views inserts from same-session navigation

### Not touched
Pixel firing, RLS, schemas, UI, business logic, get_daily_visits RPC, query keys.
