import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, User, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const MobileFooterNav = () => {
  const location = useLocation();
  const { cartCount } = useCart();

  const hiddenPaths = ["/admin", "/checkout", "/auth"];
  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: LayoutGrid, label: "Category", path: "/categories" },
    { icon: Heart, label: "Favorites", path: "/favorites" },
    {
      icon: ShoppingBag,
      label: "Cart",
      path: "/checkout",
      badge: cartCount > 0 ? cartCount : undefined,
    },
    { icon: User, label: "Account", path: "/account" },
  ] as const;

  return (
    <>
      <div className="h-16 lg:hidden" />
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="flex items-end justify-around h-16 px-4 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  {"badge" in item && item.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[10px] font-medium rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-light">{item.label}</span>
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
