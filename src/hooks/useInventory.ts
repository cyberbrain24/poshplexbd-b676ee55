import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

// Use the database enum type directly
export type InventoryTransactionType = Database["public"]["Enums"]["inventory_transaction_type"];

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
  // Joined data
  variant?: {
    sku: string;
    product?: {
      name: string;
    };
    color?: { name: string } | null;
    size?: { label: string } | null;
  };
  order?: {
    order_number: string;
  } | null;
}

// ============================================================
// DIRECT-SYNC INVENTORY LOGIC
// Stock is immediately affected by lifecycle events
// ============================================================

// Deduct stock immediately when order is placed (sale)
export const useDeductStockOnOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId,
      orderNumber
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
      orderNumber: string;
    }) => {
      // Get current stock
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("stock, available_stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");
      
      if (variant.stock < quantity) {
        throw new Error("Insufficient stock available");
      }

      const newStock = variant.stock - quantity;

      // Immediate deduction - atomic update
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          stock: newStock,
          available_stock: newStock,
          reserved_stock: 0,
        })
        .eq("id", variantId)
        .gte("stock", quantity);

      if (updateError) throw updateError;

      // Log transaction using 'sale' type
      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: 'sale' as InventoryTransactionType,
          quantity: -quantity,
          available_stock_after: newStock,
          reserved_stock_after: 0,
          notes: `Sold ${quantity} units - Order ${orderNumber}`,
        });

      if (logError) throw logError;

      return { previousStock: variant.stock, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
    },
    onError: (error) => {
      console.error("Failed to deduct stock:", error);
    },
  });
};

// Restock immediately when order is cancelled or payment fails
export const useRestockOnCancel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId,
      reason,
      orderNumber
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
      reason: string;
      orderNumber: string;
    }) => {
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("stock, available_stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      const previousStock = variant.stock;
      const newStock = variant.stock + quantity;

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          stock: newStock,
          available_stock: newStock,
          reserved_stock: 0,
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: 'cancellation' as InventoryTransactionType,
          quantity: quantity,
          available_stock_after: newStock,
          reserved_stock_after: 0,
          notes: `Restocked ${quantity} units - ${reason} - Order ${orderNumber}`,
        });

      if (logError) throw logError;

      return { previousStock, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      toast.success("Stock restored successfully");
    },
    onError: (error) => {
      toast.error("Failed to restore stock");
      console.error(error);
    },
  });
};

// Restock specific items when marked as "Out of Stock" during partial fulfillment
export const useRestockOutOfStockItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId,
      orderNumber
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
      orderNumber: string;
    }) => {
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("stock, available_stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      const previousStock = variant.stock;
      const newStock = variant.stock + quantity;

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          stock: newStock,
          available_stock: newStock,
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: 'restock' as InventoryTransactionType,
          quantity: quantity,
          available_stock_after: newStock,
          reserved_stock_after: 0,
          notes: `Restocked ${quantity} units - Item marked as Out of Stock - Order ${orderNumber}`,
        });

      if (logError) throw logError;

      return { previousStock, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      toast.success("Item restocked");
    },
    onError: (error) => {
      toast.error("Failed to restock item");
      console.error(error);
    },
  });
};

// Process return - admin chooses restock vs damaged/write-off
export const useProcessReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      variantId, 
      quantity, 
      orderId, 
      orderItemId,
      returnType,
      orderNumber
    }: { 
      variantId: string; 
      quantity: number; 
      orderId: string; 
      orderItemId: string;
      returnType: 'restock' | 'damaged';
      orderNumber: string;
    }) => {
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("stock, available_stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      const previousStock = variant.stock;
      let newStock = variant.stock;

      if (returnType === 'restock') {
        newStock = variant.stock + quantity;

        const { error: updateError } = await supabase
          .from("product_variants")
          .update({
            stock: newStock,
            available_stock: newStock,
          })
          .eq("id", variantId);

        if (updateError) throw updateError;
      }

      // Log transaction - use return_good or return_damaged from the enum
      const transactionType: InventoryTransactionType = returnType === 'restock' ? 'return_good' : 'return_damaged';
      
      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          order_id: orderId,
          order_item_id: orderItemId,
          transaction_type: transactionType,
          quantity: returnType === 'restock' ? quantity : 0,
          available_stock_after: newStock,
          reserved_stock_after: 0,
          notes: returnType === 'restock' 
            ? `Returned ${quantity} units - Added back to inventory - Order ${orderNumber}`
            : `Returned ${quantity} units - Marked as damaged/write-off - Order ${orderNumber}`,
        });

      if (logError) throw logError;

      return { previousStock, newStock, returnType };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      toast.success(
        result.returnType === 'restock' 
          ? "Item restocked successfully" 
          : "Item marked as damaged/written off"
      );
    },
    onError: (error) => {
      toast.error("Failed to process return");
      console.error(error);
    },
  });
};

