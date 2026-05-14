import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchDashboardProductSummary,
  fetchDashboardOrders,
  type DashboardOrder,
  type DashboardProductSummary,
} from "@/services/dashboard.service";

export interface PeriodTotals {
  revenue: number;
  orders: number;
  qty: number;
}

export interface ChartPoint {
  label: string;
  revenue: number;
}

export interface DashboardAnalytics {
  product: DashboardProductSummary;
  today: PeriodTotals;
  last7Days: PeriodTotals;
  last30Days: PeriodTotals;
  thisMonth: PeriodTotals;
  statusCounts: Record<string, number>;
  revenueLast7Days: ChartPoint[];
}

const STATUS_KEYS = ["pending", "processing", "shipped", "delivered", "cancelled"];

function isCountedRevenue(o: DashboardOrder) {
  return o.order_status !== "cancelled" && o.order_status !== "returned";
}

function totalsFor(orders: DashboardOrder[]): PeriodTotals {
  let revenue = 0, qty = 0;
  for (const o of orders) {
    if (isCountedRevenue(o)) {
      revenue += Number(o.total_amount) || 0;
      for (const it of o.items || []) qty += Number(it.quantity) || 0;
    }
  }
  return { revenue, orders: orders.length, qty };
}

export function useDashboard() {
  const productQ = useQuery({
    queryKey: ["dashboard", "products"],
    queryFn: fetchDashboardProductSummary,
    staleTime: 5 * 60 * 1000,
  });

  const ordersQ = useQuery({
    queryKey: ["dashboard", "orders"],
    queryFn: fetchDashboardOrders,
    staleTime: 60 * 1000,
  });

  const analytics = useMemo<DashboardAnalytics | null>(() => {
    if (!productQ.data || !ordersQ.data) return null;
    const orders = ordersQ.data;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOf7d = startOfToday - 6 * 86400000;
    const startOf30d = startOfToday - 29 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const todayO: DashboardOrder[] = [];
    const w7: DashboardOrder[] = [];
    const w30: DashboardOrder[] = [];
    const month: DashboardOrder[] = [];
    const statusCounts: Record<string, number> = {};
    for (const k of STATUS_KEYS) statusCounts[k] = 0;

    // 7-day buckets
    const buckets = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }

    for (const o of orders) {
      const t = new Date(o.created_at).getTime();
      if (t >= startOfToday) todayO.push(o);
      if (t >= startOf7d) w7.push(o);
      if (t >= startOf30d) w30.push(o);
      if (t >= startOfMonth) month.push(o);

      if (statusCounts[o.order_status] !== undefined) statusCounts[o.order_status]++;

      if (t >= startOf7d && isCountedRevenue(o)) {
        const key = new Date(o.created_at).toISOString().slice(0, 10);
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + (Number(o.total_amount) || 0));
      }
    }

    const revenueLast7Days: ChartPoint[] = Array.from(buckets.entries()).map(([key, revenue]) => ({
      label: new Date(key).toLocaleDateString("en-US", { weekday: "short" }),
      revenue,
    }));

    return {
      product: productQ.data,
      today: totalsFor(todayO),
      last7Days: totalsFor(w7),
      last30Days: totalsFor(w30),
      thisMonth: totalsFor(month),
      statusCounts,
      revenueLast7Days,
    };
  }, [productQ.data, ordersQ.data]);

  return {
    analytics,
    isLoading: productQ.isLoading || ordersQ.isLoading,
    error: productQ.error || ordersQ.error,
  };
}
