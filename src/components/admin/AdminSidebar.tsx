import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Wallet, label: "Accounts", path: "/admin/accounts" },
  { icon: Users, label: "Customers", path: "/admin/customers" },
];

const productEditsItems = [
  { icon: Palette, label: "Colors", path: "/admin/colors" },
  { icon: Ruler, label: "Sizes", path: "/admin/sizes" },
  { icon: Shirt, label: "Materials", path: "/admin/materials" },
  { icon: BookOpen, label: "Size Guides", path: "/admin/size-guides" },
  { icon: Sparkles, label: "Care & Cleaning", path: "/admin/care-instructions" },
  { icon: FolderTree, label: "Categories", path: "/admin/categories" },
  { icon: Building2, label: "Brands", path: "/admin/brands" },
];

const accountEditsItems = [
  { icon: CreditCard, label: "Accounts List", path: "/admin/accounts-list" },
  { icon: TrendingUp, label: "Income Categories", path: "/admin/income-categories" },
  { icon: TrendingDown, label: "Expense Categories", path: "/admin/expense-categories" },
];

const customerEditsItems = [
  { icon: MapPin, label: "Divisions", path: "/admin/divisions" },
  { icon: Map, label: "Thanas", path: "/admin/thanas" },
  { icon: Crown, label: "Customer Types", path: "/admin/customer-types" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const isProductEditsActive = productEditsItems.some(item => location.pathname === item.path);
  const isAccountEditsActive = accountEditsItems.some(item => location.pathname === item.path);
  const isCustomerEditsActive = customerEditsItems.some(item => location.pathname === item.path);
  const [isProductEditsOpen, setIsProductEditsOpen] = useState(isProductEditsActive);

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-medium tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Product Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {mainMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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

        {/* Product Edits Collapsible */}
        <Collapsible open={isProductEditsOpen} onOpenChange={setIsProductEditsOpen}>
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
                isProductEditsActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <Settings2 className="h-4 w-4" />
                Product Edits
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isProductEditsOpen && "rotate-180"
                )} 
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
              {productEditsItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
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

        {/* Accounts Edits Section - Always visible */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Accounts Edits
          </p>
          <div className="space-y-1">
            {accountEditsItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
        </div>

        {/* Customer Edits Section - Always visible */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Customer Edits
          </p>
          <div className="space-y-1">
            {customerEditsItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
        </div>
      </nav>

      <div className="p-4 border-t border-border">
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
