/**
 * ERP Module Data Prefetching
 * Prefetches commonly accessed module data on admin panel load
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Cache configurations for different data types
const CACHE_CONFIG = {
  reference: { staleTime: 1000 * 60 * 15, gcTime: 1000 * 60 * 60 }, // 15min stale, 1hr cache
  master: { staleTime: 1000 * 60 * 10, gcTime: 1000 * 60 * 30 },    // 10min stale, 30min cache
  live: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 10 },       // 2min stale, 10min cache
};

/**
 * Prefetch core ERP reference data on admin panel mount
 * This populates the cache so modules load instantly
 */
export function useERPDataPrefetch(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const prefetchReferenceData = async () => {
      // High priority - used across many modules
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ["colors"],
          queryFn: async () => {
            const { data, error } = await supabase.from("colors").select("*").order("name");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.reference,
        }),
        queryClient.prefetchQuery({
          queryKey: ["sizes"],
          queryFn: async () => {
            const { data, error } = await supabase.from("sizes").select("*").order("sort_order");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.reference,
        }),
        queryClient.prefetchQuery({
          queryKey: ["categories"],
          queryFn: async () => {
            const { data, error } = await supabase.from("categories").select("*").order("name");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.reference,
        }),
      ]);
    };

    const prefetchMasterData = async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ["brands"],
          queryFn: async () => {
            const { data, error } = await supabase.from("brands").select("*").order("name");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.reference,
        }),
        queryClient.prefetchQuery({
          queryKey: ["materials"],
          queryFn: async () => {
            const { data, error } = await supabase.from("materials").select("*").order("name");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.reference,
        }),
        queryClient.prefetchQuery({
          queryKey: ["divisions"],
          queryFn: async () => {
            const { data, error } = await supabase.from("divisions").select("*").order("name");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.master,
        }),
        queryClient.prefetchQuery({
          queryKey: ["customer_types"],
          queryFn: async () => {
            const { data, error } = await supabase.from("customer_types").select("*").order("name");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.master,
        }),
        queryClient.prefetchQuery({
          queryKey: ["payment_methods"],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("payment_methods")
              .select("*")
              .eq("is_active", true)
              .order("sort_order");
            if (error) throw error;
            return data;
          },
          ...CACHE_CONFIG.master,
        }),
      ]);
    };

    // Execute in priority order
    prefetchReferenceData();
    // Delay secondary batch to avoid connection overload
    const timer = setTimeout(prefetchMasterData, 500);

    return () => clearTimeout(timer);
  }, [queryClient]);
}

/**
 * Hook to prefetch data for a specific module before navigation
 */
export function usePrefetchModule() {
  const queryClient = useQueryClient();

  const prefetchProducts = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["products"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, sku, product_type, base_price, is_active, created_at,
            category:categories(id, name),
            brand:brands(id, name),
            images:product_images(id, image_url, is_main, sort_order)
          `)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return data;
      },
      ...CACHE_CONFIG.live,
    });
  };

  const prefetchOrders = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["orders-stats"],
      queryFn: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [totalResult, todayResult, pendingResult] = await Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
          supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending_verification"),
        ]);
        
        return {
          totalOrders: totalResult.count || 0,
          todayOrders: todayResult.count || 0,
          pendingVerification: pendingResult.count || 0,
        };
      },
      ...CACHE_CONFIG.live,
    });
  };

  const prefetchCustomers = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["customers-count"],
      queryFn: async () => {
        const { count, error } = await supabase
          .from("customers")
          .select("id", { count: "exact", head: true });
        if (error) throw error;
        return count || 0;
      },
      ...CACHE_CONFIG.live,
    });
  };

  return {
    prefetchProducts,
    prefetchOrders,
    prefetchCustomers,
  };
}
