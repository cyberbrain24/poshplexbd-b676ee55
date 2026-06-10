import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, BookOpen } from "lucide-react";
import { useDocsIndex } from "@/hooks/useDocs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const DocsIndex = () => {
  const { docs, byCategory, loading } = useDocsIndex();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return byCategory;
    const needle = q.toLowerCase();
    const out: typeof byCategory = [];
    byCategory.forEach(([cat, items]) => {
      const m = items.filter(
        (i) =>
          i.title.toLowerCase().includes(needle) ||
          cat.toLowerCase().includes(needle)
      );
      if (m.length) out.push([cat, m]);
    });
    return out;
  }, [byCategory, q]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Documentation
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reference for APIs, edge functions, integrations, and complex modules.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search docs…"
            className="pl-9"
          />
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed border-border p-8 text-center">
          No documents match "{q}".
        </div>
      )}

      <div className="space-y-6">
        {filtered.map(([cat, items]) => (
          <section key={cat} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((d) => (
                <Link
                  key={d.slug}
                  to={`/admin/docs/${d.slug}`}
                  className="group block border border-border bg-card p-4 hover:border-foreground transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{d.title}</p>
                      {d.updated && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Updated {d.updated}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!loading && docs.length > 0 && (
        <p className="text-[11px] text-muted-foreground pt-4 border-t border-border">
          {docs.length} document{docs.length !== 1 ? "s" : ""} • Edit at{" "}
          <code className="font-mono">src/content/docs/*.md</code>
        </p>
      )}
    </div>
  );
};

export default DocsIndex;