// Manual stock adjustment with audit trail
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
        .select("stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");

      const previousStock = variant.stock;
      const stockDiff = newStock - previousStock;

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          stock: Math.max(0, newStock),
          available_stock: Math.max(0, newStock),
          reserved_stock: 0,
        })
        .eq("id", variantId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from("inventory_transactions")
        .insert({
          variant_id: variantId,
          transaction_type: 'adjustment' as InventoryTransactionType,
          quantity: stockDiff,
          available_stock_after: Math.max(0, newStock),
          reserved_stock_after: 0,
          notes: `Manual adjustment: ${previousStock} → ${newStock}. Reason: ${reason}`,
        });

      if (logError) throw logError;

      return { previousStock, newStock: Math.max(0, newStock), stockDiff };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      toast.success("Stock adjusted");
    },
    onError: (error) => {
      toast.error("Failed to adjust stock");
      console.error(error);
    },
  });
};

// Bulk stock adjustment for multiple variants
export const useBulkAdjustStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      adjustments 
    }: { 
      adjustments: Array<{ variantId: string; newStock: number; reason: string }>;
    }) => {
      const results = [];
      
      for (const adj of adjustments) {
        const { data: variant, error: fetchError } = await supabase
          .from("product_variants")
          .select("stock")
          .eq("id", adj.variantId)
          .single();

        if (fetchError) throw fetchError;
        if (!variant) continue;

        const previousStock = variant.stock;
        const stockDiff = adj.newStock - previousStock;

        const { error: updateError } = await supabase
          .from("product_variants")
          .update({
            stock: Math.max(0, adj.newStock),
            available_stock: Math.max(0, adj.newStock),
            reserved_stock: 0,
          })
          .eq("id", adj.variantId);

        if (updateError) throw updateError;

        await supabase
          .from("inventory_transactions")
          .insert({
            variant_id: adj.variantId,
            transaction_type: 'adjustment' as InventoryTransactionType,
            quantity: stockDiff,
            available_stock_after: Math.max(0, adj.newStock),
            reserved_stock_after: 0,
            notes: `Bulk adjustment: ${previousStock} → ${adj.newStock}. Reason: ${adj.reason}`,
          });

        results.push({ variantId: adj.variantId, previousStock, newStock: adj.newStock });
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
      toast.success(`Updated stock for ${results.length} variants`);
    },
    onError: (error) => {
      toast.error("Failed to bulk adjust stock");
      console.error(error);
    },
  });
};

// ============================================================
// QUERIES FOR INVENTORY DATA
// ============================================================

// Get stock history for a specific variant
export const useStockHistory = (variantId: string | null) => {
  return useQuery({
    queryKey: ["inventory-transactions", variantId],
    queryFn: async () => {
      if (!variantId) return [];
      
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(`
          *,
          order:orders(order_number)
        `)
        .eq("variant_id", variantId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as InventoryTransaction[];
    },
    enabled: !!variantId,
  });
};

// Get low-stock items
export const useLowStockItems = (threshold: number = 5) => {
  return useQuery({
    queryKey: ["low-stock-items", threshold],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(`
          id,
          sku,
          stock,
          is_active,
          product:products(id, name, is_active),
          color:colors(name),
          size:sizes(label),
          material:materials(name)
        `)
        .lte("stock", threshold)
        .eq("is_active", true)
        .order("stock", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

// Get all variants for inventory management
export const useInventoryList = () => {
  return useQuery({
    queryKey: ["inventory-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(`
          id,
          sku,
          stock,
          available_stock,
          reserved_stock,
          selling_price,
          purchase_price,
          is_active,
          product:products(id, name, is_active, category:categories(name)),
          color:colors(name, hex_code),
          size:sizes(label),
          material:materials(name)
        `)
        .eq("is_active", true)
        .order("stock", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

// ============================================================
// STOCK AVAILABILITY CHECK
// ============================================================

// Pre-purchase validation - check stock at two points
export const checkStockAvailability = async (
  items: { variantId: string; quantity: number }[]
) => {
  const results: { 
    variantId: string; 
    available: boolean; 
    currentStock: number; 
    requested: number;
    sku?: string;
  }[] = [];

  for (const item of items) {
    const { data: variant, error } = await supabase
      .from("product_variants")
      .select("stock, sku")
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
        available: variant.stock >= item.quantity,
        currentStock: variant.stock,
        requested: item.quantity,
        sku: variant.sku,
      });
    }
  }

  return results;
};
