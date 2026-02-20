import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductSlug } from "@/lib/slug";

const ProductGrid = () => {
  const { data: products, isLoading } = useProducts();

  // Get first 10 active products for homepage (5 columns x 2 rows)
  const displayProducts = products?.filter(p => p.is_active).slice(0, 10) || [];

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  const getMainImage = (product: typeof displayProducts[0]) => {
    const mainImage = product.images?.find(img => img.is_main);
    return mainImage?.image_url || product.images?.[0]?.image_url || '/placeholder.svg';
  };

  if (isLoading) {
    return (
      <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background relative overflow-hidden min-h-[600px]">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div className="relative">
            <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-black text-foreground/[0.03] leading-none select-none">
              DROP
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-[-0.02em] text-foreground uppercase">
              New Arrivals
            </h2>
            <div className="h-[2px] w-12 bg-foreground mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
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
      <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background min-h-[600px]">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div className="relative">
            <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-black text-foreground/[0.03] leading-none select-none">
              DROP
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-[-0.02em] text-foreground uppercase">
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
    <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background relative overflow-hidden">
      {/* Street culture background element */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-muted/30 to-transparent" />
        <div className="absolute bottom-0 left-0 text-[200px] md:text-[300px] font-black text-foreground/[0.015] leading-none select-none -translate-x-1/4 translate-y-1/4">
          STREET
        </div>
      </div>

      {/* Section Header - Urban style */}
      <div className="flex items-end justify-between mb-8 md:mb-12 relative z-10">
        <div className="relative">
          <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-black text-foreground/[0.03] leading-none select-none">
            DROP
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-[-0.02em] text-foreground uppercase">
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

      {/* 5-Column Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 relative z-10">
        {displayProducts.map((product, index) => (
          <div 
            key={product.id} 
            className="group relative"
          >
            {/* Product Image Container */}
            <Link 
              to={`/product/${generateProductSlug(product.name, product.id)}`}
              className="block relative aspect-[3/4] overflow-hidden bg-muted mb-3"
            >
              {/* Image */}
              <img 
                src={getMainImage(product)}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
              
              {/* Index number - street style */}
              <span className="absolute bottom-2 right-2 text-[10px] font-mono text-foreground/40 tracking-wider">
                {String(index + 1).padStart(2, '0')}
              </span>
              
              {/* Badge */}
              <div className="absolute top-0 left-0">
                <span className="inline-block bg-foreground text-background px-2 py-1 text-[9px] font-bold tracking-[0.15em] uppercase">
                  New
                </span>
              </div>

              {/* Quick add button - appears on hover */}
              <button 
                className="absolute bottom-3 left-3 right-3 py-2.5 bg-background/95 backdrop-blur-sm text-foreground text-[10px] font-bold tracking-[0.1em] uppercase opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 hover:bg-foreground hover:text-background"
                aria-label="Add to cart"
              >
                <ShoppingBag size={12} strokeWidth={2} />
                Quick Add
              </button>
            </Link>

            {/* Product Info */}
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
            </div>
          </div>
        ))}
      </div>

      {/* Mobile View All Button */}
      <div className="flex justify-center mt-10 md:hidden relative z-10">
        <Link 
          to="/category/all"
          className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-3 text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-colors"
        >
          View All Products
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Desktop View All Button */}
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
