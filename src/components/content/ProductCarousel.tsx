import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useProductsList } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { generateProductSlug } from "@/lib/slug";

const ProductCarousel = () => {
  const { data: products, isLoading } = useProductsList(8);

  if (isLoading) {
    return (
      <section className="w-full mb-16 px-6">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
              <Skeleton className="aspect-square mb-3" />
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-16 px-6">
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => {
            const mainImage = product.images?.find((img) => img.is_main)?.image_url 
              || product.images?.[0]?.image_url 
              || '/placeholder.svg';
            const categoryName = product.category?.name || 'Apparel';
            const slug = generateProductSlug(product.name, product.id);

            return (
              <CarouselItem
                key={product.id}
                className="basis-1/2 md:basis-1/3 lg:basis-1/4 pr-2 md:pr-4"
              >
                <Link to={`/product/${slug}`}>
                  <Card className="border-none shadow-none bg-transparent group">
                    <CardContent className="p-0">
                      <div className="aspect-square mb-3 overflow-hidden bg-muted/10 relative">
                        <img
                          src={mainImage}
                          alt={product.name}
                          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/[0.03]"></div>
                      </div>
                      <p className="text-xs font-light text-muted-foreground mb-0.5">
                        {categoryName}
                      </p>
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs font-light text-foreground">
                        ৳{product.base_price?.toLocaleString() || '0'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductCarousel;
