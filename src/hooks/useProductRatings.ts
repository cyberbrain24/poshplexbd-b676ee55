import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductRating {
  count: number;
  average: number;
}

export const useProductRatings = (productIds: string[]) => {
  const ids = [...new Set(productIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: ["product-ratings", ids],
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("product_id, rating")
        .eq("is_approved", true)
        .in("product_id", ids);
      if (error) throw error;
      const map: Record<string, ProductRating> = {};
      for (const row of data ?? []) {
        const pid = (row as any).product_id as string;
        const r = (row as any).rating as number;
        if (!map[pid]) map[pid] = { count: 0, average: 0 };
        map[pid].count += 1;
        map[pid].average += r;
      }
      for (const pid in map) map[pid].average = map[pid].average / map[pid].count;
      return map;
    },
  });
};
