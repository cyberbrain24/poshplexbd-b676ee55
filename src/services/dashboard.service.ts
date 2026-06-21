/**
 * Dashboard Service — lightweight version.
 */

import { supabase } from "@/integrations/supabase/client";

export interface DashboardOrder {
  id: string;
  order_status: string;
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  created_at: string;
  items: { quantity: number; line_total: number }[];
}

export interface DashboardProductSummary {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalBrands: number;
}

export interface StatusTotal {
  count: number;
  amount: number;
}

export interface LifetimeTotals {
  orders: number;
  revenue: number;
  qty: number;
  statusTotals: Record<string, StatusTotal>;
}

export async function fetchDashboardProductSummary(): Promise<DashboardProductSummary> {
  const [products, categories, brands] = await Promise.all([
    supabase.from("products").select("id, is_active").limit(5000),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id", { count: "exact", head: true }),
  ]);

  const list = products.data || [];
  return {
    totalProducts: list.length,
    activeProducts: list.filter((p: any) => p.is_active).length,
    totalCategories: categories.count || 0,
    totalBrands: brands.count || 0,
  };
}

export async function fetchDashboardOrders() {
  // Last 35 days covers today / yesterday / dby / weekly / 30d / running month
  const since = new Date();
  since.setDate(since.getDate() - 35);

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_status,
      total_amount, subtotal, discount_amount, shipping_cost, created_at,
      items:order_items(quantity, line_total)
    `)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(3000);

  if (error) throw error;
  return (data || []) as unknown as DashboardOrder[];
}

export async function fetchLifetimeOrderTotals(): Promise<LifetimeTotals> {
  // Page through all orders, fetching minimal fields for lifetime aggregates.
  const pageSize = 1000;
  let from = 0;
  let revenue = 0;
  let qty = 0;
  let orders = 0;
  const statusTotals: Record<string, StatusTotal> = {};

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase
      .from("orders")
      .select(`id, order_status, total_amount, items:order_items(quantity)`)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data || []) as any[];
    for (const o of rows) {
      orders++;
      const status = o.order_status || "unknown";
      const amt = Number(o.total_amount) || 0;
      if (!statusTotals[status]) statusTotals[status] = { count: 0, amount: 0 };
      statusTotals[status].count++;
      statusTotals[status].amount += amt;
      if (status === "cancelled" || status === "returned") continue;
      revenue += amt;
      for (const it of o.items || []) qty += Number(it.quantity) || 0;
    }
    if (rows.length < pageSize) break;
    from += pageSize;
    if (from > 50000) break; // safety
  }
  return { orders, revenue, qty, statusTotals };
}

