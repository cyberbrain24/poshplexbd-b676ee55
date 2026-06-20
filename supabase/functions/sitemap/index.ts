import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";

const SITE_URL = "https://poshplexbd.com";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function generateSitemapXML(entries: SitemapEntry[]): string {
  const urlElements = entries
    .map((entry) => {
      let xml = `  <url>\n    <loc>${entry.loc}</loc>`;
      if (entry.lastmod) {
        xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
      }
      if (entry.changefreq) {
        xml += `\n    <changefreq>${entry.changefreq}</changefreq>`;
      }
      if (entry.priority !== undefined) {
        xml += `\n    <priority>${entry.priority.toFixed(1)}</priority>`;
      }
      xml += "\n  </url>";
      return xml;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return new Date().toISOString().split("T")[0];
  return new Date(dateString).toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  // Rate limiting
  const ip = getClientIP(req);
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return rateLimitResponse(corsHeaders, retryAfter);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const entries: SitemapEntry[] = [];

    const staticPages = [
      { path: "/", priority: 1.0, changefreq: "daily" as const },
      { path: "/category/all", priority: 0.9, changefreq: "daily" as const },
      { path: "/about/our-story", priority: 0.6, changefreq: "monthly" as const },
      { path: "/about/sustainability", priority: 0.5, changefreq: "monthly" as const },
      { path: "/about/size-guide", priority: 0.5, changefreq: "monthly" as const },
      { path: "/about/customer-care", priority: 0.5, changefreq: "monthly" as const },
      { path: "/about/store-locator", priority: 0.5, changefreq: "monthly" as const },
      { path: "/privacy-policy", priority: 0.3, changefreq: "yearly" as const },
      { path: "/terms-of-service", priority: 0.3, changefreq: "yearly" as const },
    ];

    staticPages.forEach((page) => {
      entries.push({
        loc: `${SITE_URL}${page.path}`,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (!productsError && products) {
      products.forEach((product) => {
        entries.push({
          loc: `${SITE_URL}/product/${product.id}`,
          lastmod: formatDate(product.updated_at),
          changefreq: "weekly",
          priority: 0.8,
        });
      });
    }

    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("name, updated_at")
      .limit(100);

    if (!categoriesError && categories) {
      categories.forEach((category) => {
        const slug = category.name.toLowerCase().replace(/\s+/g, "-");
        entries.push({
          loc: `${SITE_URL}/category/${slug}`,
          lastmod: formatDate(category.updated_at),
          changefreq: "daily",
          priority: 0.8,
        });
      });
    }

    console.log(`Generating sitemap with ${entries.length} URLs`);
    const xml = generateSitemapXML(entries);

    return new Response(xml, { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" } 
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" } }
    );
  }
});
