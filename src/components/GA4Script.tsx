import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dynamically injects the Google Analytics 4 script
 * when enabled in site_settings.
 */
const GA4Script = () => {
  const [config, setConfig] = useState<{ enabled: boolean; id: string | null }>({
    enabled: false,
    id: null,
  });

  useEffect(() => {
    const fetchGA4Settings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("ga4_enabled, ga4_measurement_id")
        .limit(1)
        .maybeSingle();

      if (data) {
        setConfig({
          enabled: data.ga4_enabled ?? false,
          id: data.ga4_measurement_id ?? null,
        });
      }
    };
    fetchGA4Settings();
  }, []);

  useEffect(() => {
    if (!config.enabled || !config.id) return;

    const GA4_ID = config.id;

    // Prevent duplicate injection
    if (document.querySelector(`script[src*="${GA4_ID}"]`)) return;

    // gtag.js loader
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    // gtag config
    const inline = document.createElement("script");
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA4_ID}');
    `;
    document.head.appendChild(inline);

    return () => {
      script.remove();
      inline.remove();
    };
  }, [config]);

  return null;
};

export default GA4Script;
