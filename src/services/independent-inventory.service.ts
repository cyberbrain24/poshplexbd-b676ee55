import { supabase } from "@/integrations/supabase/client";

export interface InvProduct {
  id: string;
  name: string;
  sku: string;
  purchase_price: number;
  unit: string;
  current_stock: number;
  is_active: boolean;
  image_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
  subcategory?: { id: string; name: string } | null;
}

export interface InvProductInput {
  name: string;
  sku?: string;
  purchase_price?: number;
  unit?: string;
  image_url?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  is_active?: boolean;
}

export interface StockMovement {
  inventory_product_id: string;
  quantity: number;
  purchase_price: number;
}

/* ── Fetch inventory categories ── */
export interface InvCategory {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export const fetchInvCategories = async () => {
  const { data, error } = await supabase
    .from("inventory_categories")
    .select("id, name, parent_id, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data as InvCategory[];
};

export const createInvCategory = async (input: { name: string; parent_id?: string | null }) => {
  const { data, error } = await supabase.from("inventory_categories").insert(input).select().single();
  if (error) throw error;
  return data;
};

export const updateInvCategory = async (id: string, input: { name: string; parent_id?: string | null }) => {
  const { error } = await supabase.from("inventory_categories").update(input).eq("id", id);
  if (error) throw error;
};

export const deleteInvCategory = async (id: string) => {
  const { error } = await supabase.from("inventory_categories").update({ is_active: false }).eq("id", id);
  if (error) throw error;
};

/* ── Fetch products ── */
export const fetchInvProducts = async (categoryId?: string, subcategoryId?: string) => {
  let query = supabase
    .from("inventory_products")
    .select(`
      *,
      category:inventory_categories!inventory_products_category_id_fkey(id, name),
      subcategory:inventory_categories!inventory_products_subcategory_id_fkey(id, name)
    `)
    .eq("is_active", true)
    .order("name");

  if (subcategoryId) {
    query = query.eq("subcategory_id", subcategoryId);
  } else if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as InvProduct[];
};

/* ── CRUD ── */
export const createInvProduct = async (input: InvProductInput) => {
  const { data, error } = await supabase
    .from("inventory_products")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateInvProduct = async (id: string, input: Partial<InvProductInput>) => {
  const { error } = await supabase.from("inventory_products").update(input).eq("id", id);
  if (error) throw error;
};

export const deleteInvProduct = async (id: string) => {
  const { error } = await supabase.from("inventory_products").update({ is_active: false }).eq("id", id);
  if (error) throw error;
};

/* ── Bulk Stock In/Out ── */
export const bulkStockMovement = async (
  type: "in" | "out",
  items: StockMovement[],
  date: string,
  notes?: string
) => {
  // Create entry header
  const { data: entry, error: entryErr } = await supabase
    .from("inventory_entries")
    .insert({ type, date, notes: notes || null })
    .select()
    .single();
  if (entryErr) throw entryErr;

  // Create entry items (triggers will update stock)
  const rows = items.map((i) => ({
    entry_id: entry.id,
    inventory_product_id: i.inventory_product_id,
    quantity: i.quantity,
    purchase_price: i.purchase_price,
  }));

  const { error: itemsErr } = await supabase.from("inventory_entry_items").insert(rows);
  if (itemsErr) throw itemsErr;

  return entry;
};

/* ── Stock Report (individual entries) ── */
export interface StockReportRow {
  entry_id: string;
  date: string;
  type: "in" | "out";
  notes: string | null;
  product_name: string;
  product_sku: string;
  quantity: number;
  purchase_price: number;
  line_total: number;
}

export const fetchStockReport = async (from: string, to: string) => {
  const { data, error } = await supabase
    .from("inventory_entries")
    .select(`
      id, type, date, notes,
      items:inventory_entry_items(
        quantity, purchase_price,
        inv_product:inventory_products(name, sku)
      )
    `)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false });

  if (error) throw error;

  const rows: StockReportRow[] = [];
  for (const entry of data as any[]) {
    for (const item of entry.items || []) {
      const p = item.inv_product;
      if (!p) continue;
      const qty = item.quantity || 0;
      const price = item.purchase_price || 0;
      rows.push({
        entry_id: entry.id,
        date: entry.date,
        type: entry.type,
        notes: entry.notes,
        product_name: p.name,
        product_sku: p.sku || "",
        quantity: qty,
        purchase_price: price,
        line_total: qty * price,
      });
    }
  }

  return rows;
};
