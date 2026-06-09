import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard, SectionTitle, StatusCard } from "@/components/admin/dashboard/DashboardWidgets";
import { RevenueLast7DaysChart } from "@/components/admin/dashboard/DashboardCharts";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

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
    last7Days, last30Days, thisMonth, statusCounts, revenueLast7Days,
  } = analytics;

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
        </div>
      </section>

      {/* Today */}
      <section className="space-y-3">
        <SectionTitle icon="📊">Today</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <KPICard label="Revenue" value={formatCurrency(today.revenue)} />
          <KPICard label="Orders" value={today.orders} />
          <KPICard label="Qty Sold" value={today.qty} />
          <KPICard label="Avg Order" value={formatCurrency(today.orders ? today.revenue / today.orders : 0)} />
        </div>
      </section>

      {/* Revenue across periods */}
      <section className="space-y-3">
        <SectionTitle icon="💰">Revenue</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <KPICard label="Today" value={formatCurrency(today.revenue)} sub={`${today.orders} orders`} />
          <KPICard label="Last 7 Days" value={formatCurrency(last7Days.revenue)} sub={`${last7Days.orders} orders`} />
          <KPICard label="Last 30 Days" value={formatCurrency(last30Days.revenue)} sub={`${last30Days.orders} orders`} />
          <KPICard label="This Month" value={formatCurrency(thisMonth.revenue)} sub={`${thisMonth.orders} orders`} />
        </div>
      </section>

      {/* Order status */}
      <section className="space-y-3">
        <SectionTitle icon="🔄">Order Status (last 31 days)</SectionTitle>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <StatusCard key={key} label={label} count={statusCounts[key] || 0} />
          ))}
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
