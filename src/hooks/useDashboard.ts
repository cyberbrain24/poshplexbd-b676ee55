import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchDashboardProducts,
  fetchDashboardOrders,
  fetchDashboardLookups,
  type DashboardOrder,
  type DashboardVariant,
} from "@/services/dashboard.service";

export interface PeriodMetrics {
  totalOrders: number;
  totalCustomers: number;
  totalQtySold: number;
  totalAmount: number;
  revenue: number;
  profit: number;
}

export interface StockByCategory {
  name: string;
  totalProducts: number;
  totalVariants: number;
  totalStock: number;
}

export interface TopItem {
  name: string;
  qty: number;
  revenue: number;
}

export interface TopItemWithProfit extends TopItem {
  profit: number;
}

export interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface ComparisonIndicator {
  label: string;
  pct: number; // positive = growth, negative = drop
}

export interface PerformanceEntry {
  name: string;
  qty: number;
  revenue: number;
  profit?: number;
  totalOrders?: number;
}

export interface InventoryRiskItem {
  name: string;
  stock: number;
  stockValue?: number;
  qtySold?: number;
  daysToStockOut?: number;
}

export interface SmartAlert {
  type: "low_stock" | "sales_spike" | "sales_drop";
  message: string;
  value: number;
  period?: string;
}

export interface PaymentRatio {
  codCount: number;
  onlineCount: number;
  codRevenue: number;
  onlineRevenue: number;
  codPct: number;
  onlinePct: number;
}

export interface DashboardAnalytics {
  product: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    totalVariants: number;
    totalCategories: number;
    totalBrands: number;
  };
  stock: {
    totalStock: number;
    stockValuePurchase: number;
    stockValueSelling: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  stockByCategory: StockByCategory[];
  periods: Record<string, PeriodMetrics>;
  statusCounts: Record<string, number>;
  payment: {
    codCount: number;
    mobileBankingCount: number;
    bankTransferCount: number;
    codPendingAmount: number;
    methodRevenue: Record<string, number>;
  };
  sales: {
    topProducts: TopItem[];
    topCategories: TopItem[];
    bestSize: { name: string; qty: number } | null;
    bestColor: { name: string; qty: number } | null;
  };
  charts: {
    revenueLast7Days: ChartPoint[];
    revenueLast12Months: { label: string; revenue: number }[];
  };
  // ── Advanced Analytics ──
  comparisons: {
    revenue: ComparisonIndicator[];
    orders: ComparisonIndicator[];
    qtySold: ComparisonIndicator[];
    profit: ComparisonIndicator[];
  };
  performance: {
    fastCategory: Record<string, PerformanceEntry | null>;
    topProduct: Record<string, TopItemWithProfit | null>;
    topCategory: Record<string, PerformanceEntry | null>;
  };
  paymentRatio: PaymentRatio;
  inventoryHealth: {
    deadStock: InventoryRiskItem[];
    slowMoving: InventoryRiskItem[];
    fastMoving: InventoryRiskItem[];
  };
  smartAlerts: SmartAlert[];
}

