import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/types/product";

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          is_active,
          is_featured,
          category:categories(id, name, is_active),
          images:product_images(id, image_url, thumb_url, medium_url, large_url, is_main, sort_order)
        `)
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      // Hide products whose category is inactive
      const filtered = (data || []).filter((p: any) => !p.category || p.category.is_active !== false).slice(0, 10);
      return filtered as Product[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
