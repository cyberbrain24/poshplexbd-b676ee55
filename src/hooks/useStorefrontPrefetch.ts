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
    // Only prefetch branding globally — it unblocks the LCP hero image URL
    queryClient.prefetchQuery({
      queryKey: ["site-branding"],
      queryFn: async () => {
        const pre = (window as any).__ppPreload?.branding as Promise<any> | undefined;
        if (pre) {
          const arr = await pre;
          const row = Array.isArray(arr) ? arr[0] : arr;
          if (row) return row;
        }
        const { data, error } = await supabase
          .from("site_branding")
          .select("*")
          .single();
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60,
    });

    // Categories are used in nav, so still prefetch globally
    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        const pre = (window as any).__ppPreload?.categories as Promise<any> | undefined;
        if (pre) {
          const arr = await pre;
          if (arr) return arr;
        }
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, image_url, parent_id")
          .order("name");
        if (error) throw error;
        return data;
      },
      ...STOREFRONT_CACHE,
    });

    // Payment methods & divisions moved to Checkout page only
  }, [queryClient]);
}
