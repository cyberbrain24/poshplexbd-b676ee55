// Typography token system — single source of truth for storefront type styles.
// Admin can override every value via site_settings.typography.

export type FamilySlot = "serif" | "sans";

export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

export type TokenConfig = {
  slot: FamilySlot;
  weightDesktop: number;
  weightMobile: number;
  sizeDesktop: number;   // px
  sizeMobile: number;    // px
  lineHeight: number;    // unitless
  letterSpacing: number; // px (can be negative)
  transform: TextTransform;
};

export type TypographyToken =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "product-title-card"
  | "product-title-pdp"
  | "price"
  | "price-sale"
  | "price-original"
  | "body"
  | "body-small"
  | "label"
  | "button"
  | "nav-link"
  | "badge"
  | "logo"
  | "caption";

export const TYPO_TOKENS: TypographyToken[] = [
  "display",
  "h1",
  "h2",
  "h3",
  "product-title-card",
  "product-title-pdp",
  "price",
  "price-sale",
  "price-original",
  "body",
  "body-small",
  "label",
  "button",
  "nav-link",
  "badge",
  "logo",
  "caption",
];

export const TOKEN_LABELS: Record<TypographyToken, string> = {
  display: "Display (editorial hero)",
  h1: "H1 — Page title",
  h2: "H2 — Section heading",
  h3: "H3 — Subsection / accordion",
  "product-title-card": "Product title — Card (PLP)",
  "product-title-pdp": "Product title — Detail (PDP)",
  price: "Price",
  "price-sale": "Price — Sale",
  "price-original": "Price — Original (struck-through)",
  body: "Body / Paragraph",
  "body-small": "Body — Small",
  label: "Label (size/color options)",
  button: "Button",
  "nav-link": "Navigation link",
  badge: "Badge / Flag",
  logo: "Logo / Wordmark",
  caption: "Caption / Fine print",
};

export const TOKEN_LOCATIONS: Record<TypographyToken, string> = {
  display: "Homepage hero / editorial headlines",
  h1: "Page & collection titles",
  h2: "Section headings ('You may also like')",
  h3: "Accordions, footer column titles, totals",
  "product-title-card": "Product name on grid cards",
  "product-title-pdp": "Product name on detail page",
  price: "Current price (grid + PDP + cart)",
  "price-sale": "Sale / discounted price",
  "price-original": "Original price (strikethrough)",
  body: "Product description, paragraphs, line items",
  "body-small": "Accordion content, footer links",
  label: "Field labels, size/color option labels",
  button: "All CTA buttons",
  "nav-link": "Header navigation links",
  badge: "'Sale', 'New' product flags",
  logo: "POSHPLEX wordmark",
  caption: "Announcement bar, breadcrumbs, captions",
};

