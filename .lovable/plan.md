## Goal
Replace the heavy multi-section Business Intelligence dashboard with a lighter, simpler version focused only on the most useful KPIs and one or two charts. Remove complex analytics that bloat the page and the data hook.

## What stays (lightweight dashboard)
1. **Header** — "Dashboard" title + subtitle
2. **Top KPIs (4 cards)** — Today's Revenue, Today's Orders, Today's Qty Sold, Today's Profit
3. **Quick Period Summary (4 cards)** — Revenue for: Today, Last 7 Days, Last 30 Days, This Month
4. **Order Status row (compact)** — counts for Pending, Processing, Shipped, Delivered, Cancelled
5. **Product summary (compact)** — Total Products, Active, Categories, Brands
6. **One chart** — Revenue Last 7 Days (line/bar), full width

## What gets removed
- SmartAlertsBar (low stock / sales spike / drop)
- ComparisonCard with % indicators vs previous periods
- PerformanceTable (Fast Moving Category, Top Product, Top Category) — 3 large tables
- PaymentRatioChart donut + Method-wise Revenue breakdown
- Payment analytics block (COD/Mobile/Bank cards + COD pending)
- Sales Intelligence (Top Products / Top Categories tables, Best Size, Best Color)
- Inventory Health Monitor (Dead Stock / Slow Moving / Fast Moving) — already not rendered but still in code
- Revenue Last 12 Months chart
- Orders Last 7 Days chart (keep only Revenue 7d)
- Extra period cards (Yesterday, Day Before Yesterday, This Year)

## Files to change

**Rewrite (much shorter)**
- `src/pages/admin/AdminDashboard.tsx` — ~200 → ~80 lines, only the sections above
- `src/hooks/useDashboard.ts` — ~544 → ~150 lines, compute only: today/7d/30d/thisMonth totals, status counts, product summary, revenueLast7Days series
- `src/services/dashboard.service.ts` — drop variant cost/threshold fields and 12-month order range; fetch only last 30 days of orders + minimal product/category/brand counts

**Delete**
- `src/components/admin/dashboard/DashboardAdvanced.tsx` (no longer used)
- Remove unused exports from `DashboardWidgets.tsx` (keep `KPICard`, `SectionTitle`; drop `OrderPeriodCard`, `StatusCard`, `TopItemsTable` if unused)
- Trim `DashboardCharts.tsx` to just `RevenueLast7DaysChart`

## Out of scope
- No DB/schema changes
- No changes to other admin pages, sidebar, or routing
- AI assistant and other modules untouched

## Result
Dashboard loads with one small query payload, renders ~4 sections instead of ~8, and the hook drops from 544 to ~150 lines — significantly faster and easier to maintain.
