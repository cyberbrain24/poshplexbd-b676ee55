import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KPICard, SectionTitle, OrderPeriodCard, StatusCard, TopItemsTable,
} from "@/components/admin/dashboard/DashboardWidgets";
import {
  RevenueLast7DaysChart, RevenueLast12MonthsChart, OrdersLast7DaysChart,
} from "@/components/admin/dashboard/DashboardCharts";
import {
  SmartAlertsBar, ComparisonCard, PerformanceTable,
  PaymentRatioChart,
} from "@/components/admin/dashboard/DashboardAdvanced";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  partially_delivered: "Partial Delivery",
};

const PERIOD_LABELS: Record<string, string> = {
  today: "📅 Today",
  yesterday: "📅 Yesterday",
  dayBeforeYesterday: "📅 Day Before Yesterday",
  last7Days: "📅 Last 7 Days",
  last30Days: "📅 Last 30 Days",
  thisMonth: "📅 This Month",
  thisYear: "📅 This Year",
};

const METHOD_LABELS: Record<string, string> = {
  cod: "COD",
  mobile_banking: "Mobile Banking",
  bank_transfer: "Bank Transfer",
  card: "Card",
  online_gateway: "Online Gateway",
  other: "Other",
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>
  );
}

const AdminDashboard = () => {
  const { analytics, isLoading } = useDashboard();

  if (isLoading || !analytics) return <DashboardSkeleton />;

  const {
    product, periods, statusCounts,
    payment, sales, charts, comparisons, performance,
    paymentRatio, smartAlerts,
  } = analytics;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Business Intelligence</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time ecommerce analytics & insights</p>
      </div>

      {/* ═══ 0. SMART ALERTS ═══ */}
      <SmartAlertsBar alerts={smartAlerts} />

      {/* ═══ 0.5 TODAY'S COMPARISON ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="📊">Today's Performance</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <ComparisonCard label="Revenue" value={formatCurrency(periods.today.revenue)} indicators={comparisons.revenue} />
          <ComparisonCard label="Orders" value={String(periods.today.totalOrders)} indicators={comparisons.orders} />
          <ComparisonCard label="Qty Sold" value={String(periods.today.totalQtySold)} indicators={comparisons.qtySold} />
          <ComparisonCard label="Profit" value={formatCurrency(periods.today.profit)} indicators={comparisons.profit} />
        </div>
      </section>

      {/* ═══ 1. PRODUCT & STOCK OVERVIEW ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="📦">Product Summary</SectionTitle>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <KPICard label="Total Products" value={product.totalProducts} />
          <KPICard label="Variants" value={product.totalVariants} />
          <KPICard label="Categories" value={product.totalCategories} />
          <KPICard label="Brands" value={product.totalBrands} />
          <KPICard label="Active" value={product.activeProducts} />
          <KPICard label="Inactive" value={product.inactiveProducts} />
        </div>
      </section>

      {/* ═══ 2. ORDER ANALYTICS ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="📈">Order Analytics</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <OrderPeriodCard key={key} title={label} data={periods[key]} />
          ))}
        </div>
      </section>

      {/* ═══ 3. ORDER STATUS ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="🔄">Order Status Overview</SectionTitle>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <StatusCard key={key} label={label} count={statusCounts[key] || 0} />
          ))}
        </div>
      </section>

      {/* ═══ 4. PAYMENT ANALYTICS + RATIO ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="💳">Payment Analytics</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <KPICard label="COD Orders" value={payment.codCount} />
              <KPICard label="Mobile Banking" value={payment.mobileBankingCount} />
              <KPICard label="Bank Transfer" value={payment.bankTransferCount} />
              <KPICard label="COD Pending" value={formatCurrency(payment.codPendingAmount)} />
            </div>
            {Object.keys(payment.methodRevenue).length > 0 && (
              <div className="border border-border bg-card p-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Method Wise Revenue
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {Object.entries(payment.methodRevenue).map(([method, revenue]) => (
                    <div key={method} className="flex justify-between border-b border-border pb-1">
                      <span className="text-muted-foreground">{METHOD_LABELS[method] || method}</span>
                      <span className="font-medium">{formatCurrency(revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <PaymentRatioChart data={paymentRatio} />
        </div>
      </section>

      {/* ═══ 5. PERFORMANCE INTELLIGENCE ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="🏆">Performance Intelligence</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <PerformanceTable title="Fast Moving Category" icon="📦" periods={performance.fastCategory} />
          <PerformanceTable title="Top Product" icon="🥇" periods={performance.topProduct} showProfit />
          <PerformanceTable title="Top Category (Revenue)" icon="🥈" periods={performance.topCategory} showOrders />
        </div>
      </section>

      {/* ═══ 6. SALES INTELLIGENCE ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="🏆">Sales Intelligence</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TopItemsTable title="Top Selling Products (Last 30 Days)" items={sales.topProducts} />
          <TopItemsTable title="Top Categories (Last 30 Days)" items={sales.topCategories} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <KPICard
            label="Best Selling Size (Today)"
            value={sales.bestSize ? sales.bestSize.name : "—"}
            sub={sales.bestSize ? `${sales.bestSize.qty} units sold` : "No sales today"}
          />
          <KPICard
            label="Best Selling Color (Today)"
            value={sales.bestColor ? sales.bestColor.name : "—"}
            sub={sales.bestColor ? `${sales.bestColor.qty} units sold` : "No sales today"}
          />
        </div>
      </section>


      {/* ═══ 8. VISUAL CHARTS ═══ */}
      <section className="space-y-3">
        <SectionTitle icon="📉">Trends</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <RevenueLast7DaysChart data={charts.revenueLast7Days} />
          <OrdersLast7DaysChart data={charts.revenueLast7Days} />
        </div>
        <RevenueLast12MonthsChart data={charts.revenueLast12Months} />
      </section>
    </div>
  );
};

export default AdminDashboard;
