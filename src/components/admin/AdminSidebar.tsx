import { useState, useCallback, useRef, MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Package, 
  Palette, 
  Ruler, 
  Shirt, 
  BookOpen, 
  Sparkles, 
  FolderTree, 
  Building2,
  LayoutDashboard,
  ArrowLeft,
  ChevronDown,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Map,
  Crown,
  ShoppingCart,
  ExternalLink,
  Globe,
  Database,
  RefreshCw,
  LucideIcon,
  MessageSquare,
  Image,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Navigation debounce delay (ms)
const NAV_DEBOUNCE_MS = 150;

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const productManagementItems: NavItem[] = [
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Palette, label: "Colors", path: "/admin/colors" },
  { icon: Ruler, label: "Sizes", path: "/admin/sizes" },
  { icon: Shirt, label: "Materials", path: "/admin/materials" },
  { icon: BookOpen, label: "Size Guides", path: "/admin/size-guides" },
  { icon: Sparkles, label: "Care & Cleaning", path: "/admin/care-instructions" },
  { icon: FolderTree, label: "Categories", path: "/admin/categories" },
  { icon: Building2, label: "Brands", path: "/admin/brands" },
];

const orderItems: NavItem[] = [
  { icon: ShoppingCart, label: "All Orders", path: "/admin/orders" },
  { icon: CreditCard, label: "Payment Methods", path: "/admin/payment-methods" },
  { icon: Tag, label: "Promo Codes", path: "/admin/promo-codes" },
];

const accountManagementItems: NavItem[] = [
  { icon: Wallet, label: "Accounts", path: "/admin/accounts" },
  { icon: CreditCard, label: "Accounts List", path: "/admin/accounts-list" },
  { icon: TrendingUp, label: "Income Categories", path: "/admin/income-categories" },
  { icon: TrendingDown, label: "Expense Categories", path: "/admin/expense-categories" },
];

const customerManagementItems: NavItem[] = [
  { icon: Users, label: "Customers", path: "/admin/customers" },
  { icon: MapPin, label: "Districts", path: "/admin/divisions" },
  { icon: Map, label: "Thanas", path: "/admin/thanas" },
  { icon: Crown, label: "Customer Types", path: "/admin/customer-types" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);
  
  // Debounce navigation to prevent rapid clicks
  const lastNavTimeRef = useRef<number>(0);
  const isNavigatingRef = useRef(false);

  const handleNavClick = useCallback((e: MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault();
    
    // Skip if already on this path
    if (location.pathname === to) return;
    
    const now = Date.now();
    const timeSinceLastNav = now - lastNavTimeRef.current;
    
    // Block rapid navigation
    if (timeSinceLastNav < NAV_DEBOUNCE_MS || isNavigatingRef.current) {
      return;
    }
    
    lastNavTimeRef.current = now;
    isNavigatingRef.current = true;
    navigate(to);
    
    // Reset after debounce period
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, NAV_DEBOUNCE_MS);
  }, [location.pathname, navigate]);

  // System reset: cancel queries, clear cache, refresh
  const handleSystemReset = useCallback(async () => {
    setIsResetting(true);
    try {
      // Cancel all pending queries
      await queryClient.cancelQueries();
      // Clear all cached data
      queryClient.clear();
      toast.success("System reset complete");
      // Reload the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("Reset failed");
      setIsResetting(false);
    }
  }, [queryClient]);

  const isProductMgmtActive = productManagementItems.some(item => location.pathname === item.path);
  const isOrdersActive = orderItems.some(item => location.pathname === item.path);
  const isAccountMgmtActive = accountManagementItems.some(item => location.pathname === item.path);
  const isCustomerMgmtActive = customerManagementItems.some(item => location.pathname === item.path);
  
  const [isProductMgmtOpen, setIsProductMgmtOpen] = useState(isProductMgmtActive);
  const [isOrdersOpen, setIsOrdersOpen] = useState(isOrdersActive);
  const [isAccountMgmtOpen, setIsAccountMgmtOpen] = useState(isAccountMgmtActive);
  const [isCustomerMgmtOpen, setIsCustomerMgmtOpen] = useState(isCustomerMgmtActive);

  // Render a simple nav link
  const renderNavLink = (path: string, icon: LucideIcon, label: string) => {
    const Icon = icon;
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={(e) => handleNavClick(e, path)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  // Render a collapsible nav group
  const renderCollapsible = (
    icon: LucideIcon,
    label: string,
    items: NavItem[],
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    isGroupActive: boolean
  ) => {
    const Icon = icon;
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
              isGroupActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              {label}
            </div>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )} 
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-medium tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Management Console</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {/* Dashboard */}
        {renderNavLink("/admin", LayoutDashboard, "Dashboard")}

        {/* Product Management */}
        {renderCollapsible(
          Package,
          "Product Management",
          productManagementItems,
          isProductMgmtOpen,
          setIsProductMgmtOpen,
          isProductMgmtActive
        )}

        {/* Reviews */}
        {renderNavLink("/admin/reviews", MessageSquare, "Reviews")}

        {/* Media Library */}
        {renderNavLink("/admin/media", Image, "Media")}

        {/* SEO Manager */}
        {renderNavLink("/admin/seo", Globe, "SEO Manager")}

        {/* Orders */}
        {renderCollapsible(
          ShoppingCart,
          "Orders",
          orderItems,
          isOrdersOpen,
          setIsOrdersOpen,
          isOrdersActive
        )}

        {/* Account Management */}
        {renderCollapsible(
          Wallet,
          "Account Management",
          accountManagementItems,
          isAccountMgmtOpen,
          setIsAccountMgmtOpen,
          isAccountMgmtActive
        )}

        {/* Customer Management */}
        {renderCollapsible(
          Users,
          "Customer Management",
          customerManagementItems,
          isCustomerMgmtOpen,
          setIsCustomerMgmtOpen,
          isCustomerMgmtActive
        )}

        {/* Seed Data */}
        {renderNavLink("/admin/seed-data", Database, "Seed Data")}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={handleSystemReset}
          disabled={isResetting}
          className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors font-medium w-full disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
          {isResetting ? "Resetting..." : "Reset System"}
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          Visit Site
        </a>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;