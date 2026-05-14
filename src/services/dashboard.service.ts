/**
 * Dashboard Service — lightweight version.
 * Only fetches what the simple dashboard needs.
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
  // Last 31 days is enough for today / 7d / 30d / this month
  const since = new Date();
  since.setDate(since.getDate() - 31);

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_status,
      total_amount, subtotal, discount_amount, shipping_cost, created_at,
      items:order_items(quantity, line_total)
    `)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;
  return (data || []) as unknown as DashboardOrder[];
}
