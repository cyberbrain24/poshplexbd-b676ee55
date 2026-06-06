import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReviewLookData } from "@/components/reviews/ReviewLookCard";

export const useFeaturedReviews = (limit = 8) => {
  return useQuery({
    queryKey: ["featured-reviews", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id, product_id, rating, title, content, images, created_at, customer_id, reviewer_name,
          customer:customers(name),
          product:products(id, name, product_images(image_url, is_main))
        `)
        .eq("is_approved", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewLookData[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAllPublicReviews = (limit = 60) => {
  return useQuery({
    queryKey: ["all-public-reviews", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id, product_id, rating, title, content, images, created_at, customer_id, reviewer_name, is_featured,
          customer:customers(name),
          product:products(id, name, product_images(image_url, is_main))
        `)
        .eq("is_approved", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as (ReviewLookData & { is_featured: boolean })[];
    },
    staleTime: 1000 * 60 * 2,
  });
};
