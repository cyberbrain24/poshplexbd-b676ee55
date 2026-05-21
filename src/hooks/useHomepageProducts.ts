import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

/**
 * Lightweight hook for homepage product grid.
 * Fetches only 10 products with minimal fields — avoids pulling
 * the full useProducts() with all relations (variants, care instructions, etc.).
 */
export const useHomepageProducts = () => {
  return useQuery({
    queryKey: ["homepage-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          is_active,
          category:categories(id, name, is_active),
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      const filtered = (data || []).filter((p: any) => !p.category || p.category.is_active !== false).slice(0, 10);
      return filtered as Product[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
