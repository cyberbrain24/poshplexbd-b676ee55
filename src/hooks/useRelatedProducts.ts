import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

/**
 * Fetch related products based on category
 * Returns 6 products from the same category, excluding the current product
 */
export const useRelatedProducts = (
  productId: string | undefined,
  categoryId: string | null | undefined,
  limit = 6
) => {
  return useQuery({
    queryKey: ["related-products", productId, categoryId, limit],
    queryFn: async () => {
      if (!categoryId) {
        // If no category, fetch random active products
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            name,
            sku,
            product_type,
            base_price,
            is_active,
            category:categories(id, name),
            images:product_images(id, image_url, is_main, sort_order),
            variants:product_variants(id, selling_price, is_active)
          `)
          .eq("is_active", true)
          .neq("id", productId || "")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data as Product[];
      }

      // Fetch products from the same category
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          product_type,
          base_price,
          is_active,
          category:categories(id, name),
          images:product_images(id, image_url, is_main, sort_order),
          variants:product_variants(id, selling_price, is_active)
        `)
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .neq("id", productId || "")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // If not enough products in same category, supplement with others
      if (data.length < limit) {
        const remaining = limit - data.length;
        const existingIds = [productId, ...data.map((p) => p.id)].filter(Boolean);

        const { data: moreProducts, error: moreError } = await supabase
          .from("products")
          .select(`
            id,
            name,
            sku,
            product_type,
            base_price,
            is_active,
            category:categories(id, name),
            images:product_images(id, image_url, is_main, sort_order),
            variants:product_variants(id, selling_price, is_active)
          `)
          .eq("is_active", true)
          .not("id", "in", `(${existingIds.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(remaining);

        if (!moreError && moreProducts) {
          return [...data, ...moreProducts] as Product[];
        }
      }

      return data as Product[];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};
