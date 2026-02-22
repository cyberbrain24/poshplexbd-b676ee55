import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import {
  KPICard, SectionTitle, OrderPeriodCard, StatusCard,
  TopItemsTable, StockByCategoryTable,
} from "@/components/admin/dashboard/DashboardWidgets";
import {
  RevenueLast7DaysChart, RevenueLast12MonthsChart, OrdersLast7DaysChart,
} from "@/components/admin/dashboard/DashboardCharts";

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}

const AdminDashboard = () => {
  const { analytics, isLoading } = useDashboard();

  if (isLoading || !analytics) return <DashboardSkeleton />;

  const { product, stock, stockByCategory, periods, statusCounts, payment, sales, charts } = analytics;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Business intelligence overview</p>
      </div>

      {/* ═══ 1. PRODUCT & STOCK OVERVIEW ═══ */}
      <section className="space-y-4">
        <SectionTitle icon="📦">Product Summary</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Total Products" value={product.totalProducts} />
          <KPICard label="Product Variants" value={product.totalVariants} />
          <KPICard label="Categories" value={product.totalCategories} />
          <KPICard label="Brands" value={product.totalBrands} />
          <KPICard label="Active Products" value={product.activeProducts} />
          <KPICard label="Inactive Products" value={product.inactiveProducts} />
        </div>

        <SectionTitle icon="📊">Stock Summary</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard label="Total Stock Qty" value={stock.totalStock.toLocaleString()} />
          <KPICard label="Stock Value (Cost)" value={formatCurrency(stock.stockValuePurchase)} />
          <KPICard label="Stock Value (Retail)" value={formatCurrency(stock.stockValueSelling)} />
          <KPICard label="Low Stock" value={stock.lowStockCount} sub="Below threshold" />
          <KPICard label="Out of Stock" value={stock.outOfStockCount} />
        </div>

        <StockByCategoryTable data={stockByCategory} />
      </section>

      {/* ═══ 2. ORDER ANALYTICS ═══ */}
      <section className="space-y-4">
        <SectionTitle icon="📈">Order Analytics</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <OrderPeriodCard key={key} title={label} data={periods[key]} />
          ))}
        </div>
      </section>

      {/* ═══ 3. ORDER STATUS OVERVIEW ═══ */}
      <section className="space-y-4">
        <SectionTitle icon="🔄">Order Status Overview</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <StatusCard key={key} label={label} count={statusCounts[key] || 0} />
          ))}
        </div>
      </section>

      {/* ═══ 4. PAYMENT ANALYTICS ═══ */}
      <section className="space-y-4">
        <SectionTitle icon="💳">Payment Analytics</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="COD Orders" value={payment.codCount} />
          <KPICard label="Mobile Banking" value={payment.mobileBankingCount} />
          <KPICard label="Bank Transfer" value={payment.bankTransferCount} />
          <KPICard label="COD Pending Collection" value={formatCurrency(payment.codPendingAmount)} />
        </div>

        {Object.keys(payment.methodRevenue).length > 0 && (
          <div className="border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Payment Method Wise Revenue
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(payment.methodRevenue).map(([method, revenue]) => (
                <div key={method} className="flex justify-between border-b border-border pb-1">
                  <span className="text-muted-foreground">{METHOD_LABELS[method] || method}</span>
                  <span className="font-medium">{formatCurrency(revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══ 5. SALES INTELLIGENCE ═══ */}
      <section className="space-y-4">
        <SectionTitle icon="🏆">Sales Intelligence</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopItemsTable title="Top Selling Products (Last 30 Days)" items={sales.topProducts} />
          <TopItemsTable title="Top Categories (Last 30 Days)" items={sales.topCategories} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* ═══ 6. VISUAL CHARTS ═══ */}
      <section className="space-y-4">
        <SectionTitle icon="📉">Trends</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueLast7DaysChart data={charts.revenueLast7Days} />
          <OrdersLast7DaysChart data={charts.revenueLast7Days} />
        </div>
        <RevenueLast12MonthsChart data={charts.revenueLast12Months} />
      </section>
    </div>
  );
};

export default AdminDashboard;
