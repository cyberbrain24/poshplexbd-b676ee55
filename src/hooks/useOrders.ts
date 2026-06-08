import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'partially_delivered' | 'returned' | 'cancelled' | 'failed' | 'rto';
export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'partially_paid' | 'partially_refunded' | 'refunded' | 'failed';
export type PaymentMethodType = 'cod' | 'mobile_banking' | 'bank_transfer' | 'card' | 'online_gateway';
export type ItemFulfillmentStatus = 'pending' | 'reserved' | 'shipped' | 'delivered' | 'out_of_stock' | 'returned' | 'return_pending' | 'damaged' | 'cancelled';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method_id: string | null;
  payment_method_type: PaymentMethodType | null;
  transaction_id: string | null;
  sender_number: string | null;
  payment_proof_url: string | null;
  payment_verified_at: string | null;
  payment_verified_by: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  currency: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_email: string | null;
  shipping_address: string;
  shipping_city: string | null;
  shipping_division_id: string | null;
  shipping_thana_id: string | null;
  shipping_postal_code: string | null;
  tracking_number: string | null;
  courier_name: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  risk_level: RiskLevel;
  risk_flags: string[];
  ip_address: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  collected_amount: number | null;
  promo_code: string | null;
  promo_code_id: string | null;
  promo_discount: number | null;
  amount_approved_at: string | null;
  amount_approved_by: string | null;
  customer_called_at: string | null;
  call_center_notes: string | null;
  consignment_id?: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address?: string | null;
  } | null;
  payment_method?: {
    id: string;
    name: string;
    type: PaymentMethodType;
    instructions?: string | null;
    account_details?: Record<string, any>;
  } | null;
  items?: OrderItem[];
  shipping_division?: {
    id: string;
    name: string;
  } | null;
  shipping_thana?: {
    id: string;
    name: string;
  } | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_sku: string | null;
  variant_details: Record<string, any>;
  unit_price: number;
  quantity: number;
  line_total: number;
  fulfillment_status: ItemFulfillmentStatus;
  fulfilled_quantity: number;
  returned_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  order_item_id: string | null;
  previous_status: string | null;
  new_status: string;
  status_type: string;
  changed_by: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  instructions: string | null;
  account_details: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

// Fetch all orders for admin
export const useOrders = (filters?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          *,
          customer:customers(id, name, phone, email),
          payment_method:payment_methods(id, name, type),
          items:order_items(*, product:products(id, product_images(image_url, is_main, sort_order), product_categories(category:categories(id, name, parent_id, parent:categories!parent_id(id, name)))))
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters?.status) {
        query = query.eq("order_status", filters.status);
      }
      if (filters?.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }
      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,shipping_name.ilike.%${filters.search}%,shipping_phone.ilike.%${filters.search}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Fetch single order with full details
