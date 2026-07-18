import { supabase } from "@/integrations/supabase/client";

export interface InventoryEntry {
  id: string;
  type: "in" | "out";
  date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: InventoryEntryItem[];
}

export interface InventoryEntryItem {
  id: string;
  entry_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  purchase_price: number;
  created_at: string;
  product?: { id: string; name: string; sku: string } | null;
  variant?: { id: string; sku: string; color?: { name: string } | null; size?: { label: string } | null; material?: { name: string } | null } | null;
}

export interface InventoryItemInput {
  product_id: string;
  variant_id: string;
  quantity: number;
  purchase_price?: number;
}

export const fetchInventoryEntries = async (type: "in" | "out") => {
  const { data, error } = await supabase
    .from("inventory_entries")
    .select(`
      *,
      items:inventory_entry_items(
        *,
        product:products(id, name, sku),
        variant:product_variants(id, sku, color:colors(name), size:sizes(label), material:materials(name))
      )
    `)
    .eq("type", type)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as unknown as InventoryEntry[];
};

export const createInventoryEntry = async (
  entry: { type: "in" | "out"; date: string; notes?: string },
  items: InventoryItemInput[]
) => {
  const { data: entryData, error: entryError } = await supabase
    .from("inventory_entries")
    .insert({
      type: entry.type,
      date: entry.date,
      notes: entry.notes || null,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  const itemsToInsert = items.map((item) => ({
    entry_id: entryData.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    purchase_price: item.purchase_price || 0,
  }));

  const { error: itemsError } = await supabase
    .from("inventory_entry_items")
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  return entryData;
};

export const updateInventoryEntry = async (
  id: string,
  entry: { date: string; notes?: string },
  items: InventoryItemInput[]
) => {
  const { error: entryError } = await supabase
    .from("inventory_entries")
    .update({
      date: entry.date,
      notes: entry.notes || null,
    })
    .eq("id", id);

  if (entryError) throw entryError;

  const { error: delError } = await supabase
    .from("inventory_entry_items")
    .delete()
    .eq("entry_id", id);

  if (delError) throw delError;

  const itemsToInsert = items.map((item) => ({
    entry_id: id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    purchase_price: item.purchase_price || 0,
  }));

  const { error: itemsError } = await supabase
    .from("inventory_entry_items")
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;
};

export const deleteInventoryEntry = async (id: string) => {
  const { error } = await supabase
    .from("inventory_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
