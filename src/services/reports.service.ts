/**
 * Report data services — thin wrappers around supabase queries with date filtering.
 * Each function returns rows already shaped for the report table/export.
 */

import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import type { DateRange } from "@/pages/admin/reports/reports.types";

const iso = (d: Date) => d.toISOString();

/* ============================ Orders ============================ */

export interface OrderReportRow {
  order_number: string;
  date: string;
  customer: string;
  phone: string;
  status: string;
  payment_status: string;
  qty: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paid: number;
}

export async function fetchOrdersReport(range: DateRange): Promise<OrderReportRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      order_number, created_at, order_status, payment_status,
      shipping_name, shipping_phone,
      subtotal, shipping_cost, discount_amount, total_amount, paid_amount,
      items:order_items(quantity)
    `)
    .gte("created_at", iso(range.from))
    .lte("created_at", iso(range.to))
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data || []).map((o: any) => ({
    order_number: o.order_number,
    date: new Date(o.created_at).toLocaleString("en-BD"),
    customer: o.shipping_name || "—",
    phone: o.shipping_phone || "—",
    status: o.order_status,
    payment_status: o.payment_status,
    qty: (o.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0),
    subtotal: Number(o.subtotal) || 0,
    shipping: Number(o.shipping_cost) || 0,
    discount: Number(o.discount_amount) || 0,
    total: Number(o.total_amount) || 0,
    paid: Number(o.paid_amount) || 0,
  }));
}

/* =========================== Financial =========================== */

export interface FinancialReportRow {
  date: string;
  type: string;
  account: string;
  category: string;
  amount: number;
  reference: string;
}

export async function fetchFinancialReport(range: DateRange): Promise<FinancialReportRow[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      date, type, amount, notes,
      account:accounts(name),
      category:transaction_categories(name)
    `)
    .gte("date", iso(range.from))
    .lte("date", iso(range.to))
    .order("date", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data || []).map((t: any) => ({
    date: new Date(t.date).toLocaleDateString("en-BD"),
    type: t.type,
    account: t.account?.name || "—",
    category: t.category?.name || "—",
    amount: Number(t.amount) || 0,
    reference: t.notes || "—",
  }));
}

/* =========================== Customers =========================== */

export interface CustomerReportRow {
  name: string;
  phone: string;
  email: string;
  district: string;
  thana: string;
  created: string;
}

export async function fetchCustomersReport(range: DateRange): Promise<CustomerReportRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      name, phone, email, created_at,
      division:divisions(name),
      thana:thanas(name)
    `)
    .gte("created_at", iso(range.from))
    .lte("created_at", iso(range.to))
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data || []).map((c: any) => ({
    name: c.name || "—",
    phone: c.phone || "—",
    email: c.email || "—",
    district: c.division?.name || "—",
    thana: c.thana?.name || "—",
    created: new Date(c.created_at).toLocaleDateString("en-BD"),
  }));
}

/* ============================ Products =========================== */

export interface ProductReportRow {
  product: string;
  sku: string;
  qty_sold: number;
  revenue: number;
  orders: number;
}

export async function fetchProductsReport(range: DateRange): Promise<ProductReportRow[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select(`
      product_name, variant_sku, quantity, line_total,
      order:orders!inner(id, created_at, order_status)
    `)
    .gte("order.created_at", iso(range.from))
    .lte("order.created_at", iso(range.to))
    .limit(20000);
  if (error) throw error;

  // Aggregate per product+sku
  const map = new Map<string, ProductReportRow & { orderIds: Set<string> }>();
  (data || []).forEach((it: any) => {
    if (it.order?.order_status === "cancelled" || it.order?.order_status === "returned") return;
    const key = `${it.product_name}||${it.variant_sku || ""}`;
    const existing = map.get(key);
    const qty = Number(it.quantity) || 0;
    const rev = Number(it.line_total) || 0;
    if (existing) {
      existing.qty_sold += qty;
      existing.revenue += rev;
      existing.orderIds.add(it.order?.id);
    } else {
      const ids = new Set<string>();
      if (it.order?.id) ids.add(it.order.id);
      map.set(key, {
        product: it.product_name,
        sku: it.variant_sku || "—",
        qty_sold: qty,
        revenue: rev,
        orders: 0,
        orderIds: ids,
      });
    }
  });
  return Array.from(map.values())
    .map((r) => ({ ...r, orders: r.orderIds.size }))
    .sort((a, b) => b.revenue - a.revenue);
}

/* =========================== Inventory =========================== */

export interface InventoryReportRow {
  date: string;
  type: string;
  items: number;
  qty: number;
  total_cost: number;
  note: string;
}

export async function fetchInventoryReport(range: DateRange): Promise<InventoryReportRow[]> {
  const { data, error } = await supabase
    .from("inventory_entries")
    .select(`
      date, type, notes,
      items:inventory_entry_items(quantity, purchase_price)
    `)
    .gte("date", iso(range.from))
    .lte("date", iso(range.to))
    .order("date", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data || []).map((e: any) => {
    const items = e.items || [];
    return {
      date: new Date(e.date).toLocaleDateString("en-BD"),
      type: e.type || "—",
      items: items.length,
      qty: items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0),
      total_cost: items.reduce(
        (s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.purchase_price) || 0),
        0
      ),
      note: e.notes || "—",
    };
  });
}

/* ============================ Promos ============================ */

export interface PromoReportRow {
  code: string;
  type: string;
  usages: number;
  discount_given: number;
}

export async function fetchPromosReport(range: DateRange): Promise<PromoReportRow[]> {
  const { data, error } = await supabase
    .from("promo_code_usages")
    .select(`
      discount_amount, used_at,
      promo:promo_codes(code, discount_type)
    `)
    .gte("used_at", iso(range.from))
    .lte("used_at", iso(range.to))
    .limit(20000);
  if (error) throw error;
  const map = new Map<string, PromoReportRow>();
  (data || []).forEach((u: any) => {
    const code = u.promo?.code || "—";
    const type = u.promo?.discount_type || "—";
    const disc = Number(u.discount_amount) || 0;
    const ex = map.get(code);
    if (ex) {
      ex.usages++;
      ex.discount_given += disc;
    } else {
      map.set(code, { code, type, usages: 1, discount_given: disc });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.discount_given - a.discount_given);
}

/* ============================ Reviews =========================== */

export interface ReviewReportRow {
  product: string;
  customer: string;
  rating: number;
  status: string;
  date: string;
  comment: string;
}

export async function fetchReviewsReport(range: DateRange): Promise<ReviewReportRow[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      rating, status, comment, created_at,
      product:products(name),
      customer:customers(name)
    `)
    .gte("created_at", iso(range.from))
    .lte("created_at", iso(range.to))
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  return (data || []).map((r: any) => ({
    product: r.product?.name || "—",
    customer: r.customer?.name || "—",
    rating: Number(r.rating) || 0,
    status: r.status || "—",
    date: new Date(r.created_at).toLocaleDateString("en-BD"),
    comment: (r.comment || "").slice(0, 140),
  }));
}

/* ============================ Helpers ============================ */

export const money = (n: number) => formatCurrency(n);
