import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

// Minimal fields for the "You might also like" card
const MINIMAL_SELECT = `
  id,
  name,
  base_price,
  category:categories(name),
  images:product_images(image_url, is_main),
  variants:product_variants(selling_price, is_active)
`;

/**
 * Fetch related products based on category
 * Only fetches minimal data needed for product cards
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
        const { data, error } = await supabase
          .from("products")
          .select(MINIMAL_SELECT)
          .eq("is_active", true)
          .neq("id", productId || "")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data as unknown as Product[];
      }

      const { data, error } = await supabase
        .from("products")
        .select(MINIMAL_SELECT)
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .neq("id", productId || "")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // If not enough products in same category, supplement with others
      if (data.length < limit) {
        const remaining = limit - data.length;
        const existingIds = [productId, ...data.map((p: any) => p.id)].filter(Boolean);

        const { data: moreProducts, error: moreError } = await supabase
          .from("products")
          .select(MINIMAL_SELECT)
          .eq("is_active", true)
          .not("id", "in", `(${existingIds.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(remaining);

        if (!moreError && moreProducts) {
          return [...data, ...moreProducts] as unknown as Product[];
        }
      }

      return data as unknown as Product[];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
