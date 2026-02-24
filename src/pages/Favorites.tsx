import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { Button } from "@/components/ui/button";

const Favorites = () => {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PoshplexHeader />
      <main className="flex-1 px-4 md:px-8 py-8 pb-24">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground uppercase mb-6">
          My Favorites
        </h1>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/40 mb-4" strokeWidth={1} />
            <p className="text-muted-foreground text-sm mb-4">You haven't saved any favorites yet.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 text-xs font-bold tracking-widest uppercase hover:bg-foreground/90 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {favorites.map((item) => (
              <div key={item.id} className="group relative">
                <Link
                  to={`/product/${item.slug}`}
                  className="block relative aspect-[3/4] overflow-hidden bg-muted mb-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => removeFavorite(item.id)}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove from favorites"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>

                <div className="space-y-1">
                  <Link
                    to={`/product/${item.slug}`}
                    className="block text-xs font-medium text-foreground tracking-wide leading-tight hover:underline underline-offset-2 line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm font-bold text-foreground tracking-tight">
                    ৳{item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <PoshplexFooter />
    </div>
  );
};

export default Favorites;
