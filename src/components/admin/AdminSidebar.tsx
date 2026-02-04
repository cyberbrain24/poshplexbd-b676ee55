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
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Palette, label: "Colors", path: "/admin/colors" },
  { icon: Ruler, label: "Sizes", path: "/admin/sizes" },
  { icon: Shirt, label: "Materials", path: "/admin/materials" },
  { icon: BookOpen, label: "Size Guides", path: "/admin/size-guides" },
  { icon: Sparkles, label: "Care Instructions", path: "/admin/care-instructions" },
  { icon: FolderTree, label: "Categories", path: "/admin/categories" },
  { icon: Building2, label: "Brands", path: "/admin/brands" },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-medium tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Product Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
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
