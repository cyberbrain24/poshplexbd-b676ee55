import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductAttribute, ProductAttributeValue } from "@/types/productAttributes";

const STALE = 1000 * 60 * 5;
const GC = 1000 * 60 * 10;

// ---- Attributes (with nested values) ----
export const useProductAttributes = () => {
  return useQuery({
    queryKey: ["productAttributes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_attributes")
        .select(`*, values:product_attribute_values(*)`)
        .order("sort_order");
      if (error) throw error;
      const list = (data || []) as ProductAttribute[];
      // Sort nested values
      list.forEach((a) => {
        a.values = (a.values || []).sort((x, y) => x.sort_order - y.sort_order);
      });
      return list;
    },
    staleTime: STALE,
    gcTime: GC,
  });
};

export const useCreateAttribute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; sort_order?: number; is_active?: boolean }) => {
      const { data: res, error } = await (supabase as any)
        .from("product_attributes")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return res as ProductAttribute;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productAttributes"] }),
  });
};

export const useUpdateAttribute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; sort_order: number; is_active: boolean }> }) => {
      const { error } = await (supabase as any).from("product_attributes").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productAttributes"] }),
  });
};

export const useDeleteAttribute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("product_attributes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productAttributes"] }),
  });
};

// ---- Values ----
export const useCreateAttributeValue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { attribute_id: string; value: string; sort_order?: number }) => {
      const { data: res, error } = await (supabase as any)
        .from("product_attribute_values")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return res as ProductAttributeValue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productAttributes"] }),
  });
};

export const useUpdateAttributeValue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ value: string; sort_order: number; is_active: boolean }> }) => {
      const { error } = await (supabase as any).from("product_attribute_values").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productAttributes"] }),
  });
};

export const useDeleteAttributeValue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("product_attribute_values").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productAttributes"] }),
  });
};

// ---- Product applied attributes ----
export const useProductAppliedAttributeIds = (productId?: string) => {
  return useQuery({
    queryKey: ["productAppliedAttributes", productId],
    queryFn: async () => {
      if (!productId) return [] as string[];
      const { data, error } = await (supabase as any)
        .from("product_applied_attributes")
        .select("attribute_id")
        .eq("product_id", productId);
      if (error) throw error;
      return ((data || []) as Array<{ attribute_id: string }>).map((r) => r.attribute_id);
    },
    enabled: !!productId,
    staleTime: STALE,
  });
};

export const useSyncProductAttributes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, attributeIds }: { productId: string; attributeIds: string[] }) => {
      // Replace all assignments for this product
      const { error: delErr } = await (supabase as any)
        .from("product_applied_attributes")
        .delete()
        .eq("product_id", productId);
      if (delErr) throw delErr;

      if (attributeIds.length === 0) return;

      const rows = attributeIds.map((attribute_id, idx) => ({
        product_id: productId,
        attribute_id,
        sort_order: idx,
      }));
      const { error: insErr } = await (supabase as any)
        .from("product_applied_attributes")
        .insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["productAppliedAttributes", vars.productId] });
      qc.invalidateQueries({ queryKey: ["productAppliedFull"] });
    },
  });
};

// Fetch applied attributes for a product including the full attribute + values
export const useProductAppliedAttributesFull = (productId?: string) => {
  return useQuery({
    queryKey: ["productAppliedFull", productId],
    queryFn: async () => {
      if (!productId) return [] as ProductAttribute[];
      const { data, error } = await (supabase as any)
        .from("product_applied_attributes")
        .select(`sort_order, attribute:product_attributes(*, values:product_attribute_values(*))`)
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      const list = (data || []) as Array<{ sort_order: number; attribute: ProductAttribute }>;
      return list
        .map((r) => r.attribute)
        .filter((a) => a && a.is_active)
        .map((a) => ({
          ...a,
          values: (a.values || []).filter((v) => v.is_active).sort((x, y) => x.sort_order - y.sort_order),
        }));
    },
    enabled: !!productId,
    staleTime: STALE,
  });
};

// ---- Variant attribute values ----
// Fetch all variant-attribute-value rows for a product's variants
export const useProductVariantAttributeValues = (productId?: string) => {
  return useQuery({
    queryKey: ["productVariantAttributeValues", productId],
    queryFn: async () => {
      if (!productId) return {} as Record<string, Record<string, string>>;
      // Get variant ids first
      const { data: variants, error: vErr } = await (supabase as any)
        .from("product_variants")
        .select("id")
        .eq("product_id", productId);
      if (vErr) throw vErr;
      const variantIds = ((variants || []) as Array<{ id: string }>).map((v) => v.id);
      if (variantIds.length === 0) return {} as Record<string, Record<string, string>>;
      const { data, error } = await (supabase as any)
        .from("product_variant_attribute_values")
        .select("variant_id, attribute_id, attribute_value_id")
        .in("variant_id", variantIds);
      if (error) throw error;
      const map: Record<string, Record<string, string>> = {};
      for (const row of (data || []) as Array<{ variant_id: string; attribute_id: string; attribute_value_id: string }>) {
        if (!map[row.variant_id]) map[row.variant_id] = {};
        map[row.variant_id][row.attribute_id] = row.attribute_value_id;
      }
      return map;
    },
    enabled: !!productId,
    staleTime: STALE,
  });
};

// Replace all attribute value picks for a single variant
export const syncVariantAttributeValues = async (
  variantId: string,
  attributeValues: Record<string, string | null> | undefined,
  validAttributeIds: string[]
) => {
  const { error: delErr } = await (supabase as any)
    .from("product_variant_attribute_values")
    .delete()
    .eq("variant_id", variantId);
  if (delErr) throw delErr;
  if (!attributeValues) return;
  const rows = Object.entries(attributeValues)
    .filter(([attrId, valId]) => !!valId && validAttributeIds.includes(attrId))
    .map(([attribute_id, attribute_value_id]) => ({
      variant_id: variantId,
      attribute_id,
      attribute_value_id: attribute_value_id as string,
    }));
  if (rows.length === 0) return;
  const { error: insErr } = await (supabase as any)
    .from("product_variant_attribute_values")
    .insert(rows);
  if (insErr) throw insErr;
};
