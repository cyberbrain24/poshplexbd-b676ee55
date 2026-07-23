import { useState, useCallback, useRef, MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Package, Palette, Ruler, Shirt, BookOpen, Sparkles, FolderTree, Building2,
  LayoutDashboard, ArrowLeft, ChevronDown, Wallet, CreditCard, TrendingUp,
  TrendingDown, Users, MapPin, Map, Crown, ShoppingCart, ExternalLink,
  LucideIcon, RefreshCw, MessageSquare, Image, Tag, Settings, Send,
  Upload, Menu, X, Music, Megaphone, Facebook, Server, BarChart3, LayoutGrid,
  BarChart2, Mail, MessageCircle, Instagram, MessagesSquare, Truck, Plug, PackageCheck, PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { prefetchAdminRoute } from "@/lib/adminRoutePrefetch";
import { usePermissions, canAccess, ModuleKey } from "@/hooks/usePermissions";


const NAV_DEBOUNCE_MS = 150;

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  module: ModuleKey;
}


const productManagementItems: NavItem[] = [
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Palette, label: "Colors", path: "/admin/colors" },
  { icon: Ruler, label: "Sizes", path: "/admin/sizes" },
  { icon: BookOpen, label: "Size Guides", path: "/admin/size-guides" },
  { icon: FolderTree, label: "Categories", path: "/admin/categories" },
  
];

const orderItems: NavItem[] = [
  { icon: PlusCircle, label: "Add Order", path: "/admin/add-order" },
  { icon: ShoppingCart, label: "All Orders", path: "/admin/orders" },
  { icon: PackageCheck, label: "Order Fulfillment", path: "/admin/order-fulfillment" },
  { icon: CreditCard, label: "Payment Methods", path: "/admin/payment-methods" },
  
  
];





const customerManagementItems: NavItem[] = [
  { icon: Users, label: "Customers", path: "/admin/customers" },
  { icon: MessageSquare, label: "Reviews", path: "/admin/reviews" },
  { icon: MapPin, label: "Districts", path: "/admin/divisions" },
  { icon: Map, label: "Thanas", path: "/admin/thanas" },
  { icon: Crown, label: "Membership Types", path: "/admin/customer-types" },
];

const marketingItems: NavItem[] = [
  { icon: LayoutGrid, label: "Overview", path: "/admin/marketing" },
  { icon: Facebook, label: "Meta Pixel", path: "/admin/marketing/meta-pixel" },
  { icon: Server, label: "Meta CAPI", path: "/admin/marketing/meta-capi" },
  { icon: Truck, label: "Steadfast API", path: "/admin/marketing/steadfast" },
];


const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const lastNavTimeRef = useRef<number>(0);
  const isNavigatingRef = useRef(false);

  const handleNavClick = useCallback((e: MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault();
    if (location.pathname === to) { setMobileOpen(false); return; }
    const now = Date.now();
    if (now - lastNavTimeRef.current < NAV_DEBOUNCE_MS || isNavigatingRef.current) return;
    lastNavTimeRef.current = now;
    isNavigatingRef.current = true;
    navigate(to);
    setMobileOpen(false);
    setTimeout(() => { isNavigatingRef.current = false; }, NAV_DEBOUNCE_MS);
  }, [location.pathname, navigate]);

  const handleSystemReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      toast.success("System reset complete");
      setTimeout(() => { window.location.reload(); }, 500);
    } catch (error) {
      toast.error("Reset failed");
      setIsResetting(false);
    }
  }, [queryClient]);

  const isProductMgmtActive = productManagementItems.some(item => location.pathname === item.path);
  const isOrdersActive = orderItems.some(item => location.pathname === item.path);
  
  
  const isCustomerMgmtActive = customerManagementItems.some(item => location.pathname === item.path);
  const isMarketingActive = location.pathname.startsWith("/admin/marketing");

  type GroupKey = 'product' | 'orders' | 'customer' | 'marketing';
  const getInitialOpen = (): GroupKey | null => {
    if (isProductMgmtActive) return 'product';
    if (isOrdersActive) return 'orders';
    if (isMarketingActive) return 'marketing';
    if (isCustomerMgmtActive) return 'customer';
    return null;
  };

  const [openGroup, setOpenGroup] = useState<GroupKey | null>(getInitialOpen);
  const toggleGroup = (key: GroupKey) => setOpenGroup(prev => prev === key ? null : key);

  const renderNavLink = (path: string, icon: LucideIcon, label: string) => {
    const Icon = icon;
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={(e) => handleNavClick(e, path)}
        onMouseEnter={() => prefetchAdminRoute(path)}
        onFocus={() => prefetchAdminRoute(path)}
        onTouchStart={() => prefetchAdminRoute(path)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm",
          isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const renderCollapsible = (
    icon: LucideIcon, label: string, items: NavItem[],
    isOpen: boolean, onToggle: () => void, isGroupActive: boolean
  ) => {
    const Icon = icon;
    return (
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <div className={cn(
            "flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors w-full rounded-sm",
            isGroupActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}>
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
            {items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  onMouseEnter={() => prefetchAdminRoute(item.path)}
                  onFocus={() => prefetchAdminRoute(item.path)}
                  onTouchStart={() => prefetchAdminRoute(item.path)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm",
                    isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const sidebarContent = (
    <>
      <div className="p-4 md:p-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-base md:text-lg font-medium tracking-tight">Admin Panel</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Management Console</p>
        </div>
        <button className="md:hidden p-1" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <nav className="flex-1 p-3 md:p-4 space-y-0.5 overflow-y-auto">
        {renderNavLink("/admin", LayoutDashboard, "Business Intelligence")}
        {renderCollapsible(Package, "Product Management", productManagementItems, openGroup === 'product', () => toggleGroup('product'), isProductMgmtActive)}
        {renderCollapsible(ShoppingCart, "Order Management", orderItems, openGroup === 'orders', () => toggleGroup('orders'), isOrdersActive)}
        {renderCollapsible(Plug, "Integration & Tracking", marketingItems, openGroup === 'marketing', () => toggleGroup('marketing'), isMarketingActive)}
        
        
        {renderCollapsible(Users, "Customer Management", customerManagementItems, openGroup === 'customer', () => toggleGroup('customer'), isCustomerMgmtActive)}

        {renderNavLink("/admin/site-settings", Settings, "Site Settings")}
      </nav>

      <div className="p-3 md:p-4 border-t border-border space-y-2">
        <button
          onClick={handleSystemReset}
          disabled={isResetting}
          className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors font-medium w-full disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
          {isResetting ? "Resetting..." : "Reset System"}
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors font-medium">
          <ExternalLink className="h-4 w-4" /> Visit Site
        </a>
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Store
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(true)} className="p-1">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-medium tracking-tight">Admin Panel</h1>
        <div className="w-7" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-background border-r border-border flex flex-col",
        // Desktop: static
        "hidden md:flex w-64 min-h-screen",
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside className={cn(
        "md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-background border-r border-border flex flex-col transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
