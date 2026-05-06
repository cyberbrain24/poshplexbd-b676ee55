import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  setPixelConfig,
  setupLazyLoading,
  trackPageView,
} from "@/services/facebook-pixel.service";

/**
 * Global hook that:
 * 1. Fetches pixel settings from DB once
 * 2. Sets up lazy script injection
 * 3. Tracks PageView on every SPA route change
 */
export const useFacebookPixel = () => {
  const location = useLocation();
  const configLoaded = useRef(false);
  const lastPath = useRef<string | null>(null);

  // 1. Load config once
  useEffect(() => {
    if (configLoaded.current) return;
    configLoaded.current = true;

    const load = async () => {
      try {
        const { data: rows } = await supabase
          .rpc("get_public_site_settings");

        const data = Array.isArray(rows) ? rows[0] : null;
        if (!data) return;

        setPixelConfig({
          pixelId: data.meta_pixel_id || "",
          isEnabled: data.meta_pixel_enabled ?? false,
          testMode: data.meta_test_mode ?? false,
          advancedMatching: data.meta_advanced_matching ?? true,
        });

        setupLazyLoading();
      } catch {
        // Fail silently
      }
    };

    load();
  }, []);

  // 2. Track PageView on route change (deduplicated)
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (lastPath.current === currentPath) return;
    lastPath.current = currentPath;

    // Small delay to ensure script has loaded after lazy init
    const timer = setTimeout(() => {
      trackPageView();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);
};
