import { supabase } from "@/integrations/supabase/client";

/* ─── Inventory Products (independent from store products) ─── */

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  unit: string;
  purchase_price: number;
  current_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryProductInput {
  name: string;
  sku?: string;
  unit?: string;
  purchase_price?: number;
  is_active?: boolean;
}

export const fetchInventoryProducts = async () => {
  const { data, error } = await supabase
    .from("inventory_products")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as InventoryProduct[];
};

export const createInventoryProduct = async (input: InventoryProductInput) => {
  const { data, error } = await supabase
    .from("inventory_products")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as InventoryProduct;
};

export const updateInventoryProduct = async (id: string, input: InventoryProductInput) => {
  const { data, error } = await supabase
    .from("inventory_products")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as InventoryProduct;
};

export const deleteInventoryProduct = async (id: string) => {
  // Check if used in any inventory entry items
  const { count } = await supabase
    .from("inventory_entry_items")
    .select("id", { count: "exact", head: true })
    .eq("inventory_product_id", id);
  if (count && count > 0) {
    throw new Error(`Cannot delete: this product is used in ${count} inventory entries.`);
  }
  const { error } = await supabase.from("inventory_products").delete().eq("id", id);
  if (error) throw error;
};

/* ─── Inventory Entries ─── */

export interface InventoryEntry {
  id: string;
  type: "in" | "out";
  date: string;
  notes: string | null;
  account_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  transaction_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  account?: { id: string; name: string } | null;
  category?: { id: string; name: string; type: string } | null;
  subcategory?: { id: string; name: string; type: string } | null;
  items?: InventoryEntryItem[];
}

export interface InventoryEntryItem {
  id: string;
  entry_id: string;
  inventory_product_id: string;
  quantity: number;
  purchase_price: number;
  created_at: string;
  inventory_product?: InventoryProduct | null;
}

export interface InventoryItemInput {
  inventory_product_id: string;
  quantity: number;
  purchase_price?: number;
}

export const fetchInventoryEntries = async (type: "in" | "out") => {
  const { data, error } = await supabase
    .from("inventory_entries")
    .select(`
      *,
      account:accounts(id, name),
      category:transaction_categories!inventory_entries_category_id_fkey(id, name, type),
      subcategory:transaction_categories!inventory_entries_subcategory_id_fkey(id, name, type),
      items:inventory_entry_items(
        *,
        inventory_product:inventory_products(*)
      )
    `)
    .eq("type", type)
    .order("date", { ascending: false });

  if (error) throw error;
  return data as unknown as InventoryEntry[];
};

export const createInventoryEntry = async (
  entry: { type: "in" | "out"; date: string; notes?: string; account_id?: string | null; category_id?: string | null; subcategory_id?: string | null },
  items: InventoryItemInput[]
) => {
  const totalAmount = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.purchase_price || 0), 0);

  let transactionId: string | null = null;

  // Auto-create expense transaction for inventory-in if account is selected
  if (entry.type === "in" && entry.account_id && totalAmount > 0) {
    const { data: txn, error: txnError } = await supabase
      .from("transactions")
      .insert({
        account_id: entry.account_id,
        category_id: entry.subcategory_id || entry.category_id || null,
        type: "expense",
        amount: totalAmount,
        date: entry.date,
        notes: `Inventory In: ${entry.notes || "Stock purchase"}`,
      })
      .select()
      .single();

    if (txnError) throw txnError;
    transactionId = txn.id;
  }

  const { data: entryData, error: entryError } = await supabase
    .from("inventory_entries")
    .insert({
      type: entry.type,
      date: entry.date,
      notes: entry.notes || null,
      account_id: entry.account_id || null,
      category_id: entry.category_id || null,
      subcategory_id: entry.subcategory_id || null,
      transaction_id: transactionId,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  const itemsToInsert = items.map((item) => ({
    entry_id: entryData.id,
    inventory_product_id: item.inventory_product_id,
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
  entry: { date: string; notes?: string; account_id?: string | null; category_id?: string | null; subcategory_id?: string | null },
  items: InventoryItemInput[]
) => {
  const totalAmount = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.purchase_price || 0), 0);

  const { data: existing } = await supabase
    .from("inventory_entries")
    .select("transaction_id, type")
    .eq("id", id)
    .single();

  let transactionId = existing?.transaction_id || null;

  if (existing?.type === "in") {
    if (entry.account_id && totalAmount > 0) {
      if (transactionId) {
        await supabase
          .from("transactions")
          .update({
            account_id: entry.account_id,
            category_id: entry.subcategory_id || entry.category_id || null,
            amount: totalAmount,
            date: entry.date,
            notes: `Inventory In: ${entry.notes || "Stock purchase"}`,
          })
          .eq("id", transactionId);
      } else {
        const { data: txn, error: txnError } = await supabase
          .from("transactions")
          .insert({
            account_id: entry.account_id,
            category_id: entry.subcategory_id || entry.category_id || null,
            type: "expense",
            amount: totalAmount,
            date: entry.date,
            notes: `Inventory In: ${entry.notes || "Stock purchase"}`,
          })
          .select()
          .single();
        if (txnError) throw txnError;
        transactionId = txn.id;
      }
    } else if (transactionId && !entry.account_id) {
      await supabase.from("transactions").delete().eq("id", transactionId);
      transactionId = null;
    }
  }

  const { error: entryError } = await supabase
    .from("inventory_entries")
    .update({
      date: entry.date,
      notes: entry.notes || null,
      account_id: entry.account_id || null,
      category_id: entry.category_id || null,
      subcategory_id: entry.subcategory_id || null,
      transaction_id: transactionId,
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
    inventory_product_id: item.inventory_product_id,
    quantity: item.quantity,
    purchase_price: item.purchase_price || 0,
  }));

  const { error: itemsError } = await supabase
    .from("inventory_entry_items")
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;
};

export const deleteInventoryEntry = async (id: string) => {
  const { data: existing } = await supabase
    .from("inventory_entries")
    .select("transaction_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("inventory_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;

  if (existing?.transaction_id) {
    await supabase.from("transactions").delete().eq("id", existing.transaction_id);
  }
};
