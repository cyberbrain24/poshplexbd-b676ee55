import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, User, ShoppingBag as ShoppingBagIcon, X } from "lucide-react";
import MegaMenu from "./MegaMenu";
import MobileMenu from "./MobileMenu";
import ShoppingBag from "./ShoppingBag";
import { useCategories } from "@/hooks/useMasterData";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { isExternalLink } from "@/hooks/useSiteSettings";

interface NavItem {
  name: string;
  href: string;
  submenu: {
    categories: string[];
    featured: { name: string; href: string }[];
  };
}

const PoshplexHeader = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { data: allCategories = [] } = useCategories();
  const { cartItems, updateQuantity, cartCount } = useCart();
  const { settings } = useSiteSettingsContext();

  // Build navigation items from site settings (if available) or fall back to categories
  const navItems: NavItem[] = useMemo(() => {
    // If we have header menu from settings, use that
    if (settings.header_menu && settings.header_menu.length > 0) {
      return settings.header_menu.map(item => ({
        name: item.label.toUpperCase(),
        href: item.path,
        submenu: {
          categories: [],
          featured: []
        }
      }));
    }
    
    // Fallback to database categories
    const parentCategories = allCategories.filter(c => !c.parent_id);
    
    return parentCategories.map(parent => {
      const subcategories = allCategories
        .filter(c => c.parent_id === parent.id)
        .map(c => c.name);
      
      return {
        name: parent.name.toUpperCase(),
        href: `/category/${parent.name.toLowerCase().replace(/\s+/g, '-')}`,
        submenu: {
          categories: subcategories,
          featured: []
        }
      };
    });
  }, [allCategories, settings.header_menu]);

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
    <header className="w-full sticky top-0 z-50 bg-background border-b border-border">
      <nav className="flex items-center justify-between h-16 px-6">
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
          {settings.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt={settings.site_name}
              className="h-8 object-contain"
            />
          ) : (
            <span className="text-2xl font-black tracking-tighter text-foreground">
              {settings.site_name.toUpperCase()}
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
            to="/auth"
            className="hidden lg:block p-2 text-foreground hover:text-nav-hover transition-colors"
            aria-label="Account"
          >
            <User size={20} strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 text-foreground hover:text-nav-hover transition-colors relative"
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
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b border-border z-50">
          <div className="px-6 py-8 max-w-2xl mx-auto">
            <div className="flex items-center border-b border-foreground pb-2">
              <Search size={20} className="text-foreground mr-3" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="SEARCH..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm font-medium tracking-wider uppercase"
                autoFocus
              />
              <button onClick={() => setIsSearchOpen(false)}>
                <X size={20} className="text-foreground" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-6">
              <p className="text-xs font-medium tracking-wider text-muted-foreground mb-3">POPULAR SEARCHES</p>
              <div className="flex flex-wrap gap-2">
                {["Oversized Hoodies", "Cargo Pants", "Black Tees", "Bomber Jackets"].map((term) => (
                  <button
                    key={term}
                    className="px-4 py-2 border border-border text-sm font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <MobileMenu 
          navItems={navItems} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}

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
