import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { injectMetaPixel, trackPageView, clearEventDedup } from "@/lib/meta-pixel";

/**
 * Global Meta Pixel injector + PageView tracker on route change.
 * Place once in App.tsx alongside GA4Script.
 */
const MetaPixelScript = () => {
  const location = useLocation();

  // Inject pixel on mount
  useEffect(() => {
    injectMetaPixel();
  }, []);

  // Track PageView + clear dedup on route change
  useEffect(() => {
    clearEventDedup();
    trackPageView();
  }, [location.pathname]);

  return null;
};

export default MetaPixelScript;
