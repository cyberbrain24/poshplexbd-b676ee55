/**
 * Storefront Data Prefetching
 * Only prefetches categories on initial load (needed for nav).
 * Payment methods & divisions are deferred until checkout is visited.
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
    // Only prefetch categories (needed for mega menu nav)
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
  }, [queryClient]);
}

/**
 * Checkout-specific prefetch — call only on checkout page
 */
export function useCheckoutPrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
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
  }, [queryClient]);
}
