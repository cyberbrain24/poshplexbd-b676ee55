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
   MessageSquare,
   Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

 const smsItems = [
   { icon: Settings2, label: "SMS API", path: "/admin/sms-api" },
   { icon: Send, label: "SMS Marketing", path: "/admin/sms-marketing" },
 ];
 
const AdminSidebar = () => {
  const location = useLocation();
  const isProductEditsActive = productEditsItems.some(item => location.pathname === item.path);
  const isAccountEditsActive = accountEditsItems.some(item => location.pathname === item.path);
  const isCustomerEditsActive = customerEditsItems.some(item => location.pathname === item.path);
   const isSmsActive = smsItems.some(item => location.pathname === item.path);
  const [isProductEditsOpen, setIsProductEditsOpen] = useState(isProductEditsActive);
  const [isAccountEditsOpen, setIsAccountEditsOpen] = useState(isAccountEditsActive);
  const [isCustomerEditsOpen, setIsCustomerEditsOpen] = useState(isCustomerEditsActive);
   const [isSmsOpen, setIsSmsOpen] = useState(isSmsActive);

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-medium tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Product Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {/* Dashboard */}
        <Link
          to="/admin"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
            location.pathname === "/admin"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Products */}
        <Link
          to="/admin/products"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
            location.pathname === "/admin/products"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Package className="h-4 w-4" />
          Products
        </Link>

        {/* Product Edits Collapsible - directly under Products */}
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

        {/* Accounts */}
        <Link
          to="/admin/accounts"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
            location.pathname === "/admin/accounts"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Wallet className="h-4 w-4" />
          Accounts
        </Link>

        {/* Accounts Edits Collapsible - directly under Accounts */}
        <Collapsible open={isAccountEditsOpen} onOpenChange={setIsAccountEditsOpen}>
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
                isAccountEditsActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <Settings2 className="h-4 w-4" />
                Accounts Edits
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isAccountEditsOpen && "rotate-180"
                )} 
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
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
          </CollapsibleContent>
        </Collapsible>

        {/* Customers */}
        <Link
          to="/admin/customers"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
            location.pathname === "/admin/customers"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Users className="h-4 w-4" />
          Customers
        </Link>

        {/* Customer Edits Collapsible - directly under Customers */}
        <Collapsible open={isCustomerEditsOpen} onOpenChange={setIsCustomerEditsOpen}>
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
                isCustomerEditsActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <Settings2 className="h-4 w-4" />
                Customer Edits
              </div>
              <ChevronDown 
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isCustomerEditsOpen && "rotate-180"
                )} 
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
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
          </CollapsibleContent>
        </Collapsible>

         {/* SMS Collapsible */}
         <Collapsible open={isSmsOpen} onOpenChange={setIsSmsOpen}>
           <CollapsibleTrigger className="w-full">
             <div
               className={cn(
                 "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
                 isSmsActive
                   ? "text-foreground"
                   : "text-muted-foreground hover:text-foreground hover:bg-muted"
               )}
             >
               <div className="flex items-center gap-3">
                 <MessageSquare className="h-4 w-4" />
                 SMS
               </div>
               <ChevronDown 
                 className={cn(
                   "h-4 w-4 transition-transform duration-200",
                   isSmsOpen && "rotate-180"
                 )} 
               />
             </div>
           </CollapsibleTrigger>
           <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
             <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
               {smsItems.map((item) => {
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
