import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductCategory {
  id: string;
  product_id: string;
  category_id: string;
  created_at: string;
}

/**
 * Fetch category IDs for a specific product
 */
export const useProductCategoryIds = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product-categories", productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_categories")
        .select("category_id")
        .eq("product_id", productId);
      if (error) throw error;
      return (data || []).map((r: any) => r.category_id as string);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Sync product categories: replaces all categories for a product
 * Also updates the legacy category_id on the products table for backward compat
 */
export const useSyncProductCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      categoryIds,
    }: {
      productId: string;
      categoryIds: string[];
    }) => {
      // 1. Delete existing entries
      const { error: delError } = await supabase
        .from("product_categories")
        .delete()
        .eq("product_id", productId);
      if (delError) throw delError;

      // 2. Insert new entries
      if (categoryIds.length > 0) {
        const rows = categoryIds.map((cid) => ({
          product_id: productId,
          category_id: cid,
        }));
        const { error: insError } = await supabase
          .from("product_categories")
          .insert(rows);
        if (insError) throw insError;
      }

      // 3. Update legacy category_id to first selected category (backward compat)
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
      const { error: updError } = await supabase
        .from("products")
        .update({ category_id: primaryCategoryId })
        .eq("id", productId);
      if (updError) throw updError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["products-optimized"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["category-products-optimized"] });
    },
  });
};
