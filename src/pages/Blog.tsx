import { Link } from "react-router-dom";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { usePublishedPosts, useActiveBlogCategories } from "@/hooks/useBlog";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const PAGE_SIZE = 12;

const Blog = () => {
  const [page, setPage] = useState(0);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const { data, isLoading } = usePublishedPosts({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, categorySlug });
  const { data: categories } = useActiveBlogCategories();

  const posts = data?.posts || [];
  const total = data?.total || 0;
  const hasMore = (page + 1) * PAGE_SIZE < total;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Blog — POSHPLEX | Streetwear stories, style guides & news</title>
        <meta name="description" content="Read the latest from POSHPLEX: streetwear style guides, drop announcements, behind-the-brand stories, and Bangladesh fashion culture." />
        <link rel="canonical" href="https://poshplexbd.com/blog" />
        <meta property="og:title" content="POSHPLEX Blog" />
        <meta property="og:description" content="Streetwear stories, style guides, and drops from POSHPLEX." />
        <meta property="og:url" content="https://poshplexbd.com/blog" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "POSHPLEX Blog",
          url: "https://poshplexbd.com/blog",
          publisher: { "@type": "Organization", name: "POSHPLEX" },
        })}</script>
      </Helmet>

      <PoshplexHeader />
      <main className="flex-1 px-4 md:px-8 py-8 pb-24 max-w-7xl mx-auto w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight uppercase">The Journal</h1>
          <p className="text-sm text-muted-foreground mt-2">Stories, style guides, and drops from POSHPLEX.</p>
        </header>

        {(categories?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => { setCategorySlug(undefined); setPage(0); }}
              className={`text-xs uppercase tracking-widest px-3 py-1.5 border ${!categorySlug ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
            >All</button>
            {categories!.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCategorySlug(c.slug); setPage(0); }}
                className={`text-xs uppercase tracking-widest px-3 py-1.5 border ${categorySlug === c.slug ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}
              >{c.name}</button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No posts yet. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <article key={p.id} className="group">
                <Link to={`/blog/${p.slug}`} className="block">
                  <div className="aspect-[4/3] bg-muted overflow-hidden mb-3 rounded-md">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.cover_image_alt || p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">POSHPLEX</div>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    {p.published_at ? format(new Date(p.published_at), "MMM d, yyyy") : ""} · {p.reading_time_minutes} min read
                  </div>
                  <h2 className="text-base font-bold uppercase tracking-tight group-hover:underline">{p.title}</h2>
                  {p.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</p>}
                </Link>
              </article>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-10">
            <Button variant="outline" onClick={() => setPage(page + 1)}>Load more</Button>
          </div>
        )}
      </main>
      <PoshplexFooter />
    </div>
  );
};

export default Blog;
