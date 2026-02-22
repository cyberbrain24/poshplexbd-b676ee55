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
          category:categories(id, name),
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
