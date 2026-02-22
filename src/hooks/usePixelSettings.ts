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
}

export const usePixelSettings = () => {
  return useQuery({
    queryKey: ["pixel-settings"],
    queryFn: async (): Promise<PixelSettings | null> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, meta_pixel_id, meta_pixel_enabled, meta_test_mode, meta_advanced_matching, meta_ecommerce_events_enabled")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as PixelSettings;
    },
  });
};

export const useUpdatePixelSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<PixelSettings> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from("site_settings")
        .update(rest as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pixel-settings"] });
      toast.success("Pixel settings saved");
    },
    onError: (err: Error) => {
      toast.error("Failed to save: " + err.message);
    },
  });
};
