import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Sparkles, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const MobileFooterNav = () => {
  const location = useLocation();
  const { cartCount } = useCart();

  // Don't show on admin pages or checkout
  const hiddenPaths = ["/admin", "/checkout", "/auth"];
  const shouldHide = hiddenPaths.some((path) => location.pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  const openChat = () => window.dispatchEvent(new Event("open-customer-chat"));

  const navItems: Array<{
    icon: typeof Home;
    label: string;
    path?: string;
    onClick?: () => void;
    badge?: number;
    highlight?: boolean;
  }> = [
    { icon: Home, label: "Home", path: "/" },
    { icon: LayoutGrid, label: "Category", path: "/categories" },
    { icon: Sparkles, label: "AI Chat", onClick: openChat, highlight: true },
    {
      icon: ShoppingBag,
      label: "Cart",
      path: "/checkout",
      badge: cartCount > 0 ? cartCount : undefined,
    },
    { icon: User, label: "Account", path: "/account" },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 lg:hidden" />
      
      {/* Fixed footer navigation - only visible on mobile/tablet */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            const Icon = item.icon;

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

            const className = cn(
              "flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors",
              item.highlight
                ? "text-foreground"
                : isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
            );

            if (item.onClick) {
              return (
                <button key={item.label} onClick={item.onClick} className={className} aria-label={item.label}>
                  {inner}
                </button>
              );
            }
            return (
              <Link key={item.path} to={item.path!} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>
    </>
  );
};

export default MobileFooterNav;
