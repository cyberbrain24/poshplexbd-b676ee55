import AdminLayout from "@/components/admin/AdminLayout";
import { useProducts } from "@/hooks/useProducts";
import { useColors, useSizes, useMaterials, useCategories, useBrands } from "@/hooks/useMasterData";
import { Package, Palette, Ruler, Shirt, FolderTree, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { data: products = [] } = useProducts();
  const { data: colors = [] } = useColors();
  const { data: sizes = [] } = useSizes();
  const { data: materials = [] } = useMaterials();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const stats = [
    { icon: Package, label: "Products", count: products.length, path: "/admin/products" },
    { icon: Palette, label: "Colors", count: colors.length, path: "/admin/colors" },
    { icon: Ruler, label: "Sizes", count: sizes.length, path: "/admin/sizes" },
    { icon: Shirt, label: "Materials", count: materials.length, path: "/admin/materials" },
    { icon: FolderTree, label: "Categories", count: categories.length, path: "/admin/categories" },
    { icon: Building2, label: "Brands", count: brands.length, path: "/admin/brands" },
  ];

  const activeProducts = products.filter(p => p.is_active).length;
  const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Product management overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.path}
              className="p-4 border border-border hover:border-foreground transition-colors"
            >
              <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-medium">{stat.count}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border border-border">
            <h3 className="text-sm text-muted-foreground mb-1">Active Products</h3>
            <p className="text-3xl font-medium">{activeProducts}</p>
            <p className="text-sm text-muted-foreground mt-1">of {products.length} total</p>
          </div>
          <div className="p-6 border border-border">
            <h3 className="text-sm text-muted-foreground mb-1">Total Variants</h3>
            <p className="text-3xl font-medium">{totalVariants}</p>
            <p className="text-sm text-muted-foreground mt-1">across all products</p>
          </div>
          <div className="p-6 border border-border">
            <h3 className="text-sm text-muted-foreground mb-1">Variable Products</h3>
            <p className="text-3xl font-medium">{products.filter(p => p.product_type === 'variable').length}</p>
            <p className="text-sm text-muted-foreground mt-1">with variants</p>
          </div>
        </div>

        {/* Recent Products */}
        <div className="border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-medium">Recent Products</h2>
            <Link to="/admin/products" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name}
                      className="w-12 h-12 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${product.base_price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No products yet. Create your first product to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
