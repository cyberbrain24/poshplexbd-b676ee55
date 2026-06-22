import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "react-router-dom";
import { useOptimizedCategoryProducts } from "@/hooks/useOptimizedProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generateProductSlug } from "@/lib/slug";
import FavoriteButton from "@/components/product/FavoriteButton";
import ProductRatingBadge from "@/components/product/ProductRatingBadge";
import { useProductRatings } from "@/hooks/useProductRatings";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import { Helmet } from "react-helmet-async";
import type { SortOption, ProductFilters } from "./FilterSortBar";


interface ProductGridProps {
  sortBy?: SortOption;
  filters?: ProductFilters;
}

const ProductGrid = ({ sortBy = "newest", filters }: ProductGridProps) => {
  const { category } = useParams();
  const { products, isLoading, isLoadingMore, totalCount, hasMore, loadMore } = useOptimizedCategoryProducts(category, sortBy, filters);
  const { data: ratings } = useProductRatings(products.map((p) => p.id));

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  const getMainImage = (product: typeof products[0]) => {
    const mainImage = product.images?.find(img => img.is_main);
    const chosen = mainImage || product.images?.[0];
    return {
      src: chosen?.image_url || '/placeholder.svg',
      thumb: (chosen as any)?.thumb_url ?? null,
      medium: (chosen as any)?.medium_url ?? null,
      large: (chosen as any)?.large_url ?? null,
    };
  };

  const getHoverImage = (product: typeof products[0]) => {
    const images = product.images || [];
    if (images.length > 1) {
      const nonMainImage = images.find(img => !img.is_main);
      const chosen = nonMainImage || images[1];
      if (!chosen) return null;
      return {
        src: chosen.image_url,
        thumb: (chosen as any)?.thumb_url ?? null,
        medium: (chosen as any)?.medium_url ?? null,
        large: (chosen as any)?.large_url ?? null,
      };
    }
    return null;
  };

  if (isLoading) {
    return (
      <section className="w-full px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0 && !isLoading) {
    return (
      <section className="w-full px-6 mb-16">
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No products found in this category.</p>
          <Link 
            to="/category/all" 
            className="inline-block mt-4 text-foreground underline hover:no-underline"
          >
            View all products
          </Link>
        </div>
      </section>
    );
  }

  const lcpImage = products[0] ? getMainImage(products[0]) : null;
  const lcpHref = lcpImage ? (lcpImage.medium || lcpImage.large || lcpImage.src) : null;

  return (
    <section className="w-full px-6 mb-16">
      {lcpHref && (
        <Helmet>
          <link rel="preload" as="image" href={lcpHref} fetchPriority="high" />
        </Helmet>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

        {products.map((product, index) => {
          const mainImage = getMainImage(product);
          const isAboveFold = index < 4;

          return (
            <Link key={product.id} to={`/product/${generateProductSlug(product.name, product.id)}`}>
              <Card className="border-none shadow-none bg-transparent group cursor-pointer">
                <CardContent className="p-0">
                  <div className="aspect-square mb-3 overflow-hidden bg-muted/10 relative">
                    <ResponsiveImage
                      src={mainImage.src}
                      thumbUrl={mainImage.thumb}
                      mediumUrl={mainImage.medium}
                      largeUrl={mainImage.large}
                      alt={product.name}
                      preset="grid"
                      priority={isAboveFold}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/[0.03] pointer-events-none"></div>
                    {/* Favorite button */}
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton
                        productId={product.id}
                        name={product.name}
                        price={product.base_price}
                        image={mainImage.src}
                        slug={generateProductSlug(product.name, product.id)}
                        className="bg-background/70 backdrop-blur-sm"
                        size={14}
                      />
                    </div>
                    {new Date(product.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                      <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium text-black">
                        NEW
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-light text-foreground">
                      {product.category?.name || 'Uncategorized'}
                    </p>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-sm font-light text-foreground">
                        {formatPrice(product.base_price)}
                      </p>
                    </div>
                    <ProductRatingBadge
                      count={ratings?.[product.id]?.count ?? 0}
                      average={ratings?.[product.id]?.average ?? 0}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-10">
          <Button
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="min-w-[200px]"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More (${products.length} of ${totalCount})`
            )}
          </Button>
        </div>
      )}
      
      {!hasMore && products.length > 0 && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          Showing all {totalCount} products
        </p>
      )}
    </section>
  );
};

export default ProductGrid;
