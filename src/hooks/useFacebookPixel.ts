import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  setPixelConfig,
  setupLazyLoading,
  trackPageView,
  setAdvancedMatchingUser,
  captureClickId,
} from "@/services/facebook-pixel.service";

/**
 * Global hook that:
 * 1. Reads pixel settings from the shared site_settings React Query cache
 * 2. Sets up lazy script injection
 * 3. Tracks PageView on every SPA route change
 */
export const useFacebookPixel = () => {
  const location = useLocation();
  const configApplied = useRef(false);
  const matchingApplied = useRef(false);
  const lastPath = useRef<string | null>(null);
  const { data: settings } = useSiteSettings();

  // 1. Apply config when settings arrive (memory or network)
  useEffect(() => {
    if (configApplied.current || !settings) return;
    configApplied.current = true;

    setPixelConfig({
      pixelId: settings.meta_pixel_id || "",
      isEnabled: settings.meta_pixel_enabled ?? false,
      testMode: settings.meta_test_mode ?? false,
      advancedMatching: settings.meta_advanced_matching ?? true,
    });
    captureClickId();
    setupLazyLoading();
  }, [settings]);

  // 2. Restore Advanced Matching for already-logged-in user (once)
  useEffect(() => {
    if (matchingApplied.current) return;
    matchingApplied.current = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const u = session.user;
        const meta: any = u.user_metadata || {};
        const isPhoneEmail = (u.email || "").endsWith("@phone.local");
        const phoneDigits = isPhoneEmail
          ? (u.email || "").split("@")[0]
          : (meta.phone || "").replace(/\D/g, "");
        const fullName: string = meta.name || "";
        const [fn, ...rest] = fullName.split(/\s+/).filter(Boolean);
        setAdvancedMatchingUser({
          em: !isPhoneEmail ? u.email : undefined,
          ph: phoneDigits || undefined,
          fn: fn || undefined,
          ln: rest.join(" ") || undefined,
          external_id: u.id,
          country: "bd",
        });
      } catch {
        // Fail silently
      }
    })();
  }, []);

  // 3. Track PageView on route change (deduplicated)
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (lastPath.current === currentPath) return;
    lastPath.current = currentPath;

    const timer = setTimeout(() => {
      trackPageView();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
};

