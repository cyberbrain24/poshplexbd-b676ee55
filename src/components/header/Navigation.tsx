import { ArrowRight, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ShoppingBag from "./ShoppingBag";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface CategoryWithChildren extends Category {
  children: Category[];
}

// Hardcoded site settings
const SITE_NAME = "POSHPLEX";
const SITE_LOGO_URL: string | null = null;

const Navigation = () => {
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [offCanvasType, setOffCanvasType] = useState<'favorites' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoppingBagOpen, setIsShoppingBagOpen] = useState(false);
  const [parentCategories, setParentCategories] = useState<CategoryWithChildren[]>([]);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  
  const { cartItems, updateQuantity, cartCount } = useCart();

  const handleUpdateQuantity = (id: string, variantId: string | undefined, newQuantity: number) => {
    updateQuantity(id, variantId, newQuantity);
  };

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: allCategories } = await supabase
        .from('categories')
        .select('id, name, parent_id')
        .order('name');
      
      if (allCategories) {
        const parents = allCategories.filter(c => c.parent_id === null);
        const children = allCategories.filter(c => c.parent_id !== null);
        
        const categoriesWithChildren: CategoryWithChildren[] = parents.map(parent => ({
          ...parent,
          children: children.filter(child => child.parent_id === parent.id)
        }));
        
        setParentCategories(categoriesWithChildren);
      }
    };
    
    fetchCategories();
  }, []);

  // Static navigation items
  const navItems = [
    { name: "SHOP", href: "/category/all", hasMegaMenu: true },
    { name: "NEW ARRIVALS", href: "/category/new-arrivals", hasMegaMenu: false },
    { name: "BLOG", href: "/blog", hasMegaMenu: false },
    { name: "ABOUT", href: "/about/our-story", hasMegaMenu: false },
  ];

  return (
    <nav className="relative bg-white border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile hamburger button */}
        <button
          className="lg:hidden p-2 mt-0.5 text-foreground hover:text-muted-foreground transition-colors duration-200"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-5 relative">
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 top-2.5' : 'top-1.5'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 top-2.5 ${
              isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 top-2.5' : 'top-3.5'
            }`}></span>
          </div>
        </button>

        {/* Left - Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="block">
            {SITE_LOGO_URL ? (
              <img 
                src={SITE_LOGO_URL} 
                alt={SITE_NAME} 
                className="h-5 w-auto"
              />
            ) : (
              <span className="text-lg font-bold tracking-wider text-foreground">
                {SITE_NAME}
              </span>
            )}
          </Link>
        </div>

        {/* Center - Navigation */}
        <div className="hidden lg:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => item.hasMegaMenu && setIsShopMenuOpen(true)}
              onMouseLeave={() => item.hasMegaMenu && setIsShopMenuOpen(false)}
            >
              <Link
                to={item.href}
                className="text-foreground hover:text-muted-foreground transition-colors duration-200 text-xs font-medium tracking-wide py-6 block"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-1">
          <button 
            className="p-2 text-foreground hover:text-muted-foreground transition-colors duration-200"
            aria-label="Search"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <Link 
            to="/customer-auth"
            className="hidden lg:block p-2 text-foreground hover:text-muted-foreground transition-colors duration-200"
            aria-label="Account"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </Link>
          <button 
            className="p-2 text-foreground hover:text-muted-foreground transition-colors duration-200 relative"
            aria-label="Shopping bag"
            onClick={() => setIsShoppingBagOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[30%] text-[0.5rem] font-semibold text-foreground pointer-events-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SHOP Mega Menu - Categories */}
      {isShopMenuOpen && (
        <div 
          className="absolute top-full left-0 right-0 bg-white border-b border-border z-50 shadow-lg"
          onMouseEnter={() => setIsShopMenuOpen(true)}
          onMouseLeave={() => setIsShopMenuOpen(false)}
        >
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {parentCategories.map((category) => (
                  <div key={category.id}>
                    <Link
                      to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-xs font-semibold tracking-wider text-foreground hover:text-muted-foreground mb-3 block"
                      onClick={() => setIsShopMenuOpen(false)}
                    >
                      {category.name.toUpperCase()}
                    </Link>
                    {category.children.length > 0 && (
                      <ul className="space-y-2">
                        {category.children.map((subcategory) => (
                          <li key={subcategory.id}>
                            <Link 
                              to={`/category/${subcategory.name.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 block"
                              onClick={() => setIsShopMenuOpen(false)}
                            >
                              {subcategory.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              
              {/* View All */}
              <div className="mt-8 pt-6 border-t border-border">
                <Link 
                  to="/category/all"
                  className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-foreground hover:text-muted-foreground transition-colors"
                  onClick={() => setIsShopMenuOpen(false)}
                >
                  VIEW ALL PRODUCTS
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-border z-50 shadow-lg">
          <div className="px-6 py-8">
            <div className="max-w-2xl mx-auto">
              <div className="relative mb-6">
                <div className="flex items-center border-b border-border pb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-muted-foreground mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for products..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-lg"
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground mb-3">POPULAR CATEGORIES</p>
                <div className="flex flex-wrap gap-2">
                  {parentCategories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="text-sm text-foreground hover:text-muted-foreground py-1.5 px-3 border border-border rounded-full transition-colors duration-200"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-border z-50 shadow-lg">
          <div className="px-6 py-6">
            <div className="space-y-4">
              {/* SHOP with expandable categories */}
              <div>
                <button
                  className="flex items-center justify-between w-full text-foreground text-sm font-medium tracking-wider py-2"
                  onClick={() => setExpandedMobileCategory(
                    expandedMobileCategory === 'shop' ? null : 'shop'
                  )}
                >
                  <span>SHOP</span>
                  <ArrowRight 
                    size={16} 
                    className={`transform transition-transform duration-200 ${
                      expandedMobileCategory === 'shop' ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                
                {expandedMobileCategory === 'shop' && (
                  <div className="pl-4 mt-2 space-y-3 border-l border-border ml-2">
                    {parentCategories.map((category) => (
                      <div key={category.id}>
                        <Link
                          to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm font-medium text-foreground block py-1"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {category.name}
                        </Link>
                        {category.children.length > 0 && (
                          <div className="pl-3 mt-1 space-y-1">
                            {category.children.map((sub) => (
                              <Link
                                key={sub.id}
                                to={`/category/${sub.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm text-muted-foreground block py-1"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <Link
                      to="/category/all"
                      className="text-sm font-medium text-foreground flex items-center gap-1 py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      View All Products
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Other nav items */}
              <Link
                to="/category/new-arrivals"
                className="block text-foreground text-sm font-medium tracking-wider py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                NEW ARRIVALS
              </Link>
              <Link
                to="/blog"
                className="block text-foreground text-sm font-medium tracking-wider py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                BLOG
              </Link>
              <Link
                to="/about/our-story"
                className="block text-foreground text-sm font-medium tracking-wider py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ABOUT
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Shopping Bag Component */}
      <ShoppingBag 
        isOpen={isShoppingBagOpen}
        onClose={() => setIsShoppingBagOpen(false)}
        cartItems={cartItems}
        updateQuantity={handleUpdateQuantity}
        onViewFavorites={() => {
          setIsShoppingBagOpen(false);
          setOffCanvasType('favorites');
        }}
      />
      
      {/* Favorites Off-canvas overlay */}
      {offCanvasType === 'favorites' && (
        <div className="fixed inset-0 z-50 h-screen">
          <div 
            className="absolute inset-0 bg-black/50 h-screen"
            onClick={() => setOffCanvasType(null)}
          />
          
          <div className="absolute right-0 top-0 h-screen w-96 bg-white border-l border-border animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-medium text-foreground">Your Favorites</h2>
              <button
                onClick={() => setOffCanvasType(null)}
                className="p-2 text-foreground hover:text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-muted-foreground text-sm">
                You haven't added any favorites yet. Browse our collection and click the heart icon to save items you love.
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