export const TYPO_DEFAULTS: Record<TypographyToken, TokenConfig> = {
  display:              { slot: "serif", weightDesktop: 400, weightMobile: 400, sizeDesktop: 40, sizeMobile: 26, lineHeight: 1.05, letterSpacing: -0.5, transform: "none" },
  h1:                   { slot: "serif", weightDesktop: 400, weightMobile: 400, sizeDesktop: 26, sizeMobile: 21, lineHeight: 1.1,  letterSpacing: 0,    transform: "none" },
  h2:                   { slot: "sans",  weightDesktop: 500, weightMobile: 500, sizeDesktop: 17, sizeMobile: 15, lineHeight: 1.25, letterSpacing: 0,    transform: "none" },
  h3:                   { slot: "sans",  weightDesktop: 500, weightMobile: 500, sizeDesktop: 13, sizeMobile: 13, lineHeight: 1.3,  letterSpacing: 0.3,  transform: "none" },
  "product-title-card": { slot: "sans",  weightDesktop: 400, weightMobile: 400, sizeDesktop: 12, sizeMobile: 12, lineHeight: 1.4,  letterSpacing: 0,    transform: "none" },
  "product-title-pdp":  { slot: "serif", weightDesktop: 400, weightMobile: 400, sizeDesktop: 18, sizeMobile: 16, lineHeight: 1.2,  letterSpacing: 0,    transform: "none" },
  price:                { slot: "sans",  weightDesktop: 500, weightMobile: 500, sizeDesktop: 15, sizeMobile: 13, lineHeight: 1.2,  letterSpacing: 0,    transform: "none" },
  "price-sale":         { slot: "sans",  weightDesktop: 500, weightMobile: 500, sizeDesktop: 15, sizeMobile: 13, lineHeight: 1.2,  letterSpacing: 0,    transform: "none" },
  "price-original":     { slot: "sans",  weightDesktop: 400, weightMobile: 400, sizeDesktop: 12, sizeMobile: 11, lineHeight: 1.2,  letterSpacing: 0,    transform: "none" },
  body:                 { slot: "sans",  weightDesktop: 400, weightMobile: 400, sizeDesktop: 13, sizeMobile: 12, lineHeight: 1.55, letterSpacing: 0,    transform: "none" },
  "body-small":         { slot: "sans",  weightDesktop: 400, weightMobile: 400, sizeDesktop: 11, sizeMobile: 11, lineHeight: 1.5,  letterSpacing: 0,    transform: "none" },
  label:                { slot: "sans",  weightDesktop: 400, weightMobile: 400, sizeDesktop: 11, sizeMobile: 11, lineHeight: 1.4,  letterSpacing: 0,    transform: "none" },
  button:               { slot: "sans",  weightDesktop: 500, weightMobile: 500, sizeDesktop: 12, sizeMobile: 12, lineHeight: 1,    letterSpacing: 0.6,  transform: "uppercase" },
  "nav-link":           { slot: "sans",  weightDesktop: 500, weightMobile: 500, sizeDesktop: 12, sizeMobile: 13, lineHeight: 1,    letterSpacing: 0.4,  transform: "uppercase" },
  badge:                { slot: "sans",  weightDesktop: 500, weightMobile: 500, sizeDesktop: 9,  sizeMobile: 9,  lineHeight: 1,    letterSpacing: 0.6,  transform: "uppercase" },
  logo:                 { slot: "serif", weightDesktop: 400, weightMobile: 400, sizeDesktop: 20, sizeMobile: 17, lineHeight: 1,    letterSpacing: 1,    transform: "uppercase" },
  caption:              { slot: "sans",  weightDesktop: 400, weightMobile: 400, sizeDesktop: 10, sizeMobile: 10, lineHeight: 1.5,  letterSpacing: 0,    transform: "none" },
};

export const TOKEN_GROUPS: { label: string; tokens: TypographyToken[] }[] = [
  { label: "Global / Chrome",  tokens: ["logo", "nav-link", "caption"] },
  { label: "Headings",         tokens: ["display", "h1", "h2", "h3"] },
  { label: "Product Grid",     tokens: ["product-title-card", "price", "badge"] },
  { label: "Product Detail",   tokens: ["product-title-pdp", "price-sale", "price-original", "body", "label", "button"] },
  { label: "Generic",          tokens: ["body-small"] },
];

export type FamilyConfig = { serif: string; sans: string };

export const FAMILY_DEFAULTS: FamilyConfig = {
  serif: "Playfair Display",
  sans: "Inter",
};

export type TypographySettings = {
  families: FamilyConfig;
  tokens: Record<TypographyToken, TokenConfig>;
};

export const TYPO_DEFAULT_SETTINGS: TypographySettings = {
  families: { ...FAMILY_DEFAULTS },
  tokens: { ...TYPO_DEFAULTS },
};

/** Normalize whatever is stored in site_settings.typography into the new shape. */
export function normalizeTypographySettings(raw: unknown): TypographySettings {
  const base: TypographySettings = {
    families: { ...FAMILY_DEFAULTS },
    tokens: JSON.parse(JSON.stringify(TYPO_DEFAULTS)),
  };
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, any>;

  // New shape
  if (r.families && r.tokens) {
    base.families = { ...base.families, ...(r.families || {}) };
    for (const t of TYPO_TOKENS) {
      if (r.tokens[t]) base.tokens[t] = { ...base.tokens[t], ...r.tokens[t] };
    }
    return base;
  }

  // Legacy shape: { h1, h2, h3, h4, h5, body, nav } with { family, weight, scale, uppercase, tracking }
  const legacy = r as Record<string, { family?: string; weight?: number; uppercase?: boolean }>;
  if (legacy.body?.family) base.families.sans = legacy.body.family;
  if (legacy.h1?.family) base.families.serif = legacy.h1.family;
  const mapLegacy = (key: keyof TypographySettings["tokens"], src?: any) => {
    if (!src) return;
    const cur = base.tokens[key];
    if (typeof src.weight === "number") {
      cur.weightDesktop = src.weight;
      cur.weightMobile = src.weight;
    }
    if (typeof src.uppercase === "boolean") {
      cur.transform = src.uppercase ? "uppercase" : "none";
    }
  };
  mapLegacy("h1", legacy.h1);
  mapLegacy("h2", legacy.h2);
  mapLegacy("h3", legacy.h3);
  mapLegacy("body", legacy.body);
  mapLegacy("nav-link", legacy.nav);
  return base;
}