export const useOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(id, name, phone, email, address),
          payment_method:payment_methods(id, name, type, instructions, account_details),
          items:order_items(*),
          shipping_division:divisions(id, name),
          shipping_thana:thanas(id, name)
        `)
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!orderId,
  });
};

// Fetch order history/timeline
export const useOrderHistory = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ["order-history", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderStatusHistory[];
    },
    enabled: !!orderId,
  });
};

// Fetch payment methods
export const usePaymentMethods = (activeOnly = false) => {
  return useQuery({
    queryKey: ["payment-methods", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order");
      
      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentMethod[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Update order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      notes 
    }: { 
      orderId: string; 
      status: OrderStatus; 
      notes?: string;
    }) => {
      // Get current status first
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("order_status")
        .eq("id", orderId)
        .single();

      // Update order
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          order_status: status,
          ...(status === 'shipped' && { shipped_at: new Date().toISOString() }),
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() }),
        })
        .eq("id", orderId);
      
      if (updateError) throw updateError;

      // Add to history
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          previous_status: currentOrder?.order_status,
          new_status: status,
          status_type: 'order',
          notes,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error("Failed to update order status");
      console.error(error);
    },
  });
};

// Update payment status
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      notes 
    }: { 
      orderId: string; 
      status: PaymentStatus; 
      notes?: string;
    }) => {
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .single();

      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          payment_status: status,
          ...(status === 'paid' && { payment_verified_at: new Date().toISOString() }),
        })
        .eq("id", orderId);
      
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          previous_status: currentOrder?.payment_status,
          new_status: status,
          status_type: 'payment',
          notes,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
      toast.success("Payment status updated");
    },
    onError: (error) => {
      toast.error("Failed to update payment status");
      console.error(error);
    },
  });
};

// Update item fulfillment status
export const useUpdateItemFulfillment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      itemId, 
      orderId,
      status, 
      fulfilledQuantity,
      notes 
    }: { 
      itemId: string;
      orderId: string;
      status: ItemFulfillmentStatus; 
      fulfilledQuantity?: number;
      notes?: string;
    }) => {
      const { data: currentItem } = await supabase
        .from("order_items")
        .select("fulfillment_status, quantity")
        .eq("id", itemId)
        .single();

      const { error: updateError } = await supabase
        .from("order_items")
        .update({ 
          fulfillment_status: status,
          ...(fulfilledQuantity !== undefined && { fulfilled_quantity: fulfilledQuantity }),
        })
        .eq("id", itemId);
      
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          order_item_id: itemId,
          previous_status: currentItem?.fulfillment_status,
          new_status: status,
          status_type: 'fulfillment',
          notes,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
      toast.success("Item status updated");
    },
    onError: (error) => {
      toast.error("Failed to update item status");
      console.error(error);
    },
  });
};

// Update order (general fields)
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: Partial<Order> }) => {
      const { error } = await supabase
        .from("orders")
        .update(data)
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      toast.success("Order updated");
    },
    onError: (error) => {
      toast.error("Failed to update order");
      console.error(error);
    },
  });
};

// Delete order with full cascade (including linked transactions)
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      // 1. Get linked transaction IDs from order_payments before deleting them
      const { data: orderPayments } = await supabase
        .from("order_payments")
        .select("transaction_id")
        .eq("order_id", orderId);
      
      const transactionIds = orderPayments
        ?.map(p => p.transaction_id)
        .filter((id): id is string => id !== null) || [];

      // 2. Delete order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;

      // 3. Delete order status history
      const { error: historyError } = await supabase
        .from("order_status_history")
        .delete()
        .eq("order_id", orderId);
      if (historyError) throw historyError;

      // 4. Delete order payments (must be before transactions due to FK)
      const { error: paymentsError } = await supabase
        .from("order_payments")
        .delete()
        .eq("order_id", orderId);
      if (paymentsError) throw paymentsError;

      // 5. Delete linked transactions (triggers will update account balances)
      if (transactionIds.length > 0) {
        const { error: transactionsError } = await supabase
          .from("transactions")
          .delete()
          .in("id", transactionIds);
        if (transactionsError) throw transactionsError;
      }

      // 6. Delete return requests
      const { error: returnsError } = await supabase
        .from("return_requests")
        .delete()
        .eq("order_id", orderId);
      if (returnsError) throw returnsError;

      // 7. Delete promo_code_usages referencing this order
      const { error: promoUsagesError } = await supabase
        .from("promo_code_usages")
        .delete()
        .eq("order_id", orderId);
      if (promoUsagesError) throw promoUsagesError;

      // 8. Finally delete the order
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Order and linked transactions deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete order");
      console.error(error);
    },
  });
};


// Mark customer as called by call center (toggle)
export const useMarkOrderCalled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, called }: { orderId: string; called: boolean }) => {
      const { error } = await supabase
        .from("orders")
        .update({ customer_called_at: called ? new Date().toISOString() : null })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update"),
  });
};

// Save call center notes
export const useUpdateCallCenterNotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ call_center_notes: notes })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Call notes saved");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save notes"),
  });
};


export const useOrderStats = () => {
  return useQuery({
    queryKey: ["order-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, order_status, payment_status, total_amount, created_at");
      
      if (error) throw error;

      const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) || [];
      const pendingVerification = orders?.filter(o => o.payment_status === 'pending_verification') || [];
      const pendingFulfillment = orders?.filter(o => 
        o.order_status === 'confirmed' || o.order_status === 'processing'
      ) || [];

      // Today's order grand total (sum of all today's order amounts)
      const todayOrderAmount = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Today's revenue = actual payments received today (from order_payments)
      const { data: todayPayments } = await supabase
        .from("order_payments")
        .select("amount")
        .gte("recorded_at", today.toISOString());

      const todayRevenue = (todayPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      // Total revenue = all payments ever received
      const { data: allPayments } = await supabase
        .from("order_payments")
        .select("amount");

      const totalRevenue = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        totalOrders: orders?.length || 0,
        todayOrders: todayOrders.length,
        todayOrderAmount,
        todayRevenue,
        pendingVerification: pendingVerification.length,
        pendingFulfillment: pendingFulfillment.length,
        totalRevenue,
      };
    },
    staleTime: 1000 * 60,
  });
};
