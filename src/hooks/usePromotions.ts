import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Promotion {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  display_style: "banner" | "card" | "floating-bubble" | "inline-text";
  action_type: "popup" | "product" | "category" | "url" | "none";
  action_value: string | null;
  promo_code_id: string | null;
  placements: string[];
  category_filter: string[] | null;
  priority: number;
  is_active: boolean;
  dismissible: boolean;
  starts_at: string | null;
  ends_at: string | null;
  cta_label: string | null;
  bg_color: string | null;
  text_color: string | null;
  views: number;
  clicks: number;
  promo_code?: {
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    description: string | null;
  } | null;
}

// Single shared query — fetches ALL active promotions in one request and
// filters by placement client-side. Replaces 5–6 parallel requests with 1.
const useAllActivePromotions = () => {
  return useQuery({
    queryKey: ["promotions", "all-active"],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<Promotion[]> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("promotions" as any)
        .select(
          "*, promo_code:promo_codes(id, code, discount_type, discount_value, description)"
        )
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("priority", { ascending: false });

      if (error) {
        console.error("usePromotions error", error);
        return [];
      }
      return (data ?? []) as unknown as Promotion[];
    },
  });
};

export const usePromotions = (
  placement: string,
  opts?: { categoryId?: string | null; productId?: string | null }
) => {
  const query = useAllActivePromotions();
  const filtered = (query.data ?? []).filter((p) => {
    if (!Array.isArray(p.placements) || !p.placements.includes(placement)) return false;
    if (!p.category_filter || p.category_filter.length === 0) return true;
    if (!opts?.categoryId) return false;
    return p.category_filter.includes(opts.categoryId);
  });
  return { ...query, data: filtered };
};

export const incrementPromotionView = async (id: string) => {
  try {
    await supabase.rpc("increment_promotion_view" as any, { p_id: id });
  } catch {}
};

export const incrementPromotionClick = async (id: string) => {
  try {
    await supabase.rpc("increment_promotion_click" as any, { p_id: id });
  } catch {}
};
