import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SiteBranding {
  id: string;
  site_name: string;
  slogan: string;
  logo_url: string | null;
  desktop_hero_url: string | null;
  mobile_hero_url: string | null;
  hero_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useSiteBranding = () => {
  return useQuery({
    queryKey: ["site-branding"],
    queryFn: async (): Promise<SiteBranding> => {
      const { data, error } = await (supabase as any)
        .from("site_branding")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 60, // 1 h
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useUpdateSiteBranding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<SiteBranding> & { id: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await (supabase as any)
        .from("site_branding")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-branding"] });
      toast.success("Site branding updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update branding");
    },
  });
};

export const useUploadBrandingAsset = () => {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) => {
      // Auto-convert raster images to WebP under 250KB; SVGs/non-images pass through
      let toUpload: File = file;
      let finalPath = path;
      if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
        try {
          const { toWebpUnder250 } = await import("@/lib/imageToWebp");
          toUpload = await toWebpUnder250(file);
          finalPath = path.replace(/\.[^.]+$/, "") + ".webp";
        } catch {
          toUpload = file;
        }
      }
      const { error } = await supabase.storage
        .from("media")
        .upload(finalPath, toUpload, { upsert: true, contentType: toUpload.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(finalPath);
      return urlData.publicUrl;
    },
    onError: (err: any) => {
      toast.error(err.message || "Upload failed");
    },
  });
};
