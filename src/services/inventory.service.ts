import { supabase } from "@/integrations/supabase/client";

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
  product_id: string | null;
  variant_id: string | null;
  shared_variant_id: string | null;
  quantity: number;
  purchase_price: number;
  created_at: string;
  product?: { id: string; name: string; sku: string } | null;
  variant?: { id: string; sku: string; color?: { name: string } | null; size?: { label: string } | null; material?: { name: string } | null } | null;
  shared_variant?: { id: string; sku: string; color?: { name: string } | null; size?: { label: string } | null; material?: { name: string } | null } | null;
}

export interface InventoryItemInput {
  product_id?: string;
  variant_id?: string;
  shared_variant_id?: string;
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
        product:products(id, name, sku),
        variant:product_variants(id, sku, color:colors(name), size:sizes(label), material:materials(name)),
        shared_variant:shared_variants(id, sku, color:colors(name), size:sizes(label), material:materials(name))
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
    product_id: item.product_id || null,
    variant_id: item.variant_id || null,
    shared_variant_id: item.shared_variant_id || null,
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
    product_id: item.product_id || null,
    variant_id: item.variant_id || null,
    shared_variant_id: item.shared_variant_id || null,
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
