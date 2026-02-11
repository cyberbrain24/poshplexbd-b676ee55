import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart, CartItem } from "@/contexts/CartContext";
import { PaymentMethodType } from "./useOrders";

interface CheckoutData {
  // Customer info
  customerId?: string;
  guestEmail?: string;
  guestPhone?: string;
  
  // Shipping info
  shippingName: string;
  shippingPhone: string;
  shippingEmail?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingDivisionId?: string;
  shippingThanaId?: string;
  shippingPostalCode?: string;
  
  // Payment info
  paymentMethodId: string;
  paymentMethodType: PaymentMethodType;
  transactionId?: string;
  senderNumber?: string;
  paymentProofUrl?: string;
  
  // Pricing
  subtotal: number;
  discountAmount?: number;
  shippingCost?: number;
  taxAmount?: number;
  
  // Partial Payment - amount customer is paying upfront
  paidAmount?: number;
  
  // Notes
  customerNotes?: string;
}

interface CheckoutResult {
  orderId: string;
  orderNumber: string;
}

// Calculate risk score for an order
const calculateRiskScore = async (
  customerId: string | undefined,
  paymentMethodType: PaymentMethodType,
  totalAmount: number
): Promise<{ riskLevel: 'low' | 'medium' | 'high'; flags: string[] }> => {
  const flags: string[] = [];
  let riskScore = 0;

  // Check if COD and high value
  if (paymentMethodType === 'cod' && totalAmount > 10000) {
    flags.push('High-value COD order');
    riskScore += 2;
  }

  if (customerId) {
    // Check customer history
    const { data: profile } = await supabase
      .from("customer_risk_profiles")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    if (profile) {
      // High cancellation rate
      if (profile.cancellation_rate > 30) {
        flags.push(`High cancellation rate (${profile.cancellation_rate.toFixed(0)}%)`);
        riskScore += 3;
      }

      // High return rate
      if (profile.return_rate > 30) {
        flags.push(`High return rate (${profile.return_rate.toFixed(0)}%)`);
        riskScore += 2;
      }

      // Multiple active COD orders
      if (paymentMethodType === 'cod' && profile.active_cod_orders >= 2) {
        flags.push(`${profile.active_cod_orders + 1} active COD orders`);
        riskScore += 3;
      }

      // Is blacklisted
      if (profile.is_blacklisted) {
        flags.push('Customer is blacklisted');
        riskScore += 10;
      }
    }
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskScore >= 5) {
    riskLevel = 'high';
  } else if (riskScore >= 2) {
    riskLevel = 'medium';
  }

  return { riskLevel, flags };
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { clearCart } = useCart();

  return useMutation({
    mutationFn: async ({ 
      checkoutData, 
      cartItems 
    }: { 
      checkoutData: CheckoutData; 
      cartItems: CartItem[];
    }): Promise<CheckoutResult> => {
      // Calculate risk score
      const { riskLevel, flags } = await calculateRiskScore(
        checkoutData.customerId,
        checkoutData.paymentMethodType,
        checkoutData.subtotal + (checkoutData.shippingCost || 0)
      );

      // Determine initial payment status based on paid amount and method
      const paidAmount = checkoutData.paidAmount || 0;
      const totalAmount = checkoutData.subtotal 
        - (checkoutData.discountAmount || 0) 
        + (checkoutData.shippingCost || 0) 
        + (checkoutData.taxAmount || 0);

      // Determine payment status:
      // - If paid in full -> 'paid' (for non-COD) or 'pending_verification' 
      // - If partially paid -> 'partially_paid' (needs verification for non-COD)
      // - If COD with no upfront -> 'unpaid'
      // - If other methods with submission -> 'pending_verification'
      let paymentStatus: 'unpaid' | 'pending_verification' | 'paid' | 'partially_paid';
      
      if (checkoutData.paymentMethodType === 'cod') {
        // COD: unpaid unless partial amount specified
        paymentStatus = paidAmount > 0 ? 'partially_paid' : 'unpaid';
      } else {
        // Non-COD: pending verification, or partially_paid if partial
        if (paidAmount > 0 && paidAmount < totalAmount) {
          paymentStatus = 'partially_paid';
        } else {
          paymentStatus = 'pending_verification';
        }
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: `PO-${Date.now()}`, // Will be replaced by trigger
          customer_id: checkoutData.customerId || null,
          guest_email: checkoutData.guestEmail || null,
          guest_phone: checkoutData.guestPhone || null,
          order_status: 'pending' as const,
          payment_status: paymentStatus,
          payment_method_id: checkoutData.paymentMethodId,
          payment_method_type: checkoutData.paymentMethodType,
          transaction_id: checkoutData.transactionId || null,
          sender_number: checkoutData.senderNumber || null,
          payment_proof_url: checkoutData.paymentProofUrl || null,
          subtotal: checkoutData.subtotal,
          discount_amount: checkoutData.discountAmount || 0,
          shipping_cost: checkoutData.shippingCost || 0,
          tax_amount: checkoutData.taxAmount || 0,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          shipping_name: checkoutData.shippingName,
          shipping_phone: checkoutData.shippingPhone,
          shipping_email: checkoutData.shippingEmail || null,
          shipping_address: checkoutData.shippingAddress,
          shipping_city: checkoutData.shippingCity || null,
          shipping_division_id: checkoutData.shippingDivisionId || null,
          shipping_thana_id: checkoutData.shippingThanaId || null,
          shipping_postal_code: checkoutData.shippingPostalCode || null,
          customer_notes: checkoutData.customerNotes || null,
          risk_level: riskLevel,
          risk_flags: flags,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Validate variant IDs exist before inserting
      const variantIds = cartItems.map(i => i.variantId).filter(Boolean) as string[];
      let validVariantIds = new Set<string>();
      if (variantIds.length > 0) {
        const { data: validVariants } = await supabase
          .from("product_variants")
          .select("id")
          .in("id", variantIds);
        validVariantIds = new Set((validVariants || []).map(v => v.id));
      }

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.productId || null,
        variant_id: (item.variantId && validVariantIds.has(item.variantId)) ? item.variantId : null,
        product_name: item.name,
        variant_sku: item.sku || null,
        variant_details: {
          color: item.color || null,
          size: item.size || null,
          image: item.image || null,
        },
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity,
        fulfillment_status: 'pending' as const,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Add initial status history
      await supabase
        .from("order_status_history")
        .insert({
          order_id: order.id,
          new_status: 'pending',
          status_type: 'order',
          notes: 'Order placed',
        });

      return {
        orderId: order.id,
        orderNumber: order.order_number,
      };
    },
    onSuccess: (result) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      toast.success(`Order ${result.orderNumber} placed successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to place order");
      console.error(error);
    },
  });
};

// Track order by order number, phone, or email (any one field)
export const useTrackOrder = () => {
  return useMutation({
    mutationFn: async ({ 
      orderNumber, 
      phone,
      email,
    }: { 
      orderNumber?: string; 
      phone?: string;
      email?: string;
    }) => {
      // Build query based on provided fields
      let query = supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*),
          payment_method:payment_methods(id, name, type),
          status_history:order_status_history(*)
        `)
        .order("created_at", { referencedTable: "status_history", ascending: false });

      // Apply filters based on what's provided
      const filters: string[] = [];
      
      if (orderNumber?.trim()) {
        filters.push(`order_number.eq.${orderNumber.trim()}`);
      }
      if (phone?.trim()) {
        filters.push(`shipping_phone.eq.${phone.trim()}`);
        filters.push(`guest_phone.eq.${phone.trim()}`);
      }
      if (email?.trim()) {
        filters.push(`shipping_email.eq.${email.trim()}`);
        filters.push(`guest_email.eq.${email.trim()}`);
      }

      if (filters.length === 0) {
        throw new Error("Please provide at least one search field");
      }

      // Use OR to match any of the provided fields
      query = query.or(filters.join(','));

      const { data, error } = await query;

      if (error) throw new Error("Order not found");
      if (!data || data.length === 0) throw new Error("Order not found");
      
      // Return orders array for multiple matches, or single order
      return data.length === 1 ? data[0] : data;
    },
  });
};