## Cleanup Plan — Remove Unused Items

### ⚠️ Important correction
Your list included `create_order_atomic` as safe to remove, but it IS actively used in `src/hooks/useCheckout.ts:222` (called via `supabase.rpc("create_order_atomic")` during checkout). **I will keep it** — removing it would break checkout. Everything else on your list is confirmed orphaned.

---

### 1. Database — one migration (DROP statements)

Drop these orphaned functions (no triggers reference them, no `.rpc()` callers):
- `generate_short_order_number`
- `generate_order_number`
- `generate_sku`
- `sync_customer_to_account`
- `ensure_single_site_branding`
- `ensure_single_site_settings`
- `ensure_single_sms_provider`
- `ensure_customer_for_account`
- `update_customer_risk_profile`
- `update_order_status_from_items`
- `update_variant_stock_on_inventory`
- `update_updated_at_column`
- `find_customer_ids_by_phone`

Drop table:
- `inventory_categories` (also drops FK constraints from other inventory tables that point to it)

### 2. Code files to delete
- `src/pages/admin/AdminInventoryIn.tsx`
- `src/pages/admin/AdminInventoryOut.tsx`

### 3. MCP bridge (fully retire the AI bridge)
- Delete edge function `supabase/functions/mcp/` (also un-deploy from Cloud)
- Delete `src/lib/mcp/` folder (helpers + all 9 tool files) — no importers found in `src/`
- Uninstall npm package `@lovable.dev/mcp-js`
- Delete secret `MCP_ADMIN_KEY`

### 4. Other secrets
- Delete `PUBLIC_API_KEY` (leftover from removed products-api)

### 5. npm packages to uninstall
- `@radix-ui/react-avatar`
- `@radix-ui/react-progress`
- `@radix-ui/react-scroll-area`

---

### Safety guarantees
- Checkout, order creation, RLS (via `has_role`/`is_admin`), Meta Pixel/CAPI, Steadfast, Independent Inventory (entries + entry_items tables), and all admin/storefront routes remain untouched.
- No triggers exist in the live DB (verified), so dropping trigger-shaped functions cannot break any auto-behavior.
- Auto-generated Supabase types file will refresh after the migration runs.

### Execution order
1. Run DB migration (drops 13 functions + 1 table)
2. Delete edge function `mcp`
3. Delete secrets `MCP_ADMIN_KEY`, `PUBLIC_API_KEY`
4. Delete code files + `src/lib/mcp/` folder
5. Uninstall 4 npm packages (`@lovable.dev/mcp-js` + 3 Radix)
