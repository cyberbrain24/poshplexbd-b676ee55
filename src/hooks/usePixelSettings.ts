import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PixelSettings {
  id: string;
  meta_pixel_id: string | null;
  meta_pixel_enabled: boolean;
  meta_test_mode: boolean;
  meta_advanced_matching: boolean;
  meta_ecommerce_events_enabled: boolean;
  meta_capi_enabled: boolean;
  meta_capi_access_token: string | null;
}

const SELECT_COLS =
  "id, meta_pixel_id, meta_pixel_enabled, meta_test_mode, meta_advanced_matching, meta_ecommerce_events_enabled, meta_capi_enabled, meta_capi_access_token";

export const usePixelSettings = () => {
  return useQuery({
    queryKey: ["pixel-settings"],
    queryFn: async (): Promise<PixelSettings | null> => {
      const { data, error } = await (supabase as any)
        .from("site_settings")
        .select(SELECT_COLS)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PixelSettings | null;
    },
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 30, // 30 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useUpdatePixelSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<PixelSettings> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await (supabase as any)
        .from("site_settings")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pixel-settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-site-settings"] });
      toast.success("Settings saved");
    },
    onError: (err: Error) => {
      toast.error("Failed to save: " + err.message);
    },
  });
};
