import { useEffect, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";

/**
 * Injects the Google gtag.js script dynamically based on admin GA4 settings.
 * Tracks page_view on every SPA route change.
 */
const GoogleAnalyticsTracker = () => {
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const scriptInjected = useRef(false);
  const lastPath = useRef<string | null>(null);

  // Inject gtag script once when enabled + measurement ID available
  useEffect(() => {
    if (scriptInjected.current) return;
    if (!settings?.ga4_enabled || !settings?.ga4_measurement_id) return;

    const measurementId = settings.ga4_measurement_id;
    scriptInjected.current = true;

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag("js", new Date());
    gtag("config", measurementId, { send_page_view: false });

    // Inject script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
  }, [settings?.ga4_enabled, settings?.ga4_measurement_id]);

  // Track page_view on route change
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (lastPath.current === currentPath) return;
    lastPath.current = currentPath;

    if (!settings?.ga4_enabled || !settings?.ga4_measurement_id) return;
    if (typeof (window as any).gtag !== "function") return;

    const gtag = (window as any).gtag;
    gtag("event", "page_view", {
      page_path: location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search, settings?.ga4_enabled, settings?.ga4_measurement_id]);

  return null;
};

export default GoogleAnalyticsTracker;
