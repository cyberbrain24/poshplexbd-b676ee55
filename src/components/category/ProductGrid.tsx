import { Card, CardContent } from "@/components/ui/card";
import { Link, useParams } from "react-router-dom";
import { useProductsList } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "./Pagination";

const ProductGrid = () => {
  const { category } = useParams();
  const { data: products, isLoading } = useProductsList();

  // Filter products based on category
  const filteredProducts = products?.filter(p => {
    if (!p.is_active) return false;
    if (!category || category === 'all') return true;
    // Match by category name (case-insensitive)
    return p.category?.name?.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase();
  }) || [];

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString()}`;
  };

  const getMainImage = (product: typeof filteredProducts[0]) => {
    const mainImage = product.images?.find(img => img.is_main);
    return mainImage?.image_url || product.images?.[0]?.image_url || '/placeholder.svg';
  };

  const getHoverImage = (product: typeof filteredProducts[0]) => {
    const images = product.images || [];
    if (images.length > 1) {
      const nonMainImage = images.find(img => !img.is_main);
      return nonMainImage?.image_url || images[1]?.image_url;
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

  if (filteredProducts.length === 0) {
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

  return (
    <section className="w-full px-6 mb-16">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map((product) => {
          const hoverImage = getHoverImage(product);
          
          return (
            <Link key={product.id} to={`/product/${product.id}`}>
              <Card className="border-none shadow-none bg-transparent group cursor-pointer">
                <CardContent className="p-0">
                  <div className="aspect-square mb-3 overflow-hidden bg-muted/10 relative">
                    <img
                      src={getMainImage(product)}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-all duration-300 ${hoverImage ? 'group-hover:opacity-0' : ''}`}
                    />
                    {hoverImage && (
                      <img
                        src={hoverImage}
                        alt={`${product.name} alternate`}
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-300 opacity-0 group-hover:opacity-100"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/[0.03]"></div>
                    {/* Check if product was created in last 7 days */}
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
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {filteredProducts.length > 24 && <Pagination />}
    </section>
  );
};

export default ProductGrid;
