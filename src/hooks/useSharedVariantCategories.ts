import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch category IDs for a specific shared variant
 */
export const useSharedVariantCategoryIds = (sharedVariantId: string | undefined) => {
  return useQuery({
    queryKey: ["shared-variant-categories", sharedVariantId],
    queryFn: async () => {
      if (!sharedVariantId) return [];
      const { data, error } = await supabase
        .from("shared_variant_categories")
        .select("category_id")
        .eq("shared_variant_id", sharedVariantId);
      if (error) throw error;
      return (data || []).map((r: any) => r.category_id as string);
    },
    enabled: !!sharedVariantId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Sync shared variant categories: replaces all categories for a shared variant
 * Also updates legacy category_id and subcategory_id on shared_variants table
 */
export const useSyncSharedVariantCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sharedVariantId,
      categoryIds,
    }: {
      sharedVariantId: string;
      categoryIds: string[];
    }) => {
      // 1. Delete existing entries
      const { error: delError } = await supabase
        .from("shared_variant_categories")
        .delete()
        .eq("shared_variant_id", sharedVariantId);
      if (delError) throw delError;

      // 2. Insert new entries
      if (categoryIds.length > 0) {
        const rows = categoryIds.map((cid) => ({
          shared_variant_id: sharedVariantId,
          category_id: cid,
        }));
        const { error: insError } = await supabase
          .from("shared_variant_categories")
          .insert(rows);
        if (insError) throw insError;
      }

      // 3. Update legacy category_id/subcategory_id for backward compat
      // Find the first parent category and first subcategory from selected IDs
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from("categories")
          .select("id, parent_id")
          .in("id", categoryIds);
        
        const parentCat = cats?.find((c) => !c.parent_id);
        const subCat = cats?.find((c) => c.parent_id);
        
        const { error: updError } = await supabase
          .from("shared_variants")
          .update({
            category_id: parentCat?.id || subCat?.id || null,
            subcategory_id: subCat?.id || null,
          })
          .eq("id", sharedVariantId);
        if (updError) throw updError;
      } else {
        const { error: updError } = await supabase
          .from("shared_variants")
          .update({ category_id: null, subcategory_id: null })
          .eq("id", sharedVariantId);
        if (updError) throw updError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-variant-categories"] });
      queryClient.invalidateQueries({ queryKey: ["shared-variants"] });
    },
  });
};
