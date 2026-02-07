import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types for site settings
export interface MenuLink {
  label: string;
  path: string;
  isExternal?: boolean;
}

export interface FooterColumn {
  title: string;
  links: MenuLink[];
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  pinterest?: string;
  youtube?: string;
  tiktok?: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  header_menu: MenuLink[];
  footer_copyright: string | null;
  footer_contact_email: string | null;
  footer_contact_phone: string | null;
  footer_address: string | null;
  social_links: SocialLinks;
  footer_columns: FooterColumn[];
  created_at: string;
  updated_at: string;
}

// Default fallback values (matches current hardcoded values)
export const DEFAULT_SETTINGS: Omit<SiteSettings, "id" | "created_at" | "updated_at"> = {
  site_name: "Poshplex",
  tagline: "Premium Fashion & Jewelry",
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  header_menu: [
    { label: "Shop", path: "/category/all" },
    { label: "New Arrivals", path: "/category/new" },
    { label: "Blog", path: "/blog" },
    { label: "About", path: "/about/our-story" },
  ],
  footer_copyright: "© 2025 Poshplex. All rights reserved.",
  footer_contact_email: "hello@poshplex.com",
  footer_contact_phone: null,
  footer_address: null,
  social_links: {
    instagram: "",
    facebook: "",
    twitter: "",
    pinterest: "",
    youtube: "",
    tiktok: "",
  },
  footer_columns: [
    {
      title: "Shop",
      links: [
        { label: "All Products", path: "/category/all" },
        { label: "New Arrivals", path: "/category/new" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "Our Story", path: "/about/our-story" },
        { label: "Sustainability", path: "/about/sustainability" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Size Guide", path: "/about/size-guide" },
        { label: "Customer Care", path: "/about/customer-care" },
        { label: "Store Locator", path: "/about/store-locator" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", path: "/privacy-policy" },
        { label: "Terms of Service", path: "/terms-of-service" },
      ],
    },
  ],
};

// Fetch site settings with aggressive caching
export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch site settings:", error);
        throw error;
      }

      if (!data) {
        // Return defaults if no settings exist
        return DEFAULT_SETTINGS as SiteSettings;
      }

      // Parse JSON fields and merge with defaults
      return {
        ...data,
        header_menu: Array.isArray(data.header_menu) 
          ? data.header_menu 
          : DEFAULT_SETTINGS.header_menu,
        social_links: typeof data.social_links === "object" && data.social_links !== null
          ? data.social_links
          : DEFAULT_SETTINGS.social_links,
        footer_columns: Array.isArray(data.footer_columns)
          ? data.footer_columns
          : DEFAULT_SETTINGS.footer_columns,
      } as SiteSettings;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - aggressive caching
    gcTime: 1000 * 60 * 60, // 1 hour cache retention
    retry: 2,
    // Use defaults as placeholder while loading
    placeholderData: DEFAULT_SETTINGS as SiteSettings,
  });
};

// Admin mutation for updating settings
export const useSiteSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Omit<SiteSettings, "id" | "created_at" | "updated_at">>) => {
      // First get the current settings ID
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .single();

      if (!existing) {
        throw new Error("Site settings not found");
      }

      // Transform to match database JSON types
      const dbPayload: Record<string, unknown> = { ...settings };
      
      const { data, error } = await supabase
        .from("site_settings")
        .update(dbPayload)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};

// Helper to check if a link is external
export const isExternalLink = (path: string): boolean => {
  return path.startsWith("http://") || path.startsWith("https://");
};

// Helper to get link props for internal/external handling
export const getLinkProps = (path: string) => {
  if (isExternalLink(path)) {
    return {
      href: path,
      target: "_blank",
      rel: "noopener noreferrer",
    };
  }
  return { to: path };
};
