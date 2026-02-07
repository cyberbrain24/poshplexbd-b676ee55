import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  variant_sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderItemEditModalProps {
  item: OrderItem | null;
  orderId: string;
  open: boolean;
  onClose: () => void;
}

const OrderItemEditModal = ({ item, orderId, open, onClose }: OrderItemEditModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setUnitPrice(item.unit_price);
    }
  }, [item]);

  const updateOrderItem = useMutation({
    mutationFn: async ({ itemId, quantity, unitPrice }: { itemId: string; quantity: number; unitPrice: number }) => {
      const lineTotal = quantity * unitPrice;
      
      // Update the order item
      const { error: itemError } = await supabase
        .from("order_items")
        .update({
          quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        })
        .eq("id", itemId);
      
      if (itemError) throw itemError;

      // Recalculate order totals
      const { data: allItems, error: itemsError } = await supabase
        .from("order_items")
        .select("line_total")
        .eq("order_id", orderId);
      
      if (itemsError) throw itemsError;

      const newSubtotal = allItems.reduce((sum, i) => sum + Number(i.line_total), 0);

      // Get current order for shipping and discount
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("shipping_cost, discount_amount, tax_amount")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const newTotal = newSubtotal - Number(order.discount_amount) + Number(order.shipping_cost) + Number(order.tax_amount);

      // Update order totals
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          subtotal: newSubtotal,
          total_amount: newTotal,
        })
        .eq("id", orderId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order item updated successfully");
      onClose();
    },
    onError: (error: Error) => {
      toast.error("Failed to update item: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    
    updateOrderItem.mutate({
      itemId: item.id,
      quantity,
      unitPrice,
    });
  };

  if (!item) return null;

  const lineTotal = quantity * unitPrice;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Order Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Product</Label>
            <p className="font-medium">{item.product_name}</p>
            {item.variant_sku && (
              <p className="text-sm text-muted-foreground">SKU: {item.variant_sku}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (৳)</Label>
              <Input
                id="unitPrice"
                type="number"
                min={0}
                step={0.01}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded">
            <div className="flex justify-between text-sm">
              <span>Line Total:</span>
              <span className="font-medium">৳{lineTotal.toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateOrderItem.isPending}>
              {updateOrderItem.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderItemEditModal;
