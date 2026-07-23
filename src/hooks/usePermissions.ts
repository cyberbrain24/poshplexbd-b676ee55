import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ModuleKey =
  | "dashboard"
  | "products" | "categories" | "colors" | "sizes" | "size-guides"
  | "orders" | "add-order" | "order-fulfillment" | "payment-methods"
  | "customers" | "customer-types" | "divisions" | "thanas"
  | "reviews" | "site-settings"
  | "marketing"
  | "user-roles";

export interface PermissionsState {
  isSuperAdmin: boolean;
  allowedModules: Set<ModuleKey> | "all";
  isLoading: boolean;
}

/** Always-on modules — dashboard is base landing for every admin */
const ALWAYS_ALLOWED: ModuleKey[] = ["dashboard"];

export function usePermissions(): PermissionsState {
  const { data, isLoading } = useQuery({
    queryKey: ["my-permissions"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email ?? "";
      const isSuper = email === "poshplexbd@gmail.com";
      if (isSuper) return { isSuper: true, modules: null as string[] | null };

      const { data: modsData } = await supabase.rpc("get_my_allowed_modules");
      return { isSuper: false, modules: (modsData as string[]) ?? [] };
    },
  });

  if (!data) {
    return { isSuperAdmin: false, allowedModules: new Set(ALWAYS_ALLOWED), isLoading };
  }
  if (data.isSuper) {
    return { isSuperAdmin: true, allowedModules: "all", isLoading: false };
  }
  const set = new Set<ModuleKey>([...ALWAYS_ALLOWED, ...(data.modules as ModuleKey[])]);
  return { isSuperAdmin: false, allowedModules: set, isLoading: false };
}

export function canAccess(state: PermissionsState, key: ModuleKey): boolean {
  if (state.allowedModules === "all") return true;
  return state.allowedModules.has(key);
}
