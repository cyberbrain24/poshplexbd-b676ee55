import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag as ShoppingBagIcon, Heart } from "lucide-react";
import { lazy, Suspense } from "react";
import AnnouncementBar from "./AnnouncementBar";
import ShoppingBag from "./ShoppingBag";

// Desktop-only: lazy-load to keep mobile bundle lean
const MegaMenu = lazy(() => import("./MegaMenu"));
const SearchOverlay = lazy(() => import("./SearchOverlay"));
const MobileMenu = lazy(() => import("./MobileMenu"));
import { useCategories } from "@/hooks/useMasterData";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useSiteBranding } from "@/hooks/useSiteBranding";
import { useFavorites } from "@/contexts/FavoritesContext";

interface SubcategoryItem {
  name: string;
  href: string;
  image_url: string | null;
}

interface NavItem {
  name: string;
  href: string;
  submenu: {
    subcategories: SubcategoryItem[];
    featured: { name: string; href: string }[];
  };
}

const isExternalLink = (path: string): boolean => {
  return path.startsWith("http://") || path.startsWith("https://");
};

const PoshplexHeader = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const navigate = useNavigate();
  const { data: allCategories = [] } = useCategories();
  const { cartItems, updateQuantity, cartCount } = useCart();
  const { data: branding } = useSiteBranding();
  const { favCount } = useFavorites();

  const SITE_NAME = branding?.site_name || "POSHPLEX";
  const SITE_LOGO_URL = branding?.logo_url || null;

  // Listen for open-shopping-bag event from Add to Bag button
  useEffect(() => {
    const handler = () => setIsCartOpen(true);
    window.addEventListener('open-shopping-bag', handler);
    return () => window.removeEventListener('open-shopping-bag', handler);
  }, []);

  // Check customer auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAccountClick = () => {
    if (isLoggedIn) {
      navigate("/account");
    } else {
      navigate("/login");
    }
  };

  // Build navigation items from categories (only active)
  const navItems: NavItem[] = useMemo(() => {
    const activeCats = allCategories.filter(c => c.is_active !== false);
    const parentCategories = activeCats.filter(c => !c.parent_id);
    
    return parentCategories.map(parent => {
      const subcategories = activeCats
        .filter(c => c.parent_id === parent.id)
        .map(c => ({
          name: c.name,
          href: `/category/${c.name.toLowerCase().replace(/\s+/g, '-')}`,
          image_url: c.image_url || null,
        }));
      
      return {
        name: parent.name.toUpperCase(),
        href: `/category/${parent.name.toLowerCase().replace(/\s+/g, '-')}`,
        submenu: {
          subcategories,
          featured: []
        }
      };
    });
  }, [allCategories]);

  const handleUpdateQuantity = (id: string, variantId: string | undefined, newQuantity: number) => {
    updateQuantity(id, variantId, newQuantity);
  };

  const renderNavLink = (item: NavItem) => {
    if (isExternalLink(item.href)) {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:text-nav-hover transition-colors text-sm font-medium tracking-wider py-6 block"
        >
          {item.name}
        </a>
      );
    }
    return (
      <Link
        to={item.href}
        className="text-foreground hover:text-nav-hover transition-colors text-sm font-medium tracking-wider py-6 block"
      >
        {item.name}
      </Link>
    );
  };

  return (
    <header className={`w-full sticky top-0 ${isCartOpen ? "z-[70]" : "z-50"} bg-background`}>
      <AnnouncementBar />
      <nav className="flex items-center justify-between h-14 px-6 border-b border-border">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 h-5 relative flex flex-col justify-between">
            <span className={`block w-6 h-0.5 bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
            }`} />
            <span className={`block w-6 h-0.5 bg-current transition-opacity duration-300 ${
              isMobileMenuOpen ? 'opacity-0' : ''
            }`} />
            <span className={`block w-6 h-0.5 bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`} />
          </div>
        </button>

        {/* Logo */}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
          {SITE_LOGO_URL ? (
            <img 
              src={SITE_LOGO_URL} 
              alt={SITE_NAME}
              className="h-8 object-contain"
            />
          ) : (
            <span className="text-2xl font-black tracking-tighter text-foreground">
              {SITE_NAME}
            </span>
          )}
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center space-x-8 ml-16">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setActiveDropdown(item.name)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              {renderNavLink(item)}
            </div>
          ))}
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-4">
          <button 
            className="p-2 text-foreground hover:text-nav-hover transition-colors"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search"
          >
            <Search size={20} strokeWidth={1.5} />
          </button>
          <Link
            to="/favorites"
            className="p-2 text-foreground hover:text-nav-hover transition-colors relative"
            aria-label="Favorites"
          >
            <Heart size={20} strokeWidth={1.5} />
            {favCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                {favCount}
              </span>
            )}
          </Link>
          <button
            onClick={handleAccountClick}
            className="hidden lg:block p-2 text-foreground hover:text-nav-hover transition-colors"
            aria-label="Account"
          >
            <User size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="hidden lg:block p-2 text-foreground hover:text-nav-hover transition-colors relative"
            aria-label="Shopping cart"
          >
            <ShoppingBagIcon size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mega Menu */}
      {activeDropdown && (
        <MegaMenu 
          activeItem={navItems.find(item => item.name === activeDropdown)!}
          onMouseEnter={() => setActiveDropdown(activeDropdown)}
          onMouseLeave={() => setActiveDropdown(null)}
        />
      )}

      {/* Search overlay */}
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}

      {/* Mobile menu */}
      <Suspense fallback={null}>
        <MobileMenu
          navItems={navItems}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </Suspense>

      {/* Shopping bag slide-out */}
      <ShoppingBag
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateQuantity={handleUpdateQuantity}
      />
    </header>
  );
};

export default PoshplexHeader;