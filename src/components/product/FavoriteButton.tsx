import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  className?: string;
  size?: number;
}

const FavoriteButton = ({ productId, name, price, image, slug, className, size = 16 }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite({ id: productId, name, price, image, slug });
      }}
      className={cn(
        "p-1.5 rounded-full transition-colors",
        active ? "text-red-500" : "text-foreground/60 hover:text-foreground",
        className
      )}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={size} strokeWidth={1.5} fill={active ? "currentColor" : "none"} />
    </button>
  );
};

export default FavoriteButton;
