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

// Industry-practice heading scale (rem) — body always 1rem (~15px from index.css)
const HEADING_BASE_REM: Record<"h1" | "h2" | "h3" | "h4" | "h5", number> = {
  h1: 2.5,
  h2: 2.0,
  h3: 1.5,
  h4: 1.25,
  h5: 1.0,
};

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

  Object.values(merged).forEach((c) => {
    const font = findFont(c.family);
    if (font?.googleParam) ensureGoogleFontLoaded(font.googleParam);
  });

  const not = ":not(.admin-shell):not(.admin-shell *)";

  const headingRule = (sel: string, c: typeof merged.h1, baseRem: number) => {
    const font = findFont(c.family);
    const stack = familyStack(c.family, fallbackFor(font?.category));
    return `${sel}{font-family:${stack} !important;font-weight:${c.weight} !important;letter-spacing:${TRACKING_MAP[c.tracking]} !important;text-transform:${c.uppercase ? "uppercase" : "none"} !important;font-size:${(baseRem * c.scale).toFixed(3)}rem !important;line-height:1.15;}`;
    };

  const bodyFont = findFont(merged.body.family);
  const bodyStack = familyStack(merged.body.family, fallbackFor(bodyFont?.category));
  const bodyRule =
    // Body sets the base — inline elements inherit naturally, so Tailwind
    // utilities like text-[10px], text-2xl, text-xs still win on spans/links.
    `body${not}{font-family:${bodyStack} !important;font-weight:${merged.body.weight};letter-spacing:${TRACKING_MAP[merged.body.tracking]};text-transform:${merged.body.uppercase ? "uppercase" : "none"};font-size:${merged.body.scale.toFixed(3)}rem !important;}` +
    // Paragraphs/lists/labels follow body family + casing only.
    `p${not}, li${not}, label${not}, blockquote${not}{font-family:${bodyStack} !important;}`;

  const navFont = findFont(merged.nav.family);
  const navStack = familyStack(merged.nav.family, fallbackFor(navFont?.category));
  const navRule = `nav${not}, nav${not} a, nav${not} button, .nav-font${not}{font-family:${navStack} !important;font-weight:${merged.nav.weight} !important;letter-spacing:${TRACKING_MAP[merged.nav.tracking]} !important;text-transform:${merged.nav.uppercase ? "uppercase" : "none"} !important;}`;

  return [
    headingRule(`h1${not}`, merged.h1, HEADING_BASE_REM.h1),
    headingRule(`h2${not}`, merged.h2, HEADING_BASE_REM.h2),
    headingRule(`h3${not}`, merged.h3, HEADING_BASE_REM.h3),
    headingRule(`h4${not}`, merged.h4, HEADING_BASE_REM.h4),
    headingRule(`h5${not}, h6${not}`, merged.h5, HEADING_BASE_REM.h5),
    bodyRule,
    navRule,
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
