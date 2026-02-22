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

export interface ChartPoint {
  label: string;
  revenue: number;
  orders: number;
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
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
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
    const stockValuePurchase = variants.reduce(
      (s, v) => s + (v.stock_quantity || 0) * (v.purchase_price || 0),
      0
    );
    const stockValueSelling = variants.reduce(
      (s, v) => s + (v.stock_quantity || 0) * (v.selling_price || 0),
      0
    );
    const lowStockCount = variants.filter(
      (v) => v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold
    ).length;
    const outOfStockCount = variants.filter((v) => v.stock_quantity === 0).length;

    // ── Stock by Category ──
    const categoryMap = new Map(categories.map((c: any) => [c.id, c.name]));
    const productCategoryMap = new Map(products.map((p) => [p.id, p.category_id]));

    const catAgg = new Map<
      string,
      { name: string; products: Set<string>; variants: number; stock: number }
    >();
    for (const v of variants) {
      const catId = productCategoryMap.get(v.product_id) || "uncategorized";
      const catName = categoryMap.get(catId) || "Uncategorized";
      if (!catAgg.has(catId))
        catAgg.set(catId, { name: catName, products: new Set(), variants: 0, stock: 0 });
      const e = catAgg.get(catId)!;
      e.products.add(v.product_id);
      e.variants++;
      e.stock += v.stock_quantity || 0;
    }
    const stockByCategory: StockByCategory[] = Array.from(catAgg.values())
      .map((e) => ({
        name: e.name,
        totalProducts: e.products.size,
        totalVariants: e.variants,
        totalStock: e.stock,
      }))
      .sort((a, b) => b.totalStock - a.totalStock);

    // ── Variant lookup for cost ──
    const variantMap = new Map<string, DashboardVariant>(variants.map((v) => [v.id, v]));

    // ── Period helpers ──
    const computePeriod = (filtered: DashboardOrder[]): PeriodMetrics => {
      const totalOrders = filtered.length;
      const uniqueCustomers = new Set(filtered.map((o) => o.customer_id).filter(Boolean)).size;
      const totalAmount = filtered.reduce((s, o) => s + (o.total_amount || 0), 0);

      let totalQtySold = 0;
      let revenue = 0;
      let cost = 0;

      for (const order of filtered) {
        for (const item of order.items || []) {
          totalQtySold += item.quantity || 0;
        }
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

    const now = new Date();
    const today = startOfDay(now);
    const yesterday = daysAgo(1);
    const dayBefore = daysAgo(2);
    const last7 = daysAgo(7);
    const last30 = daysAgo(30);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const filterByDate = (from: Date, to?: Date) =>
      orders.filter((o) => {
        const d = new Date(o.created_at);
        return to ? d >= from && d < to : d >= from;
      });

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
    for (const o of orders) {
      statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;
    }

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

    // ── Sales Intelligence ──
    const last30Delivered = orders.filter(
      (o) => new Date(o.created_at) >= last30 && o.order_status === "delivered"
    );

    const productSales = new Map<string, TopItem>();
    const categorySales = new Map<string, TopItem>();

    for (const order of last30Delivered) {
      for (const item of order.items || []) {
        // Products
        const pKey = item.product_name || item.product_id || "Unknown";
        if (!productSales.has(pKey)) productSales.set(pKey, { name: item.product_name, qty: 0, revenue: 0 });
        const pe = productSales.get(pKey)!;
        pe.qty += item.quantity || 0;
        pe.revenue += item.line_total || 0;

        // Categories
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
      const mo = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= ms && d < me && o.order_status === "delivered";
      });
      revenueLast12Months.push({
        label: ms.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        revenue: mo.reduce((s, o) => s + (o.total_amount || 0), 0),
      });
    }

    return {
      product: { totalProducts, activeProducts, inactiveProducts, totalVariants, totalCategories: categories.length, totalBrands: brands.length },
      stock: { totalStock, stockValuePurchase, stockValueSelling, lowStockCount, outOfStockCount },
      stockByCategory,
      periods,
      statusCounts,
      payment: { codCount: codOrders.length, mobileBankingCount: mobileBankingOrders.length, bankTransferCount: bankTransferOrders.length, codPendingAmount, methodRevenue },
      sales: { topProducts, topCategories, bestSize, bestColor },
      charts: { revenueLast7Days, revenueLast12Months },
    };
  }, [productData, orders, lookups]);

  return { analytics, isLoading: productsLoading || ordersLoading };
}
