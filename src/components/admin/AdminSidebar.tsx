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
  Mail,
  MessageCircle,
  Inbox,
  FileText,
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

const emailItems = [
  { icon: Settings2, label: "Email API", path: "/admin/email-api" },
  { icon: Send, label: "Email Marketing", path: "/admin/email-marketing" },
];

const whatsappItems = [
  { icon: Settings2, label: "WhatsApp API", path: "/admin/whatsapp-api" },
  { icon: Send, label: "WhatsApp Marketing", path: "/admin/whatsapp-marketing" },
  { icon: Inbox, label: "Inbox", path: "/admin/whatsapp-inbox" },
];

const instagramItems = [
  { icon: Settings2, label: "Instagram API", path: "/admin/instagram-api" },
  { icon: Send, label: "Instagram Marketing", path: "/admin/instagram-marketing" },
  { icon: Inbox, label: "Inbox", path: "/admin/instagram-inbox" },
];
 
const AdminSidebar = () => {
  const location = useLocation();
  const isProductEditsActive = productEditsItems.some(item => location.pathname === item.path);
  const isAccountEditsActive = accountEditsItems.some(item => location.pathname === item.path);
  const isCustomerEditsActive = customerEditsItems.some(item => location.pathname === item.path);
  const isSmsActive = smsItems.some(item => location.pathname === item.path);
  const isEmailActive = emailItems.some(item => location.pathname === item.path);
  const isWhatsappActive = whatsappItems.some(item => location.pathname === item.path);
  const isInstagramActive = instagramItems.some(item => location.pathname === item.path);
  const [isProductEditsOpen, setIsProductEditsOpen] = useState(isProductEditsActive);
  const [isAccountEditsOpen, setIsAccountEditsOpen] = useState(isAccountEditsActive);
  const [isCustomerEditsOpen, setIsCustomerEditsOpen] = useState(isCustomerEditsActive);
  const [isSmsOpen, setIsSmsOpen] = useState(isSmsActive);
  const [isEmailOpen, setIsEmailOpen] = useState(isEmailActive);
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(isWhatsappActive);
  const [isInstagramOpen, setIsInstagramOpen] = useState(isInstagramActive);

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

        {/* Blog */}
        <Link
          to="/admin/blog"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
            location.pathname === "/admin/blog"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <FileText className="h-4 w-4" />
          Blog
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

         {/* Email Collapsible */}
         <Collapsible open={isEmailOpen} onOpenChange={setIsEmailOpen}>
           <CollapsibleTrigger className="w-full">
             <div
               className={cn(
                 "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
                 isEmailActive
                   ? "text-foreground"
                   : "text-muted-foreground hover:text-foreground hover:bg-muted"
               )}
             >
               <div className="flex items-center gap-3">
                 <Mail className="h-4 w-4" />
                 Email
               </div>
               <ChevronDown 
                 className={cn(
                   "h-4 w-4 transition-transform duration-200",
                   isEmailOpen && "rotate-180"
                 )} 
               />
             </div>
           </CollapsibleTrigger>
           <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
             <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
               {emailItems.map((item) => {
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

         {/* WhatsApp Collapsible */}
         <Collapsible open={isWhatsappOpen} onOpenChange={setIsWhatsappOpen}>
           <CollapsibleTrigger className="w-full">
             <div
               className={cn(
                 "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
                 isWhatsappActive
                   ? "text-foreground"
                   : "text-muted-foreground hover:text-foreground hover:bg-muted"
               )}
             >
               <div className="flex items-center gap-3">
                 <MessageCircle className="h-4 w-4" />
                 WhatsApp
               </div>
               <ChevronDown 
                 className={cn(
                   "h-4 w-4 transition-transform duration-200",
                   isWhatsappOpen && "rotate-180"
                 )} 
               />
             </div>
           </CollapsibleTrigger>
           <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
             <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
               {whatsappItems.map((item) => {
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

         {/* Instagram Collapsible */}
         <Collapsible open={isInstagramOpen} onOpenChange={setIsInstagramOpen}>
           <CollapsibleTrigger className="w-full">
             <div
               className={cn(
                 "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors w-full",
                 isInstagramActive
                   ? "text-foreground"
                   : "text-muted-foreground hover:text-foreground hover:bg-muted"
               )}
             >
               <div className="flex items-center gap-3">
                 <MessageCircle className="h-4 w-4" />
                 Instagram
               </div>
               <ChevronDown 
                 className={cn(
                   "h-4 w-4 transition-transform duration-200",
                   isInstagramOpen && "rotate-180"
                 )} 
               />
             </div>
           </CollapsibleTrigger>
           <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
             <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
               {instagramItems.map((item) => {
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
