import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface OrderItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Props {
  item: OrderItem | null;
  orderId: string;
  open: boolean;
  onClose: () => void;
}

const OrderItemEditModal = ({ item, orderId, open, onClose }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setUnitPrice(item.unit_price);
      setVariantId(item.variant_id);
      setSelectedColor("");
      setSelectedSize("");
    }
  }, [item]);

  const { data: variants } = useQuery({
    queryKey: ["product-variants", item?.product_id],
    queryFn: async () => {
      if (!item?.product_id) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, sku, selling_price, is_active, color:colors(id, name), size:sizes(id, label)")
        .eq("product_id", item.product_id)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!item?.product_id && open,
  });

  // Initialize color/size from current variant
  useEffect(() => {
    if (variants && variantId) {
      const v: any = variants.find((x: any) => x.id === variantId);
      if (v) {
        setSelectedColor(v.color?.name || "");
        setSelectedSize(v.size?.label || "");
      }
    }
  }, [variants, variantId]);

  const colorOptions = useMemo(() => {
    const map = new Map<string, string>();
    (variants || []).forEach((v: any) => v.color?.name && map.set(v.color.name, v.color.name));
    return Array.from(map.keys());
  }, [variants]);

  const sizeOptions = useMemo(() => {
    const map = new Map<string, string>();
    (variants || []).forEach((v: any) => {
      if (selectedColor && v.color?.name !== selectedColor) return;
      if (v.size?.label) map.set(v.size.label, v.size.label);
    });
    return Array.from(map.keys());
  }, [variants, selectedColor]);

  // Resolve matching variant when color/size change
  useEffect(() => {
    if (!variants || variants.length === 0) return;
    const match: any = variants.find((v: any) => {
      const colorOk = !selectedColor || v.color?.name === selectedColor;
      const sizeOk = !selectedSize || v.size?.label === selectedSize;
      return colorOk && sizeOk;
    });
    if (match && match.id !== variantId) {
      setVariantId(match.id);
      if (match.selling_price) setUnitPrice(Number(match.selling_price));
    }
  }, [selectedColor, selectedSize, variants]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!item) return;
      const lineTotal = quantity * unitPrice;
      const matchVariant: any = variants?.find((v: any) => v.id === variantId);
      const variantDetails: Record<string, string> = {};
      if (matchVariant?.color?.name) variantDetails.color = matchVariant.color.name;
      if (matchVariant?.size?.label) variantDetails.size = matchVariant.size.label;

      const { error: itemError } = await supabase
        .from("order_items")
        .update({
          quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
          variant_id: variantId,
          variant_sku: matchVariant?.sku || item.variant_sku,
          variant_details: variantDetails,
        })
        .eq("id", item.id);
      if (itemError) throw itemError;

      const { data: allItems } = await supabase
        .from("order_items").select("line_total").eq("order_id", orderId);
      const newSubtotal = (allItems || []).reduce((s, i) => s + Number(i.line_total), 0);
      const { data: order } = await supabase
        .from("orders").select("shipping_cost, discount_amount, tax_amount").eq("id", orderId).single();
      const newTotal = newSubtotal - Number(order!.discount_amount) + Number(order!.shipping_cost) + Number(order!.tax_amount);
      await supabase.from("orders").update({ subtotal: newSubtotal, total_amount: newTotal }).eq("id", orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order item updated");
      onClose();
    },
    onError: (e: Error) => toast.error("Failed: " + e.message),
  });

  if (!item) return null;
  const lineTotal = quantity * unitPrice;
  const hasVariants = (variants?.length || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Order Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Product</Label>
            <p className="font-medium">{item.product_name}</p>
          </div>

          {hasVariants && (
            <div className="grid grid-cols-2 gap-3">
              {colorOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-1">
                    {colorOptions.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setSelectedColor(c === selectedColor ? "" : c)}
                        className={`px-2 py-1 text-xs border rounded ${selectedColor === c ? "bg-foreground text-background border-foreground" : "border-border"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {sizeOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Size</Label>
                  <div className="flex flex-wrap gap-1">
                    {sizeOptions.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSelectedSize(s === selectedSize ? "" : s)}
                        className={`px-2 py-1 text-xs border rounded ${selectedSize === s ? "bg-foreground text-background border-foreground" : "border-border"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Unit Price (৳)</Label>
              <Input type="number" min={0} step={0.01} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
            </div>
          </div>

          <div className="p-3 bg-muted rounded flex justify-between text-sm">
            <span>Line Total:</span>
            <span className="font-medium">{formatCurrency(lineTotal)}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderItemEditModal;
