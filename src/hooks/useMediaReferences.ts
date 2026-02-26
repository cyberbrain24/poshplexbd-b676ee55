import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MediaReference {
  type: "product" | "category" | "banner" | "variant" | "review";
  id: string;
  label: string; // e.g. "SKU-ABC123 — T-Shirt"
}

/**
 * Fetch all usage references for media files.
 * Returns a map: image_url -> MediaReference[]
 */
export const useMediaReferences = () => {
  return useQuery({
    queryKey: ["media-references"],
    queryFn: async () => {
      const refMap = new Map<string, MediaReference[]>();

      const addRef = (url: string, ref: MediaReference) => {
        if (!url) return;
        const existing = refMap.get(url) || [];
        existing.push(ref);
        refMap.set(url, existing);
      };

      // 1. Product images
      const { data: productImages } = await supabase
        .from("product_images")
        .select("image_url, product_id, products!inner(name, sku)")
        .limit(1000);

      for (const pi of productImages || []) {
        const p = pi.products as any;
        addRef(pi.image_url, {
          type: "product",
          id: pi.product_id,
          label: `${p?.sku || "?"} — ${p?.name || "Unknown"}`,
        });
      }

      // 2. Variant images
      const { data: variants } = await supabase
        .from("product_variants")
        .select("image_url, product_id, sku")
        .not("image_url", "is", null)
        .limit(1000);

      for (const v of variants || []) {
        if (v.image_url) {
          addRef(v.image_url, {
            type: "variant",
            id: v.product_id,
            label: `Variant ${v.sku}`,
          });
        }
      }

      // 3. Category images
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name, image_url")
        .not("image_url", "is", null)
        .limit(500);

      for (const c of categories || []) {
        if (c.image_url) {
          addRef(c.image_url, {
            type: "category",
            id: c.id,
            label: c.name,
          });
        }
      }

      // 4. Site branding (banner/hero)
      const { data: branding } = await supabase
        .from("site_branding")
        .select("id, desktop_hero_url, mobile_hero_url, logo_url")
        .limit(1);

      for (const b of branding || []) {
        if (b.desktop_hero_url) addRef(b.desktop_hero_url, { type: "banner", id: b.id, label: "Desktop Hero" });
        if (b.mobile_hero_url) addRef(b.mobile_hero_url, { type: "banner", id: b.id, label: "Mobile Hero" });
        if (b.logo_url) addRef(b.logo_url, { type: "banner", id: b.id, label: "Site Logo" });
      }

      // 5. Review images
      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, product_id, images")
        .not("images", "is", null)
        .limit(500);

      for (const r of reviews || []) {
        if (r.images && Array.isArray(r.images)) {
          for (const imgUrl of r.images) {
            addRef(imgUrl as string, {
              type: "review",
              id: r.id,
              label: `Review for product`,
            });
          }
        }
      }

      return refMap;
    },
    staleTime: 1000 * 60 * 5,
  });
};
