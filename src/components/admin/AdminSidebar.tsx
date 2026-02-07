import { useState, useCallback, useRef, MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Settings2,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Map,
  Crown,
  MessageSquare,
  Send,
  Mail,
  MessageCircle,
  Inbox,
  ShoppingCart,
  Clock,
  ExternalLink,
  Boxes,
  Globe,
  Puzzle,
  Database,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useModulesContext } from "@/contexts/ModulesContext";

// Navigation debounce delay (ms)
const NAV_DEBOUNCE_MS = 150;

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const productEditsItems: NavItem[] = [
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
  { icon: Clock, label: "Verification Queue", path: "/admin/verification-queue" },
  { icon: Boxes, label: "Inventory", path: "/admin/inventory" },
  { icon: CreditCard, label: "Payment Methods", path: "/admin/payment-methods" },
];

const accountEditsItems: NavItem[] = [
  { icon: CreditCard, label: "Accounts List", path: "/admin/accounts-list" },
  { icon: TrendingUp, label: "Income Categories", path: "/admin/income-categories" },
  { icon: TrendingDown, label: "Expense Categories", path: "/admin/expense-categories" },
];

const customerEditsItems: NavItem[] = [
  { icon: MapPin, label: "Districts", path: "/admin/divisions" },
  { icon: Map, label: "Thanas", path: "/admin/thanas" },
  { icon: Crown, label: "Customer Types", path: "/admin/customer-types" },
];

const smsItems: NavItem[] = [
  { icon: Settings2, label: "SMS API", path: "/admin/sms-api" },
  { icon: Send, label: "SMS Marketing", path: "/admin/sms-marketing" },
];

const emailItems: NavItem[] = [
  { icon: Settings2, label: "Email API", path: "/admin/email-api" },
  { icon: Send, label: "Email Marketing", path: "/admin/email-marketing" },
];

const whatsappItems: NavItem[] = [
  { icon: Settings2, label: "WhatsApp API", path: "/admin/whatsapp-api" },
  { icon: Send, label: "WhatsApp Marketing", path: "/admin/whatsapp-marketing" },
  { icon: Inbox, label: "Inbox", path: "/admin/whatsapp-inbox" },
];

const instagramItems: NavItem[] = [
  { icon: Settings2, label: "Instagram API", path: "/admin/instagram-api" },
  { icon: Send, label: "Instagram Marketing", path: "/admin/instagram-marketing" },
  { icon: Inbox, label: "Inbox", path: "/admin/instagram-inbox" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isModuleActive, isLoading } = useModulesContext();
  
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

  const isProductEditsActive = productEditsItems.some(item => location.pathname === item.path);
  const isOrdersActive = orderItems.some(item => location.pathname === item.path);
  const isAccountEditsActive = accountEditsItems.some(item => location.pathname === item.path);
  const isCustomerEditsActive = customerEditsItems.some(item => location.pathname === item.path);
  const isSmsActive = smsItems.some(item => location.pathname === item.path);
  const isEmailActive = emailItems.some(item => location.pathname === item.path);
  const isWhatsappActive = whatsappItems.some(item => location.pathname === item.path);
  const isInstagramActive = instagramItems.some(item => location.pathname === item.path);
  
  const [isProductEditsOpen, setIsProductEditsOpen] = useState(isProductEditsActive);
  const [isOrdersOpen, setIsOrdersOpen] = useState(isOrdersActive);
  const [isAccountEditsOpen, setIsAccountEditsOpen] = useState(isAccountEditsActive);
  const [isCustomerEditsOpen, setIsCustomerEditsOpen] = useState(isCustomerEditsActive);
  const [isSmsOpen, setIsSmsOpen] = useState(isSmsActive);
  const [isEmailOpen, setIsEmailOpen] = useState(isEmailActive);
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(isWhatsappActive);
  const [isInstagramOpen, setIsInstagramOpen] = useState(isInstagramActive);

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
        <p className="text-sm text-muted-foreground mt-1">Product Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {/* Dashboard - Always visible (core) */}
        {renderNavLink("/admin", LayoutDashboard, "Dashboard")}

        {/* Module Manager - Always visible (core) */}
        {renderNavLink("/admin/modules", Puzzle, "Modules")}

        {/* Products Module */}
        {isModuleActive("products") && (
          renderNavLink("/admin/products", Package, "Products")
        )}

        {/* SEO Manager */}
        {isModuleActive("seo") && (
          renderNavLink("/admin/seo", Globe, "SEO Manager")
        )}

        {/* Site Settings */}
        {isModuleActive("site_settings") && (
          renderNavLink("/admin/site-settings", Settings2, "Site Settings")
        )}

        {/* Orders Module */}
        {isModuleActive("orders") && (
          renderCollapsible(
            ShoppingCart,
            "Orders",
            orderItems,
            isOrdersOpen,
            setIsOrdersOpen,
            isOrdersActive
          )
        )}

        {/* Product Edits Module */}
        {isModuleActive("product_edits") && (
          renderCollapsible(
            Settings2,
            "Product Edits",
            productEditsItems,
            isProductEditsOpen,
            setIsProductEditsOpen,
            isProductEditsActive
          )
        )}

        {/* Accounts Module */}
        {isModuleActive("accounts") && (
          renderNavLink("/admin/accounts", Wallet, "Accounts")
        )}

        {/* Account Edits Module */}
        {isModuleActive("account_edits") && (
          renderCollapsible(
            Settings2,
            "Accounts Edits",
            accountEditsItems,
            isAccountEditsOpen,
            setIsAccountEditsOpen,
            isAccountEditsActive
          )
        )}

        {/* Customers Module */}
        {isModuleActive("customers") && (
          renderNavLink("/admin/customers", Users, "Customers")
        )}

        {/* Customer Edits Module */}
        {isModuleActive("customer_edits") && (
          renderCollapsible(
            Settings2,
            "Customer Edits",
            customerEditsItems,
            isCustomerEditsOpen,
            setIsCustomerEditsOpen,
            isCustomerEditsActive
          )
        )}

        {/* SMS Marketing Module */}
        {isModuleActive("sms_marketing") && (
          renderCollapsible(
            MessageSquare,
            "SMS",
            smsItems,
            isSmsOpen,
            setIsSmsOpen,
            isSmsActive
          )
        )}

        {/* Email Marketing Module */}
        {isModuleActive("email_marketing") && (
          renderCollapsible(
            Mail,
            "Email",
            emailItems,
            isEmailOpen,
            setIsEmailOpen,
            isEmailActive
          )
        )}

        {/* WhatsApp Marketing Module */}
        {isModuleActive("whatsapp_marketing") && (
          renderCollapsible(
            MessageCircle,
            "WhatsApp",
            whatsappItems,
            isWhatsappOpen,
            setIsWhatsappOpen,
            isWhatsappActive
          )
        )}

        {/* Instagram Marketing Module */}
        {isModuleActive("instagram_marketing") && (
          renderCollapsible(
            MessageCircle,
            "Instagram",
            instagramItems,
            isInstagramOpen,
            setIsInstagramOpen,
            isInstagramActive
          )
        )}

        {/* Seed Data - Always visible for development */}
        {renderNavLink("/admin/seed-data", Database, "Seed Data")}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
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
