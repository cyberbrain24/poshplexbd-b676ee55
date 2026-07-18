import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DeletionCheckResult {
  count: number;
  names: string[];
}

type VariantColumn = "color_id" | "size_id";
type ProductColumn = "size_guide_id";

interface CheckConfig {
  table: "product_variants" | "products";
  column: VariantColumn | ProductColumn;
}

const CONFIGS: Record<string, CheckConfig> = {
  color: { table: "product_variants", column: "color_id" },
  size: { table: "product_variants", column: "size_id" },
  "size-guide": { table: "products", column: "size_guide_id" },
};

export function useAttributeDeletionCheck(type: keyof typeof CONFIGS) {
  const [blocked, setBlocked] = useState<DeletionCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async (itemId: string) => {
    setChecking(true);
    setBlocked(null);

    const config = CONFIGS[type];
    let count = 0;
    let names: string[] = [];

    if (config.table === "product_variants") {
      const { count: variantCount } = await (supabase as any)
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq(config.column, itemId);

      if (variantCount && variantCount > 0) {
        const { data: variants } = await (supabase as any)
          .from("product_variants")
          .select("product_id, products(name)")
          .eq(config.column, itemId)
          .limit(10);

        const uniqueProducts = new Map<string, string>();
        (variants || []).forEach((v: any) => {
          if (v.product_id && v.products?.name) {
            uniqueProducts.set(v.product_id, v.products.name);
          }
        });
        count = uniqueProducts.size || variantCount;
        names = [...uniqueProducts.values()].slice(0, 5);
      }
    } else {
      const { data, count: productCount } = await (supabase as any)
        .from("products")
        .select("name", { count: "exact" })
        .eq(config.column, itemId)
        .limit(5);

      count = productCount || 0;
      names = (data || []).map((p: any) => p.name);
    }

    if (count > 0) setBlocked({ count, names });
    setChecking(false);
  };

  const reset = () => { setBlocked(null); setChecking(false); };
  return { blocked, checking, check, reset };
}
