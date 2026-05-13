import { supabase } from "@/integrations/supabase/client";

export interface SeoPage {
  id: string;
  route_path: string;
  entity_type: string;
  entity_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  og_type: string | null;
  twitter_card: string | null;
  focus_keyword: string | null;
  keywords: string[] | null;
  robots_index: boolean;
  robots_follow: boolean;
  json_ld: any;
  sitemap_priority: number | null;
  sitemap_changefreq: string | null;
  sitemap_include: boolean;
  notes: string | null;
  updated_at: string;
}

export const SITE_URL = "https://poshplexbd.com";

export const seoService = {
  async getByPath(path: string): Promise<SeoPage | null> {
    const { data } = await supabase
      .from("seo_pages")
      .select("*")
      .eq("route_path", path)
      .maybeSingle();
    return (data as any) ?? null;
  },

  async list(): Promise<SeoPage[]> {
    const { data, error } = await supabase
      .from("seo_pages")
      .select("*")
      .order("route_path");
    if (error) throw error;
    return (data ?? []) as any;
  },

  async upsert(page: Partial<SeoPage> & { route_path: string }): Promise<SeoPage> {
    const { data, error } = await supabase
      .from("seo_pages")
      .upsert(page as any, { onConflict: "route_path" })
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async remove(id: string) {
    const { error } = await supabase.from("seo_pages").delete().eq("id", id);
    if (error) throw error;
  },
};
