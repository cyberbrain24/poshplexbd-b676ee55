/**
 * Single shared React Query for `site_settings` public columns.
 * Consolidates what used to be two independent fetches per page load
 * (typography + pixel settings) into one request, cached aggressively
 * in memory + localStorage so it does NOT hit the DB on every page.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicSiteSettings {
  id: string;
  typography: any | null;
  meta_pixel_id: string | null;
  meta_pixel_enabled: boolean | null;
  meta_test_mode: boolean | null;
  meta_advanced_matching: boolean | null;
  meta_ecommerce_events_enabled: boolean | null;
  meta_capi_enabled: boolean | null;
}

const SELECT_COLS =
  "id, typography, meta_pixel_id, meta_pixel_enabled, meta_test_mode, meta_advanced_matching, meta_ecommerce_events_enabled, meta_capi_enabled";

const CACHE_KEY = "pp_site_settings_v1";
const CACHE_TTL = 60 * 60 * 1000; // 60 min

function readCache(): PublicSiteSettings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data as PublicSiteSettings;
  } catch {
    return null;
  }
}

function writeCache(data: PublicSiteSettings | null) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* ignore */ }
}

export const SITE_SETTINGS_QUERY_KEY = ["site-settings-public"] as const;

export const useSiteSettings = () => {
  return useQuery<PublicSiteSettings | null>({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select(SELECT_COLS)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      writeCache(data as any);
      return (data as any) ?? null;
    },
    initialData: () => readCache() ?? undefined,
    staleTime: 60 * 60 * 1000, // 60 min
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
