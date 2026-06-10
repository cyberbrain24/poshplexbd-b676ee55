## Goal

Add two new admin-only modules to POSHPLEX without disturbing existing routes, dashboards, or data flows:

1. **Documentation** — static, repo-based reference for APIs, edge functions, integrations, and complex logic.
2. **Reports** — exportable reports (CSV + PDF) for Orders, Accounts/Financials, Customers, Products, Inventory, Promo Codes, and Reviews.

Both live under `/admin/*`, are lazy-loaded, gated by existing admin RBAC, and add no new tables, no new edge functions, no extra runtime cost when not visited.

---

## 1. Documentation module

**Route group:** `/admin/docs`
- `/admin/docs` — index with categorised list + search
- `/admin/docs/:slug` — single doc page

**Storage:** plain `.md` files in `src/content/docs/` (no DB, no CMS). Each file has front-matter:
```
---
title: Steadfast Courier Integration
category: Integrations
order: 10
updated: 2026-06-10
---
# ...markdown body...
```

**How it loads:** Vite's `import.meta.glob('../../content/docs/*.md', { as: 'raw', eager: false })` — each doc is its own chunk, fetched on demand. Front-matter parsed with a tiny inline parser (no new dep). Markdown rendered with `react-markdown` + `remark-gfm` (already light, well-supported).

**Initial seed docs** (we write these from existing project knowledge — already documented in `.lovable/` memory files):
- Architecture overview
- Order, Inventory & Payment module
- Customer module & location hierarchy
- Product module (SKU, attributes, variants, multi-category)
- Steadfast Courier integration
- Meta Pixel / CAPI / GA4 integration
- Lovable AI Gateway & edge functions (`admin-product-ai`, `ai-seo-generate`, `meta-capi`, `steadfast-courier`, `sms-send`, etc.)
- RBAC & access control (`user_roles`, `has_role`)
- Promo codes engine
- Shipping rates (district/thana)

**UI**
- Left rail: collapsible category list with search input (client-side fuzzy filter on title + category)
- Main: rendered markdown with prose typography, copy-link-to-section, "last updated" stamp
- "Edit on repo" hint only — no in-app editor

---

## 2. Reports module

**Route group:** `/admin/reports`
- `/admin/reports` — overview cards (one per report) with last-run summary
- `/admin/reports/orders`
- `/admin/reports/financial`
- `/admin/reports/customers`
- `/admin/reports/products`
- `/admin/reports/inventory`
- `/admin/reports/promos`
- `/admin/reports/reviews`

**Common report shell** (`ReportLayout`):
- Date range picker (today / yesterday / 7d / 30d / this month / last month / custom)
- Report-specific filters (status, account, category, district, etc.)
- "Run report" button (queries on demand, never on mount auto-run for heavy ones)
- Result table (virtualised when >200 rows, reusing existing `VirtualizedTable`)
- Summary KPI strip above the table
- Export buttons: **CSV** and **PDF**

**Data sources:** existing tables only — `orders`, `order_items`, `order_payments`, `transactions`, `accounts`, `customers`, `products`, `product_variants`, `inventory_entries`, `inventory_entry_items`, `promo_codes`, `promo_code_usages`, `reviews`. Each report is its own service module under `src/services/reports/` that uses the existing `supabase` client with selective fetches and date filters — no new RLS/policies needed.

**Exports**
- **CSV:** in-browser generator (`src/lib/csvExport.ts`) — no dep, builds blob and triggers download.
- **PDF:** reuse `jspdf` + `jspdf-autotable` (already present for order packing PDF — confirmed in `src/lib/orderPackingPdf.ts`). One shared `src/lib/reportPdf.ts` helper renders a branded POSHPLEX header (off-black `#2f2f2f`), filter summary, KPI row, then table.

**Per-report contents (v1)**

| Report | Columns | KPIs |
|---|---|---|
| Orders | order #, date, customer, status, payment status, items qty, subtotal, shipping, total, paid | total orders, revenue ৳, qty, avg order ৳ |
| Financial | date, type (in/out), account, category, amount, reference | total income ৳, total expense ৳, net ৳, opening/closing per account |
| Customers | name, phone, district, thana, orders, lifetime ৳, last order | new customers, returning, total customers, top 10 by lifetime |
| Products | name, SKU, category, brand, qty sold, revenue ৳ | top sellers, slow movers, total SKUs sold |
| Inventory | entry #, date, type (in/out), product, qty, unit cost, total cost | total in qty/৳, total out qty/৳, net movement |
| Promo Codes | code, type, usages, discount given ৳, orders | top codes, total discount given |
| Reviews | product, customer, rating, status, date | avg rating, count by status |

---

## 3. Wiring & performance

- **Routes:** add lazy imports in `src/App.tsx` (matching the Marketing pattern), nested under `AdminLayout` with `ProtectedRoute requireAdmin`.
- **Prefetch:** register the new routes in `src/lib/adminRoutePrefetch.ts` so idle prefetch picks them up.
- **Sidebar:** in `src/components/admin/AdminSidebar.tsx`, add two new entries — `Documentation` (single link, `BookOpen` icon) and a collapsible `Reports` group (`FileBarChart` icon) listing the 7 sub-reports. Placed before `Notes` so the Core group of 5 collapsibles is preserved.
- **Code-splitting:** every report page is its own lazy chunk; markdown renderer + jspdf import dynamically only when used (`await import(...)`).
- **Caching:** report queries use React Query with `staleTime: 60_000` so repeated runs in same session are instant; PDF/CSV use the in-memory result, no re-fetch.
- **No DB migrations.** No new edge functions. No new env vars.

---

## 4. Technical notes (for engineers)

- New folders:
  - `src/content/docs/*.md` (markdown sources)
  - `src/pages/admin/docs/` (`DocsIndex.tsx`, `DocPage.tsx`)
  - `src/pages/admin/reports/` (`ReportsOverview.tsx`, `OrdersReport.tsx`, `FinancialReport.tsx`, `CustomersReport.tsx`, `ProductsReport.tsx`, `InventoryReport.tsx`, `PromosReport.tsx`, `ReviewsReport.tsx`, `ReportLayout.tsx`)
  - `src/services/reports/` (one file per report — `orders.report.ts`, etc.)
  - `src/lib/csvExport.ts`, `src/lib/reportPdf.ts`
  - `src/hooks/useDocs.ts`, `src/hooks/useReport.ts`
- Deps to add (minimal): `react-markdown`, `remark-gfm`. jspdf + autotable already in project.
- All tables paginate and cap raw rows at 5,000 per run with a "narrow your date range" hint, to keep memory/PDF size safe.
- Markdown rendered with Tailwind `prose` (already in config) for consistency.

---

## 5. Out of scope (v1)

- In-app doc editor / DB-backed docs (user picked static MDX).
- Excel (XLSX) export — CSV + PDF only.
- Scheduled / emailed reports.
- Public-facing help center.

These can be added later without rework — the route shells and service layer are designed to extend.
