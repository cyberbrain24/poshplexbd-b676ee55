import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, Sparkles } from "lucide-react";
import { useProductSearch, usePopularCategories } from "@/hooks/useProductSearch";
import { useAISearchSuggest } from "@/hooks/useAISearchSuggest";
import { generateProductSlug } from "@/lib/slug";
import { formatCurrency } from "@/lib/currency";

interface SearchOverlayProps {
  onClose: () => void;
}

const SearchOverlay = ({ onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: results = [], isLoading, isFetching } = useProductSearch(query);
  const { data: categories = [] } = usePopularCategories();
  const hasExactResults = results.length > 0;
  const { data: aiSuggest, isFetching: aiFetching } = useAISearchSuggest(query, hasExactResults);
  const existingIds = new Set(results.map((r) => r.id));
  const aiExtras = (aiSuggest?.products || []).filter((p) => !existingIds.has(p.id));

  const getMainImage = (images: { image_url: string; is_main: boolean }[]) => {
    const main = images.find((i) => i.is_main);
    return main?.image_url || images[0]?.image_url || "/placeholder.svg";
  };

  const getDisplayPrice = (product: (typeof results)[0]) => {
    const activeVariants = product.variants?.filter((v) => v.is_active) || [];
    if (activeVariants.length > 0) {
      const prices = activeVariants.map((v) => v.selling_price);
      const min = Math.min(...prices);
      return formatCurrency(min);
    }
    return formatCurrency(product.base_price);
  };

  const handleProductClick = useCallback(
    (product: (typeof results)[0]) => {
      const slug = generateProductSlug(product.name, product.id);
      navigate(`/product/${slug}`);
      onClose();
    },
    [navigate, onClose]
  );

  const handleCategoryClick = useCallback(
    (name: string) => {
      navigate(`/category/${name.toLowerCase().replace(/\s+/g, "-")}`);
      onClose();
    },
    [navigate, onClose]
  );

  const handleViewAll = useCallback(() => {
    if (query.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }, [query, navigate, onClose]);

  const showResults = query.trim().length >= 2;
  const showLoading = (isLoading || isFetching) && showResults;

  return (
    <div className="absolute top-full left-0 right-0 bg-background border-b border-border z-50 shadow-lg">
      <div className="px-6 py-6 max-w-2xl mx-auto">
        {/* Search input */}
        <div className="flex items-center border-b border-foreground pb-2">
          <Search size={20} className="text-foreground mr-3 shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH PRODUCTS..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm font-medium tracking-wider uppercase"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleViewAll();
              if (e.key === "Escape") onClose();
            }}
          />
          {showLoading && (
            <Loader2 size={18} className="text-muted-foreground animate-spin mr-2" />
          )}
          <button onClick={onClose} aria-label="Close search">
            <X size={20} className="text-foreground" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search results */}
        {showResults && !showLoading && results.length > 0 && (
          <div className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto">
            <p className="text-xs font-medium tracking-wider text-muted-foreground mb-2">
              {results.length} RESULT{results.length !== 1 ? "S" : ""} FOUND
            </p>
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="flex items-center gap-3 w-full p-2 hover:bg-muted/50 transition-colors text-left rounded"
              >
                <img
                  src={getMainImage(product.images)}
                  alt={product.name}
                  className="w-12 h-12 object-cover bg-muted shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.name}
                  </p>
                  {product.category && (
                    <p className="text-xs text-muted-foreground truncate">
                      {product.category.name}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0">
                  {getDisplayPrice(product)}
                </span>
              </button>
            ))}
            <button
              onClick={handleViewAll}
              className="w-full mt-2 py-2 text-center text-sm font-medium tracking-wider text-foreground border border-border hover:bg-foreground hover:text-background transition-colors"
            >
              VIEW ALL RESULTS
            </button>
          </div>
        )}

        {/* AI suggestions: show when query has results to enrich, OR when no exact results */}
        {showResults && !showLoading && (aiExtras.length > 0 || (!hasExactResults && aiSuggest?.message)) && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-foreground" strokeWidth={1.5} />
              <p className="text-xs font-medium tracking-wider text-muted-foreground">
                {hasExactResults ? "YOU MIGHT ALSO LIKE" : "DID YOU MEAN"}
              </p>
            </div>
            {aiSuggest?.message && !hasExactResults && (
              <p className="text-sm text-foreground mb-2">{aiSuggest.message}</p>
            )}
            <div className="space-y-1">
              {aiExtras.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="flex items-center gap-3 w-full p-2 hover:bg-muted/50 transition-colors text-left rounded"
                >
                  <img
                    src={getMainImage(product.images)}
                    alt={product.name}
                    className="w-12 h-12 object-cover bg-muted shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-muted-foreground truncate">
                        {product.category.name}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0">
                    {getDisplayPrice(product)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {showResults && !showLoading && results.length === 0 && aiExtras.length === 0 && !aiFetching && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              No products found for "<span className="text-foreground font-medium">{query}</span>"
            </p>
          </div>
        )}

        {/* AI loading hint when no exact results yet */}
        {showResults && !showLoading && results.length === 0 && aiFetching && (
          <div className="mt-6 text-center flex items-center justify-center gap-2 text-muted-foreground">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-sm">Searching with AI...</span>
          </div>
        )}

        {/* Default state: browse categories */}
        {!showResults && (
          <div className="mt-6">
            <p className="text-xs font-medium tracking-wider text-muted-foreground mb-3">
              BROWSE CATEGORIES
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="px-4 py-2 border border-border text-sm font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
