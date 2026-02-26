import { supabase } from "@/integrations/supabase/client";

export interface SharedVariant {
  id: string;
  color_id: string | null;
  size_id: string | null;
  material_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  sku: string;
  purchase_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  color?: { id: string; name: string; hex_code: string } | null;
  size?: { id: string; label: string } | null;
  material?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  subcategory?: { id: string; name: string } | null;
}

export const fetchSharedVariants = async () => {
  const { data, error } = await supabase
    .from("shared_variants")
    .select(`
      *,
      color:colors!shared_variants_color_id_fkey(id, name, hex_code),
      size:sizes!shared_variants_size_id_fkey(id, label),
      material:materials!shared_variants_material_id_fkey(id, name),
      category:categories!shared_variants_category_id_fkey(id, name),
      subcategory:categories!shared_variants_subcategory_id_fkey(id, name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as SharedVariant[];
};

export const createSharedVariant = async (input: {
  color_id?: string | null;
  size_id?: string | null;
  material_id?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  sku: string;
  purchase_price?: number;
  low_stock_threshold?: number;
}) => {
  const { data, error } = await supabase
    .from("shared_variants")
    .insert({
      color_id: input.color_id || null,
      size_id: input.size_id || null,
      material_id: input.material_id || null,
      category_id: input.category_id || null,
      subcategory_id: input.subcategory_id || null,
      sku: input.sku,
      purchase_price: input.purchase_price || 0,
      low_stock_threshold: input.low_stock_threshold || 5,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSharedVariant = async (
  id: string,
  input: {
    color_id?: string | null;
    size_id?: string | null;
    material_id?: string | null;
    category_id?: string | null;
    subcategory_id?: string | null;
    sku?: string;
    purchase_price?: number;
    low_stock_threshold?: number;
    is_active?: boolean;
  }
) => {
  const { error } = await supabase
    .from("shared_variants")
    .update(input)
    .eq("id", id);

  if (error) throw error;
};

export const deleteSharedVariant = async (id: string) => {
  const { error } = await supabase
    .from("shared_variants")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const formatSharedVariantLabel = (sv: SharedVariant) => {
  const parts: string[] = [];
  if (sv.sku) parts.push(sv.sku);
  if (sv.category?.name) parts.push(sv.category.name);
  if (sv.subcategory?.name) parts.push(sv.subcategory.name);
  if (sv.color?.name) parts.push(sv.color.name);
  if (sv.size?.label) parts.push(sv.size.label);
  if (sv.material?.name) parts.push(sv.material.name);
  return parts.join(" | ") || "Unnamed";
};
