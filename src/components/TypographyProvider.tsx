import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { findFont } from "@/lib/fontCatalog";
import {
  normalizeTypographySettings,
  TYPO_TOKENS,
  type TypographySettings,
  type TypographyToken,
  type TokenConfig,
} from "@/lib/typographyTokens";

const STYLE_ID = "dynamic-typography";

const NOT = ":not(.admin-shell):not(.admin-shell *)";

function familyStack(name: string, fallbackKind: "serif" | "sans" | "mono") {
  if (fallbackKind === "mono") return `'${name}', ui-monospace, monospace`;
  if (fallbackKind === "serif") return `'${name}', 'Cormorant Garamond', Georgia, serif`;
  return `'${name}', 'Helvetica Neue', Arial, sans-serif`;
}

function cssVarName(token: TypographyToken) {
  return token.replace(/[^a-zA-Z0-9]/g, "-");
}

function tokenDeclarations(t: TypographyToken, c: TokenConfig, serifStack: string, sansStack: string) {
  const stack = c.slot === "serif" ? serifStack : sansStack;
  return [
    `font-family:${stack} !important`,
    `font-weight:${c.weightDesktop} !important`,
    `font-size:${c.sizeDesktop}px !important`,
    `line-height:${c.lineHeight} !important`,
    `letter-spacing:${c.letterSpacing}px !important`,
    `text-transform:${c.transform} !important`,
  ].join(";");
}

function tokenMobileDeclarations(c: TokenConfig) {
  return [
    `font-size:${c.sizeMobile}px !important`,
    c.weightMobile !== c.weightDesktop ? `font-weight:${c.weightMobile} !important` : null,
  ]
    .filter(Boolean)
    .join(";");
}

function buildCSS(settings: TypographySettings): string {
  const serifFont = findFont(settings.families.serif);
  const sansFont = findFont(settings.families.sans);

  const serifStack = familyStack(settings.families.serif, serifFont?.category === "sans" ? "sans" : "serif");
  const sansStack = familyStack(settings.families.sans, sansFont?.category === "serif" ? "serif" : "sans");

  const rootVars: string[] = [
    `--font-serif:${serifStack}`,
    `--font-sans:${sansStack}`,
  ];
  for (const t of TYPO_TOKENS) {
    const c = settings.tokens[t];
    const v = cssVarName(t);
    rootVars.push(`--fs-${v}:${c.sizeDesktop}px`);
    rootVars.push(`--fw-${v}:${c.weightDesktop}`);
    rootVars.push(`--lh-${v}:${c.lineHeight}`);
    rootVars.push(`--ls-${v}:${c.letterSpacing}px`);
    rootVars.push(`--tt-${v}:${c.transform}`);
  }

  const utilityRules: string[] = TYPO_TOKENS.map((t) => {
    const c = settings.tokens[t];
    return `.t-${t}${NOT}{${tokenDeclarations(t, c, serifStack, sansStack)}}`;
  });

  // Element-level mapping so existing markup picks up new tokens automatically
  const map: Array<[string, TypographyToken]> = [
    [`h1${NOT}`, "h1"],
    [`h2${NOT}`, "h2"],
    [`h3${NOT}`, "h3"],
    [`h4${NOT}`, "h3"],
    [`h5${NOT}, h6${NOT}`, "h3"],
    [`body${NOT}`, "body"],
    [`p${NOT}, li${NOT}, label${NOT}, blockquote${NOT}`, "body"],
    [`nav${NOT} a, nav${NOT} button, .nav-font${NOT}`, "nav-link"],
  ];
  const elementRules = map.map(([sel, token]) => {
    const c = settings.tokens[token];
    return `${sel}{${tokenDeclarations(token, c, serifStack, sansStack)}}`;
  });

  // Mobile overrides
  const mobileTokenRules: string[] = TYPO_TOKENS.map((t) => {
    const c = settings.tokens[t];
    const decl = tokenMobileDeclarations(c);
    return decl ? `.t-${t}${NOT}{${decl}}` : "";
  }).filter(Boolean);
  const mobileElementRules = map
    .map(([sel, token]) => {
      const c = settings.tokens[token];
      const decl = tokenMobileDeclarations(c);
      return decl ? `${sel}{${decl}}` : "";
    })
    .filter(Boolean);
  const mobileVars = TYPO_TOKENS.map((t) => {
    const c = settings.tokens[t];
    return `--fs-${cssVarName(t)}:${c.sizeMobile}px`;
  }).join(";");

  return [
    `:root{${rootVars.join(";")}}`,
    ...elementRules,
    ...utilityRules,
    `@media (max-width: 767px){:root{${mobileVars}}${mobileElementRules.join("")}${mobileTokenRules.join("")}}`,
  ].join("\n");
}

function applyTypography(settings: TypographySettings) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = buildCSS(settings);
}

const TYPO_CACHE_KEY = "pp_typo_cache_v1";
const TYPO_CACHE_TTL = 60 * 60 * 1000; // 60 min

function readTypoCache(): TypographySettings | null {
  try {
    const raw = localStorage.getItem(TYPO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > TYPO_CACHE_TTL) return null;
    return normalizeTypographySettings(parsed.data);
  } catch {
    return null;
  }
}

function writeTypoCache(data: unknown) {
  try {
    localStorage.setItem(TYPO_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* ignore */ }
}

export const TypographyProvider = () => {
  const { data: settings } = useSiteSettings();
  const typography = normalizeTypographySettings(settings?.typography ?? null);

  useEffect(() => {
    applyTypography(typography);
  }, [typography]);

  return null;
};

export default TypographyProvider;
