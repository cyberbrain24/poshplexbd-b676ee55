import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ComboItem, Product } from "@/types/product";

/**
 * Fetch combo items for a parent combo product, with child product data
 * (basic info + images + variants) needed for storefront configuration.
 */
export const useComboItems = (comboProductId: string | undefined) => {
  return useQuery({
    queryKey: ["combo-items", comboProductId],
    enabled: !!comboProductId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combo_items")
        .select(`
          id, combo_product_id, child_product_id, quantity, sort_order,
          child:products!combo_items_child_product_id_fkey(
            id, name, sku, base_price, product_type, category_id,
            short_description,
            images:product_images(id, image_url, is_main, sort_order, color_id),
            variants:product_variants(
              id, sku, selling_price, is_active, image_url,
              color:colors(id, name, hex_code),
              size:sizes(id, label, sort_order),
              custom_variant:custom_variants(id, label, sort_order)
            )
          )
        `)
        .eq("combo_product_id", comboProductId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ComboItem[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export interface ComboItemInput {
  child_product_id: string;
  quantity: number;
  sort_order: number;
}

/**
 * Replace the complete combo_items set for a parent combo product
 * (diff: insert new, update changed, delete removed).
 */
export const useSyncComboItems = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      comboProductId,
      items,
    }: {
      comboProductId: string;
      items: ComboItemInput[];
    }) => {
      // Fetch existing rows
      const { data: existing, error: fetchErr } = await supabase
        .from("combo_items")
        .select("id, child_product_id, quantity, sort_order")
        .eq("combo_product_id", comboProductId);
      if (fetchErr) throw fetchErr;

      const existingByChild = new Map(
        (existing || []).map((r: any) => [r.child_product_id as string, r])
      );
      const incomingChildIds = new Set(items.map((i) => i.child_product_id));

      // Delete rows whose child no longer present
      const toDelete = (existing || [])
        .filter((r: any) => !incomingChildIds.has(r.child_product_id))
        .map((r: any) => r.id);
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("combo_items")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }

      // Upsert each incoming
      for (const item of items) {
        const prev = existingByChild.get(item.child_product_id);
        if (prev) {
          if (prev.quantity !== item.quantity || prev.sort_order !== item.sort_order) {
            const { error } = await supabase
              .from("combo_items")
              .update({ quantity: item.quantity, sort_order: item.sort_order })
              .eq("id", prev.id);
            if (error) throw error;
          }
        } else {
          const { error } = await supabase.from("combo_items").insert({
            combo_product_id: comboProductId,
            child_product_id: item.child_product_id,
            quantity: item.quantity,
            sort_order: item.sort_order,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["combo-items", vars.comboProductId] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

/**
 * Lightweight search of products eligible to be added as combo children.
 * Excludes combos themselves (no nested combos) and the parent product.
 */
export const useComboCandidateSearch = (query: string, excludeProductId?: string) => {
  return useQuery({
    queryKey: ["combo-candidates", query, excludeProductId],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const term = `%${query.trim()}%`;
      let q = supabase
        .from("products")
        .select(`
          id, name, sku, base_price, product_type,
          images:product_images(image_url, is_main, sort_order)
        `)
        .eq("is_active", true)
        .neq("product_type", "combo")
        .or(`name.ilike.${term},sku.ilike.${term}`)
        .order("name")
        .limit(8);
      if (excludeProductId) q = q.neq("id", excludeProductId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Product[];
    },
    staleTime: 1000 * 30,
  });
};
