import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRelatedProducts } from "@/hooks/useRelatedProducts";
import { Product } from "@/types/product";
import { generateProductSlug } from "@/lib/slug";

interface RelatedProductsProps {
  productId: string | undefined;
  categoryId: string | null | undefined;
  categoryName?: string;
  title?: string;
}

const RelatedProducts = ({
  productId,
  categoryId,
  categoryName,
  title = "You might also like",
}: RelatedProductsProps) => {
  const { data: products, isLoading } = useRelatedProducts(
    productId,
    categoryId,
    6
  );

  if (isLoading) {
    return (
      <section className="w-full px-6 mb-16">
        <h5 className="text-sm font-light text-foreground mb-4">{title}</h5>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  const getProductImage = (product: Product) => {
    const mainImage = product.images?.find((img) => img.is_main);
    return mainImage?.image_url || product.images?.[0]?.image_url || "/placeholder.svg";
  };

  const getProductPrice = (product: Product) => {
    // Get lowest active variant price or base price
    const activeVariants = product.variants?.filter((v) => v.is_active) || [];
    if (activeVariants.length > 0) {
      const lowestPrice = Math.min(...activeVariants.map((v) => v.selling_price));
      return lowestPrice;
    }
    return product.base_price;
  };

  return (
    <section className="w-full px-6 mb-16">
      <h5 className="text-sm font-light text-foreground mb-4">{title}</h5>
      {/* Grid: 3 cols on mobile (2 rows of 3), 6 cols on desktop (1 row of 6) */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {products.slice(0, 6).map((product) => (
          <Link key={product.id} to={`/product/${generateProductSlug(product.name, product.id)}`}>
            <Card className="border-none shadow-none bg-transparent group">
              <CardContent className="p-0">
                <div className="aspect-square mb-2 overflow-hidden bg-muted/10 relative">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-light text-muted-foreground truncate">
                    {product.category?.name || categoryName || "Product"}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5">
                    <h3 className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-light text-foreground whitespace-nowrap">
                      ৳{getProductPrice(product).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
