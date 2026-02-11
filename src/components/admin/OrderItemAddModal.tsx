import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface OrderItemAddModalProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

const OrderItemAddModal = ({ orderId, open, onClose }: OrderItemAddModalProps) => {
  const [search, setSearch] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();

  const { data: products, isLoading: searchLoading } = useQuery({
    queryKey: ["product-search", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, sku, base_price,
          product_variants(id, sku, selling_price, color:colors(name), size:sizes(label))
        `)
        .ilike("name", `%${search}%`)
        .eq("is_active", true)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVariant) return;

      const unitPrice = selectedVariant.selling_price || selectedVariant.product_base_price;
      const lineTotal = quantity * unitPrice;

      const variantDetails: Record<string, string> = {};
      if (selectedVariant.color?.name) variantDetails.color = selectedVariant.color.name;
      if (selectedVariant.size?.label) variantDetails.size = selectedVariant.size.label;

      // Insert the order item
      const { error: insertError } = await supabase
        .from("order_items")
        .insert({
          order_id: orderId,
          product_id: selectedVariant.product_id,
          variant_id: selectedVariant.id,
          product_name: selectedVariant.product_name,
          variant_sku: selectedVariant.sku,
          quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
          variant_details: variantDetails,
        });

      if (insertError) throw insertError;

      // Recalculate order totals
      const { data: allItems, error: itemsError } = await supabase
        .from("order_items")
        .select("line_total")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      const newSubtotal = allItems.reduce((sum, i) => sum + Number(i.line_total), 0);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("shipping_cost, discount_amount, tax_amount")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const newTotal = newSubtotal - Number(order.discount_amount) + Number(order.shipping_cost) + Number(order.tax_amount);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ subtotal: newSubtotal, total_amount: newTotal })
        .eq("id", orderId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Product added to order");
      onClose();
      setSearch("");
      setSelectedVariant(null);
      setQuantity(1);
    },
    onError: (error: Error) => toast.error("Failed to add product: " + error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Product to Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedVariant(null); }}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {search.length >= 2 && !selectedVariant && (
            <div className="max-h-60 overflow-y-auto border rounded space-y-1 p-1">
              {searchLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Searching...</div>
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <div key={product.id}>
                    {product.product_variants && product.product_variants.length > 0 ? (
                      product.product_variants.map((variant: any) => (
                        <button
                          key={variant.id}
                          className="w-full text-left p-2 hover:bg-muted rounded text-sm"
                          onClick={() => setSelectedVariant({
                            ...variant,
                            product_id: product.id,
                            product_name: product.name,
                            product_base_price: product.base_price,
                          })}
                        >
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {variant.sku} • {variant.color?.name || ""} {variant.size?.label || ""} • {formatCurrency(variant.selling_price || product.base_price)}
                          </p>
                        </button>
                      ))
                    ) : (
                      <button
                        className="w-full text-left p-2 hover:bg-muted rounded text-sm"
                        onClick={() => setSelectedVariant({
                          id: null,
                          sku: product.sku,
                          selling_price: product.base_price,
                          product_id: product.id,
                          product_name: product.name,
                          product_base_price: product.base_price,
                          color: null,
                          size: null,
                        })}
                      >
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku} • {formatCurrency(product.base_price)}</p>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">No products found</div>
              )}
            </div>
          )}

          {/* Selected Product */}
          {selectedVariant && (
            <div className="p-3 bg-muted rounded space-y-3">
              <div>
                <p className="font-medium">{selectedVariant.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {selectedVariant.sku}
                  {selectedVariant.color?.name && ` • ${selectedVariant.color.name}`}
                  {selectedVariant.size?.label && ` • ${selectedVariant.size.label}`}
                </p>
                <p className="text-sm font-medium mt-1">{formatCurrency(selectedVariant.selling_price || selectedVariant.product_base_price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Label>Quantity:</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm font-medium ml-auto">
                  Total: {formatCurrency(quantity * (selectedVariant.selling_price || selectedVariant.product_base_price))}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => addItemMutation.mutate()} disabled={!selectedVariant || addItemMutation.isPending}>
            {addItemMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderItemAddModal;
