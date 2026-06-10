import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDoc } from "@/hooks/useDocs";
import { Skeleton } from "@/components/ui/skeleton";

const DocPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { doc, loading, error } = useDoc(slug);

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      <Link
        to="/admin/docs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All Docs
      </Link>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && (
        <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {doc && (
        <article>
          <header className="mb-6 pb-4 border-b border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {doc.category}
            </p>
            <h1 className="text-3xl font-medium tracking-tight mt-1">{doc.title}</h1>
            {doc.updated && (
              <p className="text-xs text-muted-foreground mt-2">
                Last updated {doc.updated}
              </p>
            )}
          </header>

          <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-pre:bg-muted prose-pre:text-foreground prose-code:before:hidden prose-code:after:hidden prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-a:text-foreground prose-a:underline-offset-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.body}</ReactMarkdown>
          </div>
        </article>
      )}
    </div>
  );
};

export default DocPage;
