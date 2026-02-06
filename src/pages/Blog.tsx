import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { useBlogPosts, useBlogCategories } from "@/hooks/useBlog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const { data: posts = [], isLoading: postsLoading } = useBlogPosts("published");
  const { data: categories = [] } = useBlogCategories();

  const activeCategories = categories.filter(c => c.is_active);

  const filteredPosts = activeCategory
    ? posts.filter(post => post.category_id === activeCategory)
    : posts;

  return (
    <>
      <Helmet>
        <title>Blog | Poshplex</title>
        <meta name="description" content="Explore the latest streetwear trends, style guides, and Poshplex drops. Stay ahead of the culture." />
      </Helmet>

      <PoshplexHeader />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase">
            The Culture
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Style guides, drops, and everything streetwear.
          </p>
        </section>

        {/* Sticky Category Nav */}
        <nav className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex gap-6 overflow-x-auto py-4 no-scrollbar">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "whitespace-nowrap text-sm font-medium transition-colors",
                  activeCategory === null
                    ? "text-foreground border-b-2 border-foreground pb-1"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              {activeCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "whitespace-nowrap text-sm font-medium transition-colors",
                    activeCategory === category.id
                      ? "text-foreground border-b-2 border-foreground pb-1"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 py-12">
          {postsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-muted rounded-lg" />
                  <div className="mt-4 h-4 bg-muted rounded w-3/4" />
                  <div className="mt-2 h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted relative">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-6xl font-bold opacity-20">P</span>
                      </div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <div className="text-white">
                        <p className="text-xs uppercase tracking-wider mb-2">
                          {post.category?.name || "Uncategorized"}
                        </p>
                        <h3 className="text-xl font-bold">{post.title}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {post.category?.name || "Uncategorized"}
                      {post.published_at && (
                        <span className="ml-2">
                          • {format(new Date(post.published_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </p>
                    <h3 className="text-lg font-semibold mt-1 group-hover:underline">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <PoshplexFooter />
    </>
  );
};

export default Blog;
