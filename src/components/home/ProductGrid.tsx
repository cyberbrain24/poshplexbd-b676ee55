import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useHomepageProducts } from "@/hooks/useHomepageProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductSlug } from "@/lib/slug";
import FavoriteButton from "@/components/product/FavoriteButton";
import ProductRatingBadge from "@/components/product/ProductRatingBadge";
import { useProductRatings } from "@/hooks/useProductRatings";

const ProductGrid = () => {
  const { data: products, isLoading } = useHomepageProducts();

  const displayProducts = products?.slice(0, 10) || [];
  const { data: ratings } = useProductRatings(displayProducts.map((p) => p.id));

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;

  const getMainImage = (product: typeof displayProducts[0]) => {
    const mainImage = product.images?.find(img => img.is_main);
    return mainImage?.image_url || product.images?.[0]?.image_url || '/placeholder.svg';
  };

  const getImageVariants = (product: typeof displayProducts[0]) => {
    const main = product.images?.find(img => img.is_main) || product.images?.[0];
    const src = main?.image_url || "/placeholder.svg";
    const medium = (main as any)?.medium_url as string | null | undefined;
    const large = (main as any)?.large_url as string | null | undefined;
    const parts: string[] = [];
    if (medium) parts.push(`${medium} 300w`);
    if (large) parts.push(`${large} 450w`);
    return { src: large || medium || src, srcSet: parts.length ? parts.join(", ") : undefined };
  };

  if (isLoading) {
    return (
      <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background relative overflow-hidden" style={{ minHeight: 600 }}>
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div className="relative">
            <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-normal text-foreground/[0.03] leading-none select-none">
              DROP
            </span>
            <h2 className="text-xl md:text-2xl font-normal tracking-[-0.02em] text-foreground uppercase">
              New Arrivals
            </h2>
            <div className="h-[2px] w-12 bg-foreground mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background" style={{ minHeight: 600 }}>
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div className="relative">
            <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-normal text-foreground/[0.03] leading-none select-none">
              DROP
            </span>
            <h2 className="text-xl md:text-2xl font-normal tracking-[-0.02em] text-foreground uppercase">
              New Arrivals
            </h2>
            <div className="h-[2px] w-12 bg-foreground mt-2" />
          </div>
        </div>
        <p className="text-center text-muted-foreground py-12 text-sm">No products available yet. Check back soon!</p>
      </section>
    );
  }

  return (
    <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background relative overflow-hidden" style={{ minHeight: 600, contain: 'layout style' }}>
      {/* Street culture background element — hidden on mobile to save GPU paint */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block" aria-hidden="true" style={{ contain: 'strict' }}>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-muted/30 to-transparent" />
        <div className="absolute bottom-0 left-0 text-[300px] font-normal text-foreground/[0.015] leading-none select-none -translate-x-1/4 translate-y-1/4">
          STREET
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-end justify-between mb-8 md:mb-12 relative z-10">
        <div className="relative">
          <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-normal text-foreground/[0.03] leading-none select-none">
            DROP
          </span>
          <h2 className="text-xl md:text-2xl font-normal tracking-[-0.02em] text-foreground uppercase">
            New Arrivals
          </h2>
          <div className="h-[2px] w-12 bg-foreground mt-2" />
        </div>
        <Link 
          to="/category/all"
          className="hidden md:flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
        >
          VIEW ALL
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 relative z-10">
        {displayProducts.map((product, index) => {
          const variants = getImageVariants(product);
          return (
          <div key={product.id} className="group relative">
            <Link 
              to={`/product/${generateProductSlug(product.name, product.id)}`}
              className="block relative aspect-[3/4] overflow-hidden bg-muted mb-3"
            >
              <img 
                src={variants.src}
                srcSet={variants.srcSet}
                alt={product.name}
                width={450}
                height={600}
                sizes="(min-width: 768px) 450px, 300px"
                loading={index < 4 ? "eager" : "lazy"}
                fetchPriority={index < 4 ? "high" : "auto"}
                decoding="async"
                className="w-full h-full object-cover object-center md:transition-all md:duration-500 md:group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-foreground/0 md:group-hover:bg-foreground/10 md:transition-colors md:duration-300" />
              
              <span className="absolute bottom-2 right-2 text-[10px] font-mono text-foreground/40 tracking-wider">
                {String(index + 1).padStart(2, '0')}
              </span>
              
              <div className="absolute top-0 left-0 flex items-center justify-between w-full">
                <span className="inline-block bg-foreground text-background px-2 py-1 text-[9px] font-bold tracking-[0.15em] uppercase">
                  New
                </span>
                <FavoriteButton
                  productId={product.id}
                  name={product.name}
                  price={product.base_price}
                  image={getMainImage(product)}
                  slug={generateProductSlug(product.name, product.id)}
                  className="bg-background/70 backdrop-blur-sm"
                  size={14}
                />
              </div>

              <button 
                className="absolute bottom-3 left-3 right-3 py-2.5 bg-background/95 md:backdrop-blur-sm text-foreground text-[10px] font-bold tracking-[0.1em] uppercase hidden md:flex opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 items-center justify-center gap-2 hover:bg-foreground hover:text-background"
                aria-label="Add to cart"
              >
                <ShoppingBag size={12} strokeWidth={2} />
                Quick Add
              </button>
            </Link>

            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase">
                {product.category?.name || 'Streetwear'}
              </p>
              <Link 
                to={`/product/${generateProductSlug(product.name, product.id)}`}
                className="block text-xs font-medium text-foreground tracking-wide leading-tight hover:underline underline-offset-2 line-clamp-2"
              >
                {product.name}
              </Link>
              <p className="text-sm font-bold text-foreground tracking-tight">
                {formatPrice(product.base_price)}
              </p>
              <ProductRatingBadge
                count={ratings?.[product.id]?.count ?? 0}
                average={ratings?.[product.id]?.average ?? 0}
              />
            </div>
          </div>
          );
        })}
      </div>

      {/* Mobile View All */}
      <div className="flex justify-center mt-10 md:hidden relative z-10">
        <Link 
          to="/category/all"
          className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-3 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors"
        >
          View All Products
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Desktop View All */}
      <div className="hidden md:flex justify-center mt-12 relative z-10">
        <Link 
          to="/category/all"
          className="group inline-flex items-center gap-3 border-2 border-foreground px-10 py-4 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-all duration-300"
        >
          Explore Full Collection
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};

export default ProductGrid;
