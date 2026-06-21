import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductSlug } from "@/lib/slug";
import FavoriteButton from "@/components/product/FavoriteButton";
import ProductRatingBadge from "@/components/product/ProductRatingBadge";
import { useProductRatings } from "@/hooks/useProductRatings";

const FeaturedProducts = () => {
  const { data: products, isLoading } = useFeaturedProducts();
  const { data: ratings } = useProductRatings((products ?? []).map((p) => p.id));

  const formatPrice = (price: number) => `৳${price.toLocaleString()}`;

  const getMainImage = (product: NonNullable<typeof products>[0]) => {
    const mainImage = product.images?.find(img => img.is_main);
    return mainImage?.image_url || product.images?.[0]?.image_url || "/placeholder.svg";
  };

  const getImageVariants = (product: NonNullable<typeof products>[0]) => {
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
      <section className="w-full px-4 md:px-8 py-8 md:py-12 bg-background">
        <div className="flex items-baseline gap-3 md:gap-4 mb-6 md:mb-8">
          <span className="text-5xl md:text-8xl font-normal text-muted-foreground/30">02</span>
          <h2 className="text-xl md:text-3xl font-normal tracking-tight text-foreground uppercase">Featured</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 5 }, (_, i) => (
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

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full px-4 md:px-8 py-8 md:py-12 bg-background">
      <div className="flex items-baseline gap-3 md:gap-4 mb-6 md:mb-8">
        <span className="text-5xl md:text-8xl font-normal text-muted-foreground/30">02</span>
        <h2 className="text-xl md:text-3xl font-normal tracking-tight text-foreground uppercase">Featured</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {products.map((product, index) => {
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
                sizes="(min-width: 768px) 450px, 300px"
                alt={product.name}
                width={450}
                height={600}
                loading="lazy"
                className="w-full h-full object-cover object-center md:transition-all md:duration-500 md:group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 md:group-hover:bg-foreground/10 md:transition-colors md:duration-300" />

              <div className="absolute top-0 left-0 flex items-center justify-between w-full">
                <span className="inline-block bg-primary text-primary-foreground px-2 py-1 text-[9px] font-bold tracking-[0.15em] uppercase">
                  Featured
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
            </Link>

            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase">
                {product.category?.name || "Streetwear"}
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
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
