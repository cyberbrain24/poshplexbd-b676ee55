import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/utils/performance";
import type { SearchProduct } from "./useProductSearch";

interface AISuggestionResult {
  corrected_query: string | null;
  message: string | null;
  products: SearchProduct[];
}

export const useAISearchSuggest = (query: string, hasExactResults: boolean) => {
  const debouncedQuery = useDebounce(query.trim(), 600);

  return useQuery<AISuggestionResult>({
    queryKey: ["ai-search-suggest", debouncedQuery, hasExactResults],
    queryFn: async () => {
      const empty: AISuggestionResult = {
        corrected_query: null,
        message: null,
        products: [],
      };
      if (!debouncedQuery || debouncedQuery.length < 2) return empty;

      const { data, error } = await supabase.functions.invoke(
        "ai-search-suggest",
        { body: { query: debouncedQuery } },
      );
      if (error || !data) return empty;

      const ids: string[] = data.suggested_product_ids || [];
      if (ids.length === 0) {
        return {
          corrected_query: data.corrected_query || null,
          message: data.message || null,
          products: [],
        };
      }

      const { data: products } = await supabase
        .from("products")
        .select(
          `id, name, base_price,
          category:categories(id, name),
          images:product_images(id, image_url, is_main),
          variants:product_variants(id, selling_price, is_active)`,
        )
        .in("id", ids)
        .eq("is_active", true);

      // Preserve AI-ranked order
      const order = new Map(ids.map((id, i) => [id, i]));
      const sorted = ((products || []) as SearchProduct[]).sort(
        (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
      );

      return {
        corrected_query: data.corrected_query || null,
        message: data.message || null,
        products: sorted,
      };
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
