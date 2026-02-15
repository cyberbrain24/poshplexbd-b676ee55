/**
 * Storefront Data Prefetching
 * Only prefetches categories on initial load (needed for nav).
 * Payment methods and divisions are deferred until after page is interactive.
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
    // Categories needed immediately for nav
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

    // Defer non-critical data until idle
    const deferPrefetch = () => {
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
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(deferPrefetch, { timeout: 5000 });
    } else {
      setTimeout(deferPrefetch, 3000);
    }
  }, [queryClient]);
}
