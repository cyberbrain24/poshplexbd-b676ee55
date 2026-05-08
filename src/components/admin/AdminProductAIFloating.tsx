import { useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminProductAI = lazy(() => import("./AdminProductAI"));

/**
 * Floating AI assistant button — only visible on product-related admin pages.
 */
export default function AdminProductAIFloating() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Only show on product-related pages
  const isProductPage = pathname.startsWith("/admin/products") || pathname === "/admin/bulk-upload";
  if (!isProductPage) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[420px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-lg overflow-hidden">
          <div className="absolute -top-2 -right-2 z-10">
            <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Suspense fallback={<div className="h-96 bg-background border border-border rounded-lg flex items-center justify-center text-sm">Loading…</div>}>
            <AdminProductAI embedded />
          </Suspense>
        </div>
      )}
    </>
  );
}
