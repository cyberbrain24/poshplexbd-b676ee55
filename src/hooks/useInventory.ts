import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type InventoryTransactionType = 'reserve' | 'deduct' | 'restock' | 'return_good' | 'return_damaged' | 'adjustment' | 'initial';

export interface InventoryTransaction {
  id: string;
  variant_id: string;
  order_id: string | null;
  order_item_id: string | null;
  transaction_type: InventoryTransactionType;
  quantity: number;
  available_stock_after: number;
  reserved_stock_after: number;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}

// Reserve stock when order is placed
export const useReserveStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId 
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
    }) => {
      // Get current stock levels
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("available_stock, reserved_stock, stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");
      
      if (variant.available_stock < quantity) {
        throw new Error("Insufficient stock available");
      }

      const newAvailable = variant.available_stock - quantity;
      const newReserved = variant.reserved_stock + quantity;

      // Update stock atomically
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          available_stock: newAvailable,
          reserved_stock: newReserved,
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      // Log transaction
      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: 'reserve',
          quantity: quantity,
          available_stock_after: newAvailable,
          reserved_stock_after: newReserved,
          notes: `Reserved ${quantity} units for order`,
        });

      if (logError) throw logError;

      return { newAvailable, newReserved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
    },
    onError: (error) => {
      console.error("Failed to reserve stock:", error);
    },
  });
};

// Deduct stock when order is shipped/delivered
export const useDeductStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId 
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
    }) => {
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("available_stock, reserved_stock, stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      const newReserved = Math.max(0, variant.reserved_stock - quantity);
      const newStock = variant.stock - quantity;

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          reserved_stock: newReserved,
          stock: newStock,
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: 'deduct',
          quantity: -quantity,
          available_stock_after: variant.available_stock,
          reserved_stock_after: newReserved,
          notes: `Deducted ${quantity} units - order fulfilled`,
        });

      if (logError) throw logError;

      return { newReserved, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
    },
    onError: (error) => {
      toast.error("Failed to deduct stock");
      console.error(error);
    },
  });
};

// Restock when order is cancelled or payment fails
export const useRestockFromCancel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId,
      reason 
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
      reason: string;
    }) => {
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("available_stock, reserved_stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      const newAvailable = variant.available_stock + quantity;
      const newReserved = Math.max(0, variant.reserved_stock - quantity);

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          available_stock: newAvailable,
          reserved_stock: newReserved,
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: 'restock',
          quantity: quantity,
          available_stock_after: newAvailable,
          reserved_stock_after: newReserved,
          notes: `Restocked ${quantity} units - ${reason}`,
        });

      if (logError) throw logError;

      return { newAvailable, newReserved };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      toast.success("Stock restored");
    },
    onError: (error) => {
      toast.error("Failed to restore stock");
      console.error(error);
    },
  });
};

// Handle return - restock as good or damaged
export const useProcessReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId,
      returnType 
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
      returnType: 'good' | 'damaged';
    }) => {
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("available_stock, reserved_stock, stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      let newAvailable = variant.available_stock;
      let newStock = variant.stock;

      if (returnType === 'good') {
        // Add back to sellable stock
        newAvailable = variant.available_stock + quantity;
        newStock = variant.stock + quantity;
      }
      // For damaged items, we don't add back to stock

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          available_stock: newAvailable,
          stock: newStock,
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: returnType === 'good' ? 'return_good' : 'return_damaged',
          quantity: returnType === 'good' ? quantity : 0,
          available_stock_after: newAvailable,
          reserved_stock_after: variant.reserved_stock,
          notes: returnType === 'good' 
            ? `Returned ${quantity} units - restocked`
            : `Returned ${quantity} units - marked as damaged`,
        });

      if (logError) throw logError;

      return { newAvailable, newStock };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
      toast.success(
        variables.returnType === 'good' 
          ? "Item restocked successfully" 
          : "Item marked as damaged"
      );
    },
    onError: (error) => {
      toast.error("Failed to process return");
      console.error(error);
    },
  });
};

// Manual stock adjustment
export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      newStock, 
      reason 
    }: { 
      variantId: string; 
      newStock: number; 
      reason: string;
    }) => {
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("available_stock, reserved_stock, stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      const stockDiff = newStock - variant.stock;
      const newAvailable = variant.available_stock + stockDiff;

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          stock: newStock,
          available_stock: Math.max(0, newAvailable),
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          transaction_type: 'adjustment',
          quantity: stockDiff,
          available_stock_after: Math.max(0, newAvailable),
          reserved_stock_after: variant.reserved_stock,
          notes: reason,
        });

      if (logError) throw logError;

      return { newStock, newAvailable: Math.max(0, newAvailable) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      toast.success("Stock adjusted");
    },
    onError: (error) => {
      toast.error("Failed to adjust stock");
      console.error(error);
    },
  });
};

// Check stock availability
export const checkStockAvailability = async (items: { variantId: string; quantity: number }[]) => {
  const results: { variantId: string; available: boolean; currentStock: number; requested: number }[] = [];

  for (const item of items) {
    const { data: variant, error } = await supabase
      .from("product_variants")
      .select("available_stock")
      .eq("id", item.variantId)
      .single();

    if (error || !variant) {
      results.push({ 
        variantId: item.variantId, 
        available: false, 
        currentStock: 0, 
        requested: item.quantity 
      });
    } else {
      results.push({
        variantId: item.variantId,
        available: variant.available_stock >= item.quantity,
        currentStock: variant.available_stock,
        requested: item.quantity,
      });
    }
  }

  return results;
};
