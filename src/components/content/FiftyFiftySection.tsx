import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const FiftyFiftySection = () => {
  // Fetch first two categories with their first product image
  const { data: categories, isLoading } = useQuery({
    queryKey: ["featured-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .limit(2);
      
      if (error) throw error;
      
      // For each category, get the first product with an image
      const categoriesWithImages = await Promise.all(
        (data || []).map(async (category) => {
          const { data: products } = await supabase
            .from("products")
            .select(`
              id,
              name,
              images:product_images(image_url, is_main)
            `)
            .eq("category_id", category.id)
            .eq("is_active", true)
            .limit(1);
          
          const product = products?.[0];
          const image = product?.images?.find((img: any) => img.is_main)?.image_url 
            || product?.images?.[0]?.image_url 
            || '/placeholder.svg';
          
          return {
            ...category,
            image,
            slug: category.name.toLowerCase().replace(/\s+/g, '-'),
          };
        })
      );
      
      return categoriesWithImages;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <section className="w-full mb-16 px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="w-full aspect-square mb-3" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  const sectionContent = [
    {
      title: "Latest Collection",
      description: "Discover our newest arrivals with bold designs and premium quality",
    },
    {
      title: "Street Essentials",
      description: "Core pieces that define your everyday street style",
    },
  ];

  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => (
          <div key={category.id}>
            <Link to={`/category/${category.slug}`} className="block">
              <div className="w-full aspect-square mb-3 overflow-hidden">
                <img 
                  src={category.image} 
                  alt={`${category.name} collection`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
            <div>
              <h3 className="text-sm font-normal text-foreground mb-1">
                {sectionContent[index]?.title || category.name}
              </h3>
              <p className="text-sm font-light text-foreground">
                {sectionContent[index]?.description || `Explore our ${category.name} collection`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FiftyFiftySection;
