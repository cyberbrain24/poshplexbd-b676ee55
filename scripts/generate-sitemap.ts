// Generates split sitemap files into public/ before dev/build.
// Output:
//   public/sitemap_index.xml   - sitemap index
//   public/sitemap-pages.xml   - static pages
//   public/sitemap-products.xml - product detail pages
//   public/sitemap-categories.xml - category pages
//
// Uses the public anon key to read active products + categories.
// Friendly to Cloudflare: static XML files, fully cacheable at the edge.

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://poshplexbd.com";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://zspmhkzosumopyfmlwvl.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzcG1oa3pvc3Vtb3B5Zm1sd3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTQ4NzQsImV4cCI6MjA4NTk3MDg3NH0.IJ8LtX2iLYCN_z110Upf6rz1hal1pjKM-12v5X82sow";

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

function fmt(date?: string | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

function slugify(name: string, id: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
  return `${base}-${id.split("-")[0]}`;
}

function urlsetXml(entries: UrlEntry[]): string {
  const items = entries
    .map((e) => {
      const parts = [`    <loc>${e.loc}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined)
        parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

function indexXml(maps: { loc: string; lastmod: string }[]): string {
  const items = maps
    .map(
      (m) =>
        `  <sitemap>\n    <loc>${m.loc}</loc>\n    <lastmod>${m.lastmod}</lastmod>\n  </sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`;
}

async function fetchTable(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] fetch ${path} -> ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] fetch ${path} failed`, err);
    return [];
  }
}

async function main() {
  const today = new Date().toISOString().split("T")[0];

  // Static / informational pages
  const pages: UrlEntry[] = [
    { loc: `${BASE_URL}/`, lastmod: today, changefreq: "daily", priority: 1.0 },
    { loc: `${BASE_URL}/categories`, lastmod: today, changefreq: "daily", priority: 0.9 },
    { loc: `${BASE_URL}/category/all`, lastmod: today, changefreq: "daily", priority: 0.9 },
    { loc: `${BASE_URL}/membership`, lastmod: today, changefreq: "weekly", priority: 0.6 },
    { loc: `${BASE_URL}/reviews`, lastmod: today, changefreq: "weekly", priority: 0.6 },
    { loc: `${BASE_URL}/order-tracking`, lastmod: today, changefreq: "monthly", priority: 0.4 },
    { loc: `${BASE_URL}/pages/our-story`, lastmod: today, changefreq: "monthly", priority: 0.5 },
    { loc: `${BASE_URL}/pages/store-locator`, lastmod: today, changefreq: "monthly", priority: 0.5 },
    { loc: `${BASE_URL}/pages/privacy-policy`, lastmod: today, changefreq: "yearly", priority: 0.3 },
    { loc: `${BASE_URL}/pages/terms-conditions`, lastmod: today, changefreq: "yearly", priority: 0.3 },
    { loc: `${BASE_URL}/pages/shipping-delivery`, lastmod: today, changefreq: "monthly", priority: 0.4 },
  ];

  // Products
  const products = await fetchTable(
    "products?select=id,name,updated_at&is_active=eq.true&order=updated_at.desc&limit=2000",
  );
  const productEntries: UrlEntry[] = products.map((p: any) => ({
    loc: `${BASE_URL}/product/${slugify(p.name || "product", p.id)}`,
    lastmod: fmt(p.updated_at),
    changefreq: "weekly",
    priority: 0.8,
  }));

  // Categories
  const categories = await fetchTable(
    "categories?select=name,updated_at&limit=200",
  );
  const categoryEntries: UrlEntry[] = categories.map((c: any) => {
    const slug = (c.name || "")
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return {
      loc: `${BASE_URL}/category/${encodeURIComponent(slug)}`,
      lastmod: fmt(c.updated_at),
      changefreq: "daily" as const,
      priority: 0.8,
    };
  });

  const outDir = resolve("public");
  mkdirSync(outDir, { recursive: true });

  writeFileSync(resolve(outDir, "sitemap-pages.xml"), urlsetXml(pages));
  writeFileSync(
    resolve(outDir, "sitemap-products.xml"),
    urlsetXml(productEntries),
  );
  writeFileSync(
    resolve(outDir, "sitemap-categories.xml"),
    urlsetXml(categoryEntries),
  );

  const index = indexXml([
    { loc: `${BASE_URL}/sitemap-pages.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemap-categories.xml`, lastmod: today },
    { loc: `${BASE_URL}/sitemap-products.xml`, lastmod: today },
  ]);
  writeFileSync(resolve(outDir, "sitemap_index.xml"), index);
  // Also publish sitemap.xml as an alias of the index for crawlers that look there.
  writeFileSync(resolve(outDir, "sitemap.xml"), index);

  console.log(
    `[sitemap] wrote sitemap_index.xml (${pages.length} pages, ${categoryEntries.length} categories, ${productEntries.length} products)`,
  );
}

main().catch((err) => {
  console.error("[sitemap] generation failed", err);
  // Do not block builds — write a minimal fallback index pointing at root.
  const today = new Date().toISOString().split("T")[0];
  const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
</urlset>
`;
  try {
    writeFileSync(resolve("public/sitemap_index.xml"), fallback);
    writeFileSync(resolve("public/sitemap.xml"), fallback);
  } catch {}
});
