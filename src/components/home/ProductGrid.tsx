import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductSlug } from "@/lib/slug";

const ProductGrid = () => {
  const { data: products, isLoading } = useProducts();

  // Get first 4 active products for homepage
  const displayProducts = products?.filter(p => p.is_active).slice(0, 4) || [];

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  const getMainImage = (product: typeof displayProducts[0]) => {
    const mainImage = product.images?.find(img => img.is_main);
    return mainImage?.image_url || product.images?.[0]?.image_url || '/placeholder.svg';
  };

  if (isLoading) {
    return (
      <section className="w-full px-6 py-20">
        <div className="flex items-baseline gap-4 mb-10">
          <span className="text-6xl md:text-8xl font-black text-muted-foreground/30">02</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">NEW ARRIVALS</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <section className="w-full px-6 py-20">
        <div className="flex items-baseline gap-4 mb-10">
          <span className="text-6xl md:text-8xl font-black text-muted-foreground/30">02</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">NEW ARRIVALS</h2>
        </div>
        <p className="text-center text-muted-foreground py-12">No products available yet. Check back soon!</p>
      </section>
    );
  }

  return (
    <section className="w-full px-6 py-20">
      {/* Section Header */}
      <div className="flex items-baseline gap-4 mb-10">
        <span className="text-6xl md:text-8xl font-black text-muted-foreground/30">
          02
        </span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
          NEW ARRIVALS
        </h2>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {displayProducts.map((product) => (
          <div key={product.id} className="group">
            {/* Product Image */}
            <Link 
              to={`/product/${generateProductSlug(product.name, product.id)}`}
              className="block relative bg-slate-muted aspect-[3/4] overflow-hidden mb-4"
            >
              <img 
                src={getMainImage(product)}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <span className="bg-foreground text-background px-2 py-1 text-[10px] font-medium tracking-wider">
                  NEW
                </span>
              </div>
            </Link>

            {/* Product Info */}
            <div>
              <p className="text-xs text-muted-foreground mb-1 tracking-wide">
                {product.category?.name || 'Uncategorized'}
              </p>
              <Link 
                to={`/product/${generateProductSlug(product.name, product.id)}`}
                className="block text-sm font-medium text-foreground tracking-wide mb-2 hover:text-nav-hover transition-colors"
              >
                {product.name}
              </Link>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatPrice(product.base_price)}
                  </span>
                </div>
                
                <button 
                  className="p-2 border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
                  aria-label="Add to cart"
                >
                  <ShoppingBag size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-12">
        <Link 
          to="/category/all"
          className="inline-flex items-center gap-2 border border-foreground px-8 py-4 text-sm font-medium tracking-wider hover:bg-foreground hover:text-background transition-colors"
        >
          VIEW ALL PRODUCTS
        </Link>
      </div>
    </section>
  );
};

export default ProductGrid;
