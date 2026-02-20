/**
 * Storefront Data Prefetching
 * Prefetches commonly accessed storefront data on public page load
 * Non-disruptive: only populates cache, no effect on existing hooks
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STOREFRONT_CACHE = {
  staleTime: 1000 * 60 * 15, // 15 min
  gcTime: 1000 * 60 * 60,    // 1 hr
};

export function useStorefrontPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch site branding FIRST — unblocks the LCP hero image URL
    queryClient.prefetchQuery({
      queryKey: ["site-branding"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("site_branding")
          .select("*")
          .single();
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10, // match useSiteBranding staleTime
      gcTime: 1000 * 60 * 60,
    });

    // Prefetch categories (used in nav, filters, product pages)
    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, image_url, parent_id")
          .order("name");
        if (error) throw error;
        return data;
      },
      ...STOREFRONT_CACHE,
    });

    // Prefetch active payment methods (used in checkout)
    queryClient.prefetchQuery({
      queryKey: ["payment_methods"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("payment_methods")
          .select("id, name, type, instructions, account_details, sort_order")
          .eq("is_active", true)
          .order("sort_order");
        if (error) throw error;
        return data;
      },
      ...STOREFRONT_CACHE,
    });

    // Prefetch active divisions (used in checkout address form)
    queryClient.prefetchQuery({
      queryKey: ["divisions-public"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("divisions")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        if (error) throw error;
        return data;
      },
      ...STOREFRONT_CACHE,
    });
  }, [queryClient]);
}
