import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useMasterData";

interface CategoryHeaderProps {
  category: string;
  categorySlug?: string;
}

const CategoryHeader = ({ category, categorySlug }: CategoryHeaderProps) => {
  const { data: categories = [] } = useCategories();

  // Find the current category by matching slug to name
  const currentCategory = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === categorySlug
  );

  // Get subcategories of the current category
  const subcategories = currentCategory
    ? categories.filter((c) => c.parent_id === currentCategory.id)
    : [];

  return (
    <section className="w-full px-4 md:px-6 mb-4">
      <h1 className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
        {category}
      </h1>

      {subcategories.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3">
          {subcategories.map((sub) => {
            const slug = sub.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <Link
                key={sub.id}
                to={`/category/${slug}`}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                {sub.image_url ? (
                  <img
                    src={sub.image_url}
                    alt={sub.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-semibold uppercase tracking-wider leading-tight">
                  {sub.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CategoryHeader;
