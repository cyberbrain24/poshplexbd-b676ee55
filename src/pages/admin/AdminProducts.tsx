import { useState } from "react";
import { Plus, Pencil, Trash2, Package, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import ProductModal from "@/components/admin/ProductModal";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDeleteProduct, useProduct } from "@/hooks/useProducts";
import { useOptimizedProducts } from "@/hooks/useOptimizedProducts";
import { Product } from "@/types/product";
import { toast } from "sonner";
import DebouncedSearchInput from "@/components/admin/DebouncedSearchInput";
import { supabase } from "@/integrations/supabase/client";
import { generateProductSlug } from "@/lib/slug";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminProducts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState<{ count: number; refs: string[] } | null>(null);
  const [checkingDelete, setCheckingDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use optimized server-side pagination and search
  const { products, isLoading, totalCount, pagination } = useOptimizedProducts(searchQuery);
  const { data: selectedProduct } = useProduct(selectedProductId || undefined);
  const deleteProductMutation = useDeleteProduct();

  const hasMore = pagination.page < pagination.totalPages;

  const handleLoadMore = () => {
    pagination.nextPage();
  };

  const handleEdit = (product: Product) => {
    setSelectedProductId(product.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (product: Product) => {
    setCheckingDelete(true);
    setDeleteBlocked(null);
    setDeleteProduct(product);

    const { data: orderItems, count } = await supabase
      .from("order_items")
      .select("order_id, orders!inner(order_number)", { count: "exact" })
      .eq("product_id", product.id)
      .limit(5);

    if (count && count > 0) {
      const refs = (orderItems || []).map((item: any) => item.orders?.order_number || item.order_id.slice(0, 8));
      setDeleteBlocked({ count, refs: [...new Set(refs)] });
    }
    setCheckingDelete(false);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      await deleteProductMutation.mutateAsync(deleteProduct.id);
      toast.success("Product deleted");
      setDeleteProduct(null);
      setDeleteBlocked(null);
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const openCreateModal = () => {
    setSelectedProductId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-medium tracking-tight">Products</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
            Manage your product catalog ({totalCount} total)
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <DebouncedSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search products by name or SKU..."
        className="max-w-md"
        delay={400}
      />

      {/* Products Table */}
      <div className="border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No products match your search" : "No products found"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0].image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant={product.product_type === "variable" ? "default" : "secondary"}>
                      {product.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.category?.name || "-"}</TableCell>
                  <TableCell>৳{product.base_price.toLocaleString()}</TableCell>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "outline"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/product/${generateProductSlug(product.name, product.id)}`, '_blank')}
                        title="View product page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Load More ({products.length} of {totalCount})
          </Button>
        </div>
      )}

      {/* Show count when all loaded */}
      {!hasMore && products.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing all {totalCount} products
        </p>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProductId(null);
        }}
        product={selectedProduct}
      />

      <AlertDialog open={!!deleteProduct} onOpenChange={() => { setDeleteProduct(null); setDeleteBlocked(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteBlocked ? <AlertTriangle className="h-5 w-5 text-destructive" /> : null}
              {deleteBlocked ? "Deletion Blocked" : "Delete Product"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {checkingDelete ? (
                  <p>Checking references...</p>
                ) : deleteBlocked ? (
                  <>
                    <p>Cannot delete "<strong>{deleteProduct?.name}</strong>" because it exists in <strong>{deleteBlocked.count}</strong> order{deleteBlocked.count > 1 ? "s" : ""}. You may archive/disable the product instead.</p>
                    <div className="bg-muted p-3 rounded text-sm space-y-1 mt-2">
                      <p className="font-medium text-foreground">Referenced orders:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {deleteBlocked.refs.map((ref, i) => <li key={i}>{ref}</li>)}
                        {deleteBlocked.count > 5 && <li>...and {deleteBlocked.count - 5} more</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p>Are you sure you want to delete "<strong>{deleteProduct?.name}</strong>"? This action cannot be undone.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteBlocked && !checkingDelete && (
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