// ── Helpers ──
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function useDashboard() {
  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: fetchDashboardProducts,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: fetchDashboardOrders,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: lookups } = useQuery({
    queryKey: ["dashboard-lookups"],
    queryFn: fetchDashboardLookups,
    staleTime: 300_000,
  });

  const analytics = useMemo((): DashboardAnalytics | null => {
    if (!productData) return null;

    const { products, variants, categories, brands } = productData;

    // ── Product Stats ──
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const inactiveProducts = totalProducts - activeProducts;
    const totalVariants = variants.length;

    // ── Stock Stats ──
    const totalStock = variants.reduce((s, v) => s + (v.stock_quantity || 0), 0);
    const stockValuePurchase = variants.reduce((s, v) => s + (v.stock_quantity || 0) * (v.purchase_price || 0), 0);
    const stockValueSelling = variants.reduce((s, v) => s + (v.stock_quantity || 0) * (v.selling_price || 0), 0);
    const lowStockCount = variants.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold).length;
    const outOfStockCount = variants.filter((v) => v.stock_quantity === 0).length;

    // ── Stock by Category ──
    const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));
    const productCategoryMap = new Map(products.map((p) => [p.id, p.category_id]));
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    const catAgg = new Map<string, { name: string; products: Set<string>; variants: number; stock: number }>();
    for (const v of variants) {
      const catId = productCategoryMap.get(v.product_id) || "uncategorized";
      const catName = categoryMap.get(catId) || "Uncategorized";
      if (!catAgg.has(catId)) catAgg.set(catId, { name: catName, products: new Set(), variants: 0, stock: 0 });
      const e = catAgg.get(catId)!;
      e.products.add(v.product_id);
      e.variants++;
      e.stock += v.stock_quantity || 0;
    }
    const stockByCategory: StockByCategory[] = Array.from(catAgg.values())
      .map((e) => ({ name: e.name, totalProducts: e.products.size, totalVariants: e.variants, totalStock: e.stock }))
      .sort((a, b) => b.totalStock - a.totalStock);

    // ── Variant lookup ──
    const variantMap = new Map<string, DashboardVariant>(variants.map((v) => [v.id, v]));
    // Product → variants map for inventory health
    const productVariantsMap = new Map<string, DashboardVariant[]>();
    for (const v of variants) {
      if (!productVariantsMap.has(v.product_id)) productVariantsMap.set(v.product_id, []);
      productVariantsMap.get(v.product_id)!.push(v);
    }

    // ── Period helpers ──
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = daysAgo(1);
    const dayBefore = daysAgo(2);
    const last7 = daysAgo(7);
    const last14 = daysAgo(14);
    const last30 = daysAgo(30);
    const last60 = daysAgo(60);
    const last120 = daysAgo(120);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const filterByDate = (from: Date, to?: Date) =>
      orders.filter((o) => {
        const d = new Date(o.created_at);
        return to ? d >= from && d < to : d >= from;
      });

    const computePeriod = (filtered: DashboardOrder[]): PeriodMetrics => {
      const totalOrders = filtered.length;
      const uniqueCustomers = new Set(filtered.map((o) => o.customer_id).filter(Boolean)).size;
      const totalAmount = filtered.reduce((s, o) => s + (o.total_amount || 0), 0);
      let totalQtySold = 0, revenue = 0, cost = 0;
      for (const order of filtered) {
        for (const item of order.items || []) totalQtySold += item.quantity || 0;
        if (order.order_status === "delivered") {
          revenue += order.total_amount || 0;
          for (const item of order.items || []) {
            const variant = item.variant_id ? variantMap.get(item.variant_id) : null;
            cost += (variant?.purchase_price || 0) * (item.quantity || 0);
          }
        }
      }
      return { totalOrders, totalCustomers: uniqueCustomers, totalQtySold, totalAmount, revenue, profit: revenue - cost };
    };

    const periods: Record<string, PeriodMetrics> = {
      today: computePeriod(filterByDate(today)),
      yesterday: computePeriod(filterByDate(yesterday, today)),
      dayBeforeYesterday: computePeriod(filterByDate(dayBefore, yesterday)),
      last7Days: computePeriod(filterByDate(last7)),
      last30Days: computePeriod(filterByDate(last30)),
      thisMonth: computePeriod(filterByDate(thisMonthStart)),
      thisYear: computePeriod(filterByDate(thisYearStart)),
    };

    // ── Status Counts ──
    const statusCounts: Record<string, number> = {};
    for (const o of orders) statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;

    // ── Payment Analytics ──
    const codOrders = orders.filter((o) => o.payment_method_type === "cod");
    const mobileBankingOrders = orders.filter((o) => o.payment_method_type === "mobile_banking");
    const bankTransferOrders = orders.filter((o) => o.payment_method_type === "bank_transfer");
    const codPendingAmount = codOrders
      .filter((o) => o.payment_status !== "paid" && o.order_status !== "cancelled")
      .reduce((s, o) => s + (o.total_amount || 0), 0);

    const deliveredOrders = orders.filter((o) => o.order_status === "delivered");
    const methodRevenue: Record<string, number> = {};
    for (const o of deliveredOrders) {
      const m = o.payment_method_type || "other";
      methodRevenue[m] = (methodRevenue[m] || 0) + (o.total_amount || 0);
    }

    // ── Sales Intelligence (existing) ──
    const last30Delivered = orders.filter((o) => new Date(o.created_at) >= last30 && o.order_status === "delivered");
    const productSales = new Map<string, TopItem>();
    const categorySales = new Map<string, TopItem>();

    for (const order of last30Delivered) {
      for (const item of order.items || []) {
        const pKey = item.product_name || item.product_id || "Unknown";
        if (!productSales.has(pKey)) productSales.set(pKey, { name: item.product_name, qty: 0, revenue: 0 });
        const pe = productSales.get(pKey)!;
        pe.qty += item.quantity || 0;
        pe.revenue += item.line_total || 0;

        const catId = item.product_id ? productCategoryMap.get(item.product_id) : null;
        const catName = catId ? categoryMap.get(catId) : "Uncategorized";
        const cKey = catId || "uncategorized";
        if (!categorySales.has(cKey)) categorySales.set(cKey, { name: catName || "Uncategorized", qty: 0, revenue: 0 });
        const ce = categorySales.get(cKey)!;
        ce.qty += item.quantity || 0;
        ce.revenue += item.line_total || 0;
      }
    }

    const topProducts = Array.from(productSales.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
    const topCategories = Array.from(categorySales.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);

    // Best selling size/color today
    const todayItems = filterByDate(today).flatMap((o) => o.items || []);
    const sizeCounts = new Map<string, number>();
    const colorCounts = new Map<string, number>();
    for (const item of todayItems) {
      if (item.variant_id) {
        const v = variantMap.get(item.variant_id);
        if (v?.size_id) sizeCounts.set(v.size_id, (sizeCounts.get(v.size_id) || 0) + (item.quantity || 0));
        if (v?.color_id) colorCounts.set(v.color_id, (colorCounts.get(v.color_id) || 0) + (item.quantity || 0));
      }
    }
    const sizeMap = new Map((lookups?.sizes || []).map((s: any) => [s.id, s.label]));
    const colorMap = new Map((lookups?.colors || []).map((c: any) => [c.id, c.name]));
    const topSizeEntry = sizeCounts.size > 0 ? [...sizeCounts.entries()].sort((a, b) => b[1] - a[1])[0] : null;
    const topColorEntry = colorCounts.size > 0 ? [...colorCounts.entries()].sort((a, b) => b[1] - a[1])[0] : null;
    const bestSize = topSizeEntry ? { name: sizeMap.get(topSizeEntry[0]) || "Unknown", qty: topSizeEntry[1] } : null;
    const bestColor = topColorEntry ? { name: colorMap.get(topColorEntry[0]) || "Unknown", qty: topColorEntry[1] } : null;

    // ── Charts ──
    const revenueLast7Days: ChartPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const ds = daysAgo(i);
      const de = i === 0 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) : daysAgo(i - 1);
      const dayOrders = filterByDate(ds, de);
      revenueLast7Days.push({
        label: ds.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: dayOrders.filter((o) => o.order_status === "delivered").reduce((s, o) => s + (o.total_amount || 0), 0),
        orders: dayOrders.length,
      });
    }
    const revenueLast12Months: { label: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mo = orders.filter((o) => { const d = new Date(o.created_at); return d >= ms && d < me && o.order_status === "delivered"; });
      revenueLast12Months.push({
        label: ms.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: mo.reduce((s, o) => s + (o.total_amount || 0), 0),
      });
    }

    // ══════════════════════════════════════════════
    // ── ADVANCED ANALYTICS ──
    // ══════════════════════════════════════════════

    // ── 1. Comparison Indicators ──
    const todayMetrics = periods.today;
    const yesterdayMetrics = periods.yesterday;
    const prev7 = computePeriod(filterByDate(last14, last7));
    const prev30 = computePeriod(filterByDate(last60, last30));
    const prev60 = computePeriod(filterByDate(last120, last60));
    const last60Metrics = computePeriod(filterByDate(last60));
    const avg7 = { revenue: periods.last7Days.revenue / 7, orders: periods.last7Days.totalOrders / 7, qty: periods.last7Days.totalQtySold / 7, profit: periods.last7Days.profit / 7 };
    const avg30 = { revenue: periods.last30Days.revenue / 30, orders: periods.last30Days.totalOrders / 30, qty: periods.last30Days.totalQtySold / 30, profit: periods.last30Days.profit / 30 };
    const avg60 = { revenue: last60Metrics.revenue / 60, orders: last60Metrics.totalOrders / 60, qty: last60Metrics.totalQtySold / 60, profit: last60Metrics.profit / 60 };

    const comparisons = {
      revenue: [
        { label: "vs Yesterday", pct: pctChange(todayMetrics.revenue, yesterdayMetrics.revenue) },
        { label: "vs 7d Avg", pct: pctChange(todayMetrics.revenue, avg7.revenue) },
        { label: "vs 30d Avg", pct: pctChange(todayMetrics.revenue, avg30.revenue) },
        { label: "vs 60d Avg", pct: pctChange(todayMetrics.revenue, avg60.revenue) },
      ],
      orders: [
        { label: "vs Yesterday", pct: pctChange(todayMetrics.totalOrders, yesterdayMetrics.totalOrders) },
        { label: "vs 7d Avg", pct: pctChange(todayMetrics.totalOrders, avg7.orders) },
        { label: "vs 30d Avg", pct: pctChange(todayMetrics.totalOrders, avg30.orders) },
        { label: "vs 60d Avg", pct: pctChange(todayMetrics.totalOrders, avg60.orders) },
      ],
      qtySold: [
        { label: "vs Yesterday", pct: pctChange(todayMetrics.totalQtySold, yesterdayMetrics.totalQtySold) },
        { label: "vs 7d Avg", pct: pctChange(todayMetrics.totalQtySold, avg7.qty) },
        { label: "vs 30d Avg", pct: pctChange(todayMetrics.totalQtySold, avg30.qty) },
        { label: "vs 60d Avg", pct: pctChange(todayMetrics.totalQtySold, avg60.qty) },
      ],
      profit: [
        { label: "vs Yesterday", pct: pctChange(todayMetrics.profit, yesterdayMetrics.profit) },
        { label: "vs 7d Avg", pct: pctChange(todayMetrics.profit, avg7.profit) },
        { label: "vs 30d Avg", pct: pctChange(todayMetrics.profit, avg30.profit) },
        { label: "vs 60d Avg", pct: pctChange(todayMetrics.profit, avg60.profit) },
      ],
    };

    // ── 2. Performance Intelligence ──
    const computeTopForPeriod = (from: Date, to?: Date) => {
      const periodDelivered = orders.filter((o) => {
        const d = new Date(o.created_at);
        return (to ? d >= from && d < to : d >= from) && o.order_status === "delivered";
      });

      const pSales = new Map<string, TopItemWithProfit>();
      const cSales = new Map<string, PerformanceEntry>();

      for (const order of periodDelivered) {
        for (const item of order.items || []) {
          const pKey = item.product_name || item.product_id || "Unknown";
          if (!pSales.has(pKey)) pSales.set(pKey, { name: item.product_name, qty: 0, revenue: 0, profit: 0 });
          const pe = pSales.get(pKey)!;
          pe.qty += item.quantity || 0;
          pe.revenue += item.line_total || 0;
          const v = item.variant_id ? variantMap.get(item.variant_id) : null;
          pe.profit += (item.line_total || 0) - (v?.purchase_price || 0) * (item.quantity || 0);

          const catId = item.product_id ? productCategoryMap.get(item.product_id) : null;
          const catName = catId ? categoryMap.get(catId) : "Uncategorized";
          const cKey = catId || "uncategorized";
          if (!cSales.has(cKey)) cSales.set(cKey, { name: catName || "Uncategorized", qty: 0, revenue: 0, totalOrders: 0 });
          const ce = cSales.get(cKey)!;
          ce.qty += item.quantity || 0;
          ce.revenue += item.line_total || 0;
        }
        // Count orders per category
        for (const item of order.items || []) {
          const catId = item.product_id ? productCategoryMap.get(item.product_id) : null;
          const cKey = catId || "uncategorized";
          const ce = cSales.get(cKey);
          if (ce) ce.totalOrders = (ce.totalOrders || 0) + 1;
        }
      }

      const fastCategory = Array.from(cSales.values()).sort((a, b) => b.qty - a.qty)[0] || null;
      const topProduct = Array.from(pSales.values()).sort((a, b) => b.qty - a.qty)[0] || null;
      const topCategory = Array.from(cSales.values()).sort((a, b) => b.revenue - a.revenue)[0] || null;

      return { fastCategory, topProduct, topCategory };
    };

    const perf7 = computeTopForPeriod(last7);
    const perf30 = computeTopForPeriod(last30);
    const perf60 = computeTopForPeriod(last60);

    const performance = {
      fastCategory: { "7d": perf7.fastCategory, "30d": perf30.fastCategory, "60d": perf60.fastCategory },
      topProduct: { "7d": perf7.topProduct, "30d": perf30.topProduct, "60d": perf60.topProduct },
      topCategory: { "7d": perf7.topCategory, "30d": perf30.topCategory, "60d": perf60.topCategory },
    };

    // ── 3. Payment Ratio ──
    const codDelivered = deliveredOrders.filter((o) => o.payment_method_type === "cod");
    const onlineDelivered = deliveredOrders.filter((o) => o.payment_method_type && o.payment_method_type !== "cod");
    const codRevenue = codDelivered.reduce((s, o) => s + (o.total_amount || 0), 0);
    const onlineRevenue = onlineDelivered.reduce((s, o) => s + (o.total_amount || 0), 0);
    const totalPaymentRevenue = codRevenue + onlineRevenue;
    const paymentRatio: PaymentRatio = {
      codCount: codOrders.length,
      onlineCount: mobileBankingOrders.length + bankTransferOrders.length,
      codRevenue,
      onlineRevenue,
      codPct: totalPaymentRevenue > 0 ? (codRevenue / totalPaymentRevenue) * 100 : 0,
      onlinePct: totalPaymentRevenue > 0 ? (onlineRevenue / totalPaymentRevenue) * 100 : 0,
    };

    // ── 4. Inventory Health Monitor ──
    // Collect product-level sales in last 30 days (delivered)
    const productSalesQty30 = new Map<string, number>();
    for (const order of last30Delivered) {
      for (const item of order.items || []) {
        if (item.product_id) {
          productSalesQty30.set(item.product_id, (productSalesQty30.get(item.product_id) || 0) + (item.quantity || 0));
        }
      }
    }

    const deadStock: InventoryRiskItem[] = [];
    const slowMoving: InventoryRiskItem[] = [];
    const fastMoving: InventoryRiskItem[] = [];

    for (const p of products) {
      const pVariants = productVariantsMap.get(p.id) || [];
      const totalProductStock = pVariants.reduce((s, v) => s + (v.stock_quantity || 0), 0);
      if (totalProductStock === 0) continue; // skip out of stock entirely

      const qtySold = productSalesQty30.get(p.id) || 0;
      const stockValue = pVariants.reduce((s, v) => s + (v.stock_quantity || 0) * (v.purchase_price || 0), 0);

      if (qtySold === 0) {
        deadStock.push({ name: p.name, stock: totalProductStock, stockValue });
      } else if (qtySold <= 5) {
        slowMoving.push({ name: p.name, stock: totalProductStock, qtySold });
      } else {
        const velocity = qtySold / 30;
        const daysToStockOut = velocity > 0 ? Math.round(totalProductStock / velocity) : 999;
        fastMoving.push({ name: p.name, stock: totalProductStock, qtySold, daysToStockOut });
      }
    }
    deadStock.sort((a, b) => b.stock - a.stock);
    slowMoving.sort((a, b) => (a.qtySold || 0) - (b.qtySold || 0));
    fastMoving.sort((a, b) => b.qtySold! - a.qtySold!);

    // ── 5. Smart Alerts ──
    const smartAlerts: SmartAlert[] = [];
    const lowStockProducts = variants.filter((v) => v.stock_quantity > 0 && v.stock_quantity < 25).length;
    if (lowStockProducts > 0) {
      smartAlerts.push({ type: "low_stock", message: `${lowStockProducts} products below 25 pcs`, value: lowStockProducts });
    }

    // Sales spike / drop detection
    const checkGrowth = (current: number, previous: number, threshold: number, period: string) => {
      if (previous === 0) return;
      const change = pctChange(current, previous);
      if (change > threshold) {
        smartAlerts.push({ type: "sales_spike", message: `${Math.round(change)}% growth`, value: Math.round(change), period });
      } else if (change < -threshold) {
        smartAlerts.push({ type: "sales_drop", message: `${Math.round(Math.abs(change))}% drop`, value: Math.round(Math.abs(change)), period });
      }
    };

    checkGrowth(todayMetrics.revenue, yesterdayMetrics.revenue, 30, "Today vs Yesterday");
    checkGrowth(periods.last7Days.revenue, prev7.revenue, 25, "Last 7d vs Prev 7d");
    checkGrowth(periods.last30Days.revenue, prev30.revenue, 20, "Last 30d vs Prev 30d");
    checkGrowth(last60Metrics.revenue, prev60.revenue, 20, "Last 60d vs Prev 60d");

    return {
      product: { totalProducts, activeProducts, inactiveProducts, totalVariants, totalCategories: categories.length, totalBrands: brands.length },
      stock: { totalStock, stockValuePurchase, stockValueSelling, lowStockCount, outOfStockCount },
      stockByCategory,
      periods,
      statusCounts,
      payment: { codCount: codOrders.length, mobileBankingCount: mobileBankingOrders.length, bankTransferCount: bankTransferOrders.length, codPendingAmount, methodRevenue },
      sales: { topProducts, topCategories, bestSize, bestColor },
      charts: { revenueLast7Days, revenueLast12Months },
      comparisons,
      performance,
      paymentRatio,
      inventoryHealth: {
        deadStock: deadStock.slice(0, 10),
        slowMoving: slowMoving.slice(0, 10),
        fastMoving: fastMoving.slice(0, 10),
      },
      smartAlerts,
    };
  }, [productData, orders, lookups]);

  return { analytics, isLoading: productsLoading || ordersLoading };
}
