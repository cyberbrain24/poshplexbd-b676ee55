Add a minimal "Overall Daily Visits" chart to the Admin Dashboard by following the existing dashboard data-fetching and charting patterns.

### 1. Data fetching
- In `src/services/dashboard.service.ts`, add `fetchDailyVisits()`.
- Query `page_views` directly from the client (RLS already restricts to admins).
- Filter `created_at >= now() - interval '30 days'`.
- Group by `created_at::date`, count rows per day, order ascending.
- Return an array like `{ date: string; visits: number }[]`.

### 2. Hook integration
- In `src/hooks/useDashboard.ts`, add a `useQuery` call for `fetchDailyVisits` with `staleTime: 5 * 60 * 1000`.
- Expose `dailyVisits` in the returned `DashboardAnalytics` object.

### 3. Chart component
- In `src/components/admin/dashboard/DashboardCharts.tsx`, add `DailyVisitsChart`.
- Use `recharts` (`ResponsiveContainer`, `AreaChart` or `BarChart`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`).
- Style with the existing Tailwind CSS / shadcn tokens (border, bg-card, muted-foreground, primary color for the fill).
- Height ~220px, matching the existing `RevenueLast7DaysChart`.

### 4. Dashboard placement
- In `src/pages/admin/AdminDashboard.tsx`, render `DailyVisitsChart` inside the "Trend" section, above or beside the existing `RevenueLast7DaysChart`.
- Add the appropriate loading skeleton fallback if the new query is still loading.

### Technical details
- Query will use Supabase `.rpc()` only if a new lightweight RPC is needed; otherwise a standard `.from('page_views').select()` grouped client-side or server-side is acceptable.
- No new dependencies needed — `recharts` is already installed.
- No database schema changes needed.