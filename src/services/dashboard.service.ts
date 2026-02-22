/**
 * Dashboard Service
 * Fetches data for the admin dashboard analytics
 */

import { supabase } from "@/integrations/supabase/client";

export interface DashboardOrder {
  id: string;
  order_status: string;
  payment_status: string;
  payment_method_type: string | null;
  total_amount: number;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  customer_id: string | null;
  created_at: string;
  items: {
    id: string;
    product_id: string | null;
    variant_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

export interface DashboardProduct {
  id: string;
  name: string;
  is_active: boolean;
  category_id: string | null;
}

export interface DashboardVariant {
  id: string;
  product_id: string;
  stock_quantity: number;
  purchase_price: number;
  selling_price: number;
  low_stock_threshold: number;
  color_id: string | null;
  size_id: string | null;
  is_active: boolean;
}

export async function fetchDashboardProducts() {
  const [products, variants, categories, brands] = await Promise.all([
    supabase.from("products").select("id, name, is_active, category_id").limit(5000),
    supabase.from("product_variants").select("id, product_id, stock_quantity, purchase_price, selling_price, low_stock_threshold, color_id, size_id, is_active").limit(10000),
    supabase.from("categories").select("id, name, parent_id").limit(500),
    supabase.from("brands").select("id, name").limit(500),
  ]);

  return {
    products: (products.data || []) as DashboardProduct[],
    variants: (variants.data || []) as DashboardVariant[],
    categories: categories.data || [],
    brands: brands.data || [],
  };
}

export async function fetchDashboardOrders() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_status, payment_status, payment_method_type,
      total_amount, subtotal, discount_amount, shipping_cost,
      customer_id, created_at,
      items:order_items(id, product_id, variant_id, product_name, quantity, unit_price, line_total)
    `)
    .gte("created_at", twelveMonthsAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw error;
  return (data || []) as unknown as DashboardOrder[];
}

export async function fetchDashboardLookups() {
  const [colors, sizes] = await Promise.all([
    supabase.from("colors").select("id, name").limit(500),
    supabase.from("sizes").select("id, label").limit(500),
  ]);

  return {
    colors: colors.data || [],
    sizes: sizes.data || [],
  };
}
