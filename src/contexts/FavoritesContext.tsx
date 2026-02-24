import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  addedAt: number;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  favCount: number;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, "addedAt">) => void;
  removeFavorite: (productId: string) => void;
}

const STORAGE_KEY = "poshplex_favorites";

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const loadFavorites = (): FavoriteItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback(
    (productId: string) => favorites.some((f) => f.id === productId),
    [favorites]
  );

  const toggleFavorite = useCallback((item: Omit<FavoriteItem, "addedAt">) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === item.id);
      if (exists) return prev.filter((f) => f.id !== item.id);
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const removeFavorite = useCallback((productId: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== productId));
  }, []);

  return (
    <FavoritesContext.Provider
      value={{ favorites, favCount: favorites.length, isFavorite, toggleFavorite, removeFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
