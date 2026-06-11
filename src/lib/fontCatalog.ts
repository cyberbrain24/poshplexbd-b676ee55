// Curated font catalog for the admin typography picker.
// Google fonts are loaded on-demand by TypographyProvider.

export type FontEntry = {
  name: string;            // CSS family name used in font-family
  label: string;           // display label in admin
  category: "display" | "sans" | "serif" | "mono" | "local";
  googleParam?: string;    // e.g. "Space+Grotesk:wght@300;400;500;600;700"
};

export const FONT_CATALOG: FontEntry[] = [
  // Local (already bundled)
  { name: "This is Fire", label: "This is Fire (local)", category: "local" },
  { name: "Natoor",       label: "Natoor (local)",       category: "local" },
  { name: "Street Culture", label: "Street Culture (local)", category: "local" },
  { name: "Wood Chaos",   label: "Wood Chaos (local)",   category: "local" },

  // Display / streetwear
  { name: "Anton",         label: "Anton",         category: "display", googleParam: "Anton" },
  { name: "Bebas Neue",    label: "Bebas Neue",    category: "display", googleParam: "Bebas+Neue" },
  { name: "Archivo Black", label: "Archivo Black", category: "display", googleParam: "Archivo+Black" },
  { name: "Oswald",        label: "Oswald",        category: "display", googleParam: "Oswald:wght@300;400;500;600;700" },
  { name: "Teko",          label: "Teko",          category: "display", googleParam: "Teko:wght@300;400;500;600;700" },
  { name: "Abril Fatface", label: "Abril Fatface", category: "display", googleParam: "Abril+Fatface" },

  // Serif (editorial / fashion)
  { name: "Playfair Display",    label: "Playfair Display",    category: "serif", googleParam: "Playfair+Display:wght@400;500;600;700;800" },
  { name: "Cormorant Garamond",  label: "Cormorant Garamond",  category: "serif", googleParam: "Cormorant+Garamond:wght@300;400;500;600;700" },
  { name: "EB Garamond",         label: "EB Garamond",         category: "serif", googleParam: "EB+Garamond:wght@400;500;600;700;800" },
  { name: "Libre Bodoni",        label: "Libre Bodoni",        category: "serif", googleParam: "Libre+Bodoni:wght@400;500;600;700" },


  // Sans
  { name: "Poppins",         label: "Poppins",         category: "sans", googleParam: "Poppins:wght@300;400;500;600;700;800" },
  { name: "Inter",           label: "Inter",           category: "sans", googleParam: "Inter:wght@300;400;500;600;700;800" },
  { name: "Space Grotesk",   label: "Space Grotesk",   category: "sans", googleParam: "Space+Grotesk:wght@300;400;500;600;700" },
  { name: "DM Sans",         label: "DM Sans",         category: "sans", googleParam: "DM+Sans:wght@300;400;500;600;700;800" },
  { name: "Manrope",         label: "Manrope",         category: "sans", googleParam: "Manrope:wght@300;400;500;600;700;800" },
  { name: "Archivo",         label: "Archivo",         category: "sans", googleParam: "Archivo:wght@300;400;500;600;700;800" },
  { name: "Archivo Narrow",  label: "Archivo Narrow",  category: "sans", googleParam: "Archivo+Narrow:wght@400;500;600;700" },
  { name: "IBM Plex Sans",   label: "IBM Plex Sans",   category: "sans", googleParam: "IBM+Plex+Sans:wght@300;400;500;600;700" },
  { name: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "sans", googleParam: "Plus+Jakarta+Sans:wght@300;400;500;600;700;800" },
  { name: "Syne",            label: "Syne",            category: "sans", googleParam: "Syne:wght@400;500;600;700;800" },
  { name: "Sora",            label: "Sora",            category: "sans", googleParam: "Sora:wght@300;400;500;600;700;800" },
  { name: "Urbanist",        label: "Urbanist",        category: "sans", googleParam: "Urbanist:wght@300;400;500;600;700;800" },
  { name: "Barlow Condensed", label: "Barlow Condensed", category: "sans", googleParam: "Barlow+Condensed:wght@300;400;500;600;700" },
  { name: "Jost",            label: "Jost",            category: "sans", googleParam: "Jost:wght@300;400;500;600;700;800" },
  { name: "Work Sans",       label: "Work Sans",       category: "sans", googleParam: "Work+Sans:wght@300;400;500;600;700;800" },

  // Mono
  { name: "JetBrains Mono",  label: "JetBrains Mono",  category: "mono", googleParam: "JetBrains+Mono:wght@300;400;500;600;700" },
  { name: "Space Mono",      label: "Space Mono",      category: "mono", googleParam: "Space+Mono:wght@400;700" },
  { name: "IBM Plex Mono",   label: "IBM Plex Mono",   category: "mono", googleParam: "IBM+Plex+Mono:wght@300;400;500;600;700" },
];

export const findFont = (name?: string): FontEntry | undefined =>
  name ? FONT_CATALOG.find((f) => f.name === name) : undefined;

export type TypographyTarget = "h1" | "h2" | "h3" | "h4" | "h5" | "body" | "nav";

export type ElementConfig = {
  family: string;
  weight: number;
  scale: number;       // multiplier
  uppercase: boolean;
  tracking: "tight" | "normal" | "wide";
};

export type TypographyConfig = Partial<Record<TypographyTarget, ElementConfig>>;

export const TYPOGRAPHY_DEFAULTS: Record<TypographyTarget, ElementConfig> = {
  h1:   { family: "This is Fire", weight: 400, scale: 1, uppercase: true,  tracking: "tight" },
  h2:   { family: "Natoor",       weight: 400, scale: 1, uppercase: true,  tracking: "tight" },
  h3:   { family: "Anton",        weight: 400, scale: 1, uppercase: true,  tracking: "tight" },
  h4:   { family: "Anton",        weight: 400, scale: 1, uppercase: true,  tracking: "tight" },
  h5:   { family: "Anton",        weight: 400, scale: 1, uppercase: true,  tracking: "tight" },
  body: { family: "Poppins",      weight: 400, scale: 1, uppercase: false, tracking: "normal" },
  nav:  { family: "Poppins",      weight: 500, scale: 1, uppercase: false, tracking: "normal" },
};

export const TARGET_LABELS: Record<TypographyTarget, string> = {
  h1: "Heading 1 (H1)",
  h2: "Heading 2 (H2)",
  h3: "Heading 3 (H3)",
  h4: "Heading 4 (H4)",
  h5: "Heading 5/6 (H5)",
  body: "Body / Paragraph",
  nav: "Navigation & Buttons",
};

export const TRACKING_MAP = { tight: "-0.02em", normal: "0", wide: "0.08em" } as const;
