import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubcategoryItem {
  name: string;
  href: string;
  image_url: string | null;
}

interface MobileMenuProps {
  navItems: {
    name: string;
    href: string;
    submenu: {
      subcategories: SubcategoryItem[];
      featured: { name: string; href: string }[];
    };
  }[];
  isOpen: boolean;
  onClose: () => void;
}

const USEFUL_LINKS_KEY = "__useful_links__";

const usefulLinks = [
  { name: "Our Story", href: "/pages/our-story" },
  { name: "Members", href: "/membership" },
  { name: "Find Us", href: "/pages/find-us" },
  { name: "Privacy Policy", href: "/pages/privacy-policy" },
  { name: "Terms & Conditions", href: "/pages/terms-conditions" },
  { name: "Shipping & Delivery", href: "/pages/shipping-delivery" },
];

const MobileMenu = ({ navItems, isOpen, onClose }: MobileMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    navItems.length > 0 ? navItems[0].name : null
  );

  const isUsefulLinks = activeCategory === USEFUL_LINKS_KEY;

  const activeSubs =
    !isUsefulLinks
      ? navItems.find((i) => i.name === activeCategory)?.submenu.subcategories ?? []
      : [];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full w-[85vw] max-w-[420px] bg-background shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <span className="text-sm font-semibold tracking-wider text-foreground uppercase">
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body — split layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Category list + Useful Links */}
          <nav className="w-[110px] shrink-0 border-r border-border overflow-y-auto py-3 flex flex-col">
            {navItems.map((item) => {
              const isActive = item.name === activeCategory;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveCategory(item.name)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground border-l-2 border-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {item.name}
                </button>
              );
            })}

            {/* Separator */}
            <div className="mx-4 my-2 border-t border-border" />

            {/* Useful Links button */}
            <button
              onClick={() => setActiveCategory(USEFUL_LINKS_KEY)}
              className={cn(
                "w-full text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                isUsefulLinks
                  ? "bg-accent text-accent-foreground border-l-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Useful Links
            </button>
          </nav>

          {/* Right: Content area */}
          <div className="flex-1 overflow-y-auto p-3">
            {isUsefulLinks ? (
              <div className="space-y-1">
                {usefulLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className="block px-3 py-3 text-sm text-foreground hover:bg-muted/50 rounded-md transition-colors tracking-wide"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            ) : activeSubs.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {activeSubs.map((sub) => (
                  <Link
                    key={sub.name}
                    to={sub.href}
                    onClick={onClose}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                      {sub.image_url ? (
                        <img
                          src={sub.image_url}
                          alt={sub.name}
                          width={100}
                          height={100}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                    </div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-center text-foreground leading-tight line-clamp-2">
                      {sub.name}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-xs mt-8">
                No subcategories
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
