import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/utils/performance";

export interface SearchProduct {
  id: string;
  name: string;
  base_price: number;
  category: { id: string; name: string } | null;
  images: { id: string; image_url: string; is_main: boolean }[];
  variants: { id: string; selling_price: number; is_active: boolean }[];
}

export const useProductSearch = (query: string) => {
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: ["product-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const searchTerms = debouncedQuery.split(/\s+/).filter(Boolean);
      
      // Build ilike filter: each term must appear in name or sku
      // For simplicity, use OR across name and sku for the full query
      const searchFilter = `name.ilike.%${debouncedQuery}%,sku.ilike.%${debouncedQuery}%`;

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          category:categories(id, name),
          images:product_images(id, image_url, is_main),
          variants:product_variants(id, selling_price, is_active)
        `)
        .eq("is_active", true)
        .or(searchFilter)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data || []) as SearchProduct[];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};

export const usePopularCategories = () => {
  return useQuery({
    queryKey: ["popular-parent-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .is("parent_id", null)
        .order("name")
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
};
