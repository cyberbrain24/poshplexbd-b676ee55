import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  findFont,
  TYPOGRAPHY_DEFAULTS,
  TRACKING_MAP,
  type TypographyConfig,
  type TypographyTarget,
} from "@/lib/fontCatalog";

const STYLE_ID = "dynamic-typography";
const LINK_ID_PREFIX = "dynamic-font-";

function familyStack(name: string, fallback: string) {
  return `'${name}', ${fallback}`;
}

function fallbackFor(category?: string) {
  if (category === "mono") return "ui-monospace, monospace";
  if (category === "display" || category === "local") return "Impact, sans-serif";
  return "system-ui, -apple-system, sans-serif";
}

function ensureGoogleFontLoaded(googleParam: string) {
  const id = LINK_ID_PREFIX + googleParam;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${googleParam}&display=swap`;
  document.head.appendChild(link);
}

function buildCSS(cfg: TypographyConfig) {
  const merged: Record<TypographyTarget, typeof TYPOGRAPHY_DEFAULTS.h1> = {
    h1: { ...TYPOGRAPHY_DEFAULTS.h1, ...(cfg.h1 || {}) },
    h2: { ...TYPOGRAPHY_DEFAULTS.h2, ...(cfg.h2 || {}) },
    h3: { ...TYPOGRAPHY_DEFAULTS.h3, ...(cfg.h3 || {}) },
    h4: { ...TYPOGRAPHY_DEFAULTS.h4, ...(cfg.h4 || {}) },
    h5: { ...TYPOGRAPHY_DEFAULTS.h5, ...(cfg.h5 || {}) },
    body: { ...TYPOGRAPHY_DEFAULTS.body, ...(cfg.body || {}) },
    nav: { ...TYPOGRAPHY_DEFAULTS.nav, ...(cfg.nav || {}) },
  };

  // Load google fonts for all chosen families
  Object.values(merged).forEach((c) => {
    const font = findFont(c.family);
    if (font?.googleParam) ensureGoogleFontLoaded(font.googleParam);
  });

  const rule = (sel: string, c: typeof merged.h1) => {
    const font = findFont(c.family);
    const stack = familyStack(c.family, fallbackFor(font?.category));
    return `${sel}{font-family:${stack} !important;font-weight:${c.weight} !important;letter-spacing:${TRACKING_MAP[c.tracking]} !important;text-transform:${c.uppercase ? "uppercase" : "none"} !important;font-size:calc(1em * ${c.scale}) !important;}`;
  };

  // Scope everything OUT of .admin-shell so admin keeps its system font reset.
  const not = ":not(.admin-shell):not(.admin-shell *)";

  return [
    rule(`h1${not}`, merged.h1),
    rule(`h2${not}`, merged.h2),
    rule(`h3${not}`, merged.h3),
    rule(`h4${not}`, merged.h4),
    rule(`h5${not}, h6${not}`, merged.h5),
    rule(`body${not}, p${not}, span${not}, li${not}, a${not}, label${not}, button${not}, input${not}, textarea${not}, select${not}`, merged.body),
    rule(`nav${not}, nav${not} a, nav${not} button, .nav-font${not}`, merged.nav),
  ].join("\n");
}

function applyTypography(cfg: TypographyConfig) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = buildCSS(cfg);
}

export const TypographyProvider = () => {
  const { data } = useQuery({
    queryKey: ["site-typography"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("typography")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.typography as TypographyConfig) || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    applyTypography(data || {});
  }, [data]);

  return null;
};

export default TypographyProvider;
