import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard, SectionTitle } from "@/components/admin/dashboard/DashboardWidgets";
import { RevenueLast7DaysChart } from "@/components/admin/dashboard/DashboardCharts";
import { ORDER_STATUS_LABELS } from "@/constants";

// Display only the canonical 7 statuses on the dashboard.
// (returned/failed/rto are collapsed into Cancel via ORDER_STATUS_LABELS.)
const DASHBOARD_STATUS_KEYS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'partially_delivered',
  'cancelled',
] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

const AdminDashboard = () => {
  const { analytics, isLoading } = useDashboard();

  if (isLoading || !analytics) return <DashboardSkeleton />;

  const {
    product, lifetime, today, yesterday, dayBeforeYesterday, weekly,
    last30Days, thisMonth, revenueLast7Days,
  } = analytics;
  const statusTotals = lifetime.statusTotals || {};

  const orderCard = (label: string, p: { orders: number; qty: number; revenue: number }) => (
    <KPICard
      key={label}
      label={label}
      value={`${p.orders} orders`}
      sub={`${p.qty} qty • ${formatCurrency(p.revenue)}`}
    />
  );

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Quick overview of your store</p>
      </div>

      {/* Order Snapshot */}
      <section className="space-y-3">
        <SectionTitle icon="🧾">Order Snapshot</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <KPICard
            label="Lifetime Orders"
            value={`${lifetime.orders} orders`}
            sub={`${lifetime.qty} qty • ${formatCurrency(lifetime.revenue)}`}
          />
          {orderCard("Last 30 Days", last30Days)}
          {orderCard("Running Month", thisMonth)}
          {orderCard("This Week (7d)", weekly)}
          {orderCard("Today", today)}
          {orderCard("Yesterday", yesterday)}
          {orderCard("Day Before Yesterday", dayBeforeYesterday)}
          <KPICard
            label="Avg Order (Today)"
            value={formatCurrency(today.orders ? today.revenue / today.orders : 0)}
            sub={`${today.orders} orders today`}
          />
        </div>
      </section>

      {/* Order status (lifetime) */}
      <section className="space-y-3">
        <SectionTitle icon="🔄">Order Status (Lifetime)</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {DASHBOARD_STATUS_KEYS.map((key) => {
            const s = statusTotals[key] || { count: 0, amount: 0 };
            return (
              <KPICard
                key={key}
                label={ORDER_STATUS_LABELS[key]}
                value={`${s.count} orders`}
                sub={formatCurrency(s.amount)}
              />
            );
          })}
        </div>
      </section>

      {/* Catalog */}
      <section className="space-y-3">
        <SectionTitle icon="📦">Catalog</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <KPICard label="Products" value={product.totalProducts} />
          <KPICard label="Active" value={product.activeProducts} />
          <KPICard label="Categories" value={product.totalCategories} />
          <KPICard label="Brands" value={product.totalBrands} />
        </div>
      </section>

      {/* Trend */}
      <section className="space-y-3">
        <SectionTitle icon="📉">Trend</SectionTitle>
        <RevenueLast7DaysChart data={revenueLast7Days} />
      </section>
    </div>
  );
};

export default AdminDashboard;
