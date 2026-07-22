import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, User, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

type NavItem = {
  icon: typeof Home;
  label: string;
  path?: string;
  onClick?: () => void;
  badge?: number;
  isActive?: boolean;
};

const MobileFooterNav = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { favCount } = useFavorites();

  const hiddenPaths = ["/admin", "/checkout", "/auth"];
  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/", isActive: location.pathname === "/" },
    {
      icon: LayoutGrid,
      label: "Category",
      onClick: () => window.dispatchEvent(new Event("open-mobile-menu")),
    },
    {
      icon: Heart,
      label: "Favorites",
      path: "/favorites",
      badge: favCount > 0 ? favCount : undefined,
      isActive: location.pathname === "/favorites",
    },
    {
      icon: ShoppingBag,
      label: "Cart",
      path: "/checkout",
      badge: cartCount > 0 ? cartCount : undefined,
      isActive: location.pathname === "/checkout",
    },
    { icon: User, label: "Account", path: "/account", isActive: location.pathname === "/account" },
  ];

  return (
    <>
      <div className="h-16 lg:hidden" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="flex items-end justify-around h-16 px-4 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const className = cn(
              "flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors",
              item.isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            );
            const inner = (
              <>
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[10px] font-medium rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-light">{item.label}</span>
              </>
            );

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={className}
                  aria-label={item.label}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link key={item.label} to={item.path!} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>
    </>
  );
};

export default MobileFooterNav;
