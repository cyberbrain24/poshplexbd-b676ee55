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
  
  // Promo code info
  promoCodeId?: string;
  promoCode?: string;
  promoDiscount?: number;
  
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

      // Prepare order items data
      const orderItemsData = cartItems.map(item => ({
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
      }));

      // Prepare order data
      const orderPayload = {
        customer_id: checkoutData.customerId || null,
        guest_email: checkoutData.guestEmail || null,
        guest_phone: checkoutData.guestPhone || null,
        order_status: 'pending',
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
        promo_code: checkoutData.promoCode || null,
        promo_code_id: checkoutData.promoCodeId || null,
        promo_discount: checkoutData.promoDiscount || 0,
      };

      let orderId: string;
      let orderNumber: string;

      // Try atomic RPC first, fallback to sequential inserts
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          "create_order_atomic",
          {
            p_order: orderPayload,
            p_items: orderItemsData,
          }
        );

        if (rpcError) throw rpcError;

        orderId = (rpcResult as any).order_id;
        orderNumber = (rpcResult as any).order_number;
      } catch (rpcErr) {
        // Fallback: sequential inserts (existing proven flow)
        console.warn("Atomic order RPC failed, using sequential fallback:", rpcErr);

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([{
            order_number: `PO-${Date.now()}`,
            customer_id: orderPayload.customer_id,
            guest_email: orderPayload.guest_email,
            guest_phone: orderPayload.guest_phone,
            order_status: orderPayload.order_status as 'pending',
            payment_status: orderPayload.payment_status as any,
            payment_method_id: orderPayload.payment_method_id,
            payment_method_type: orderPayload.payment_method_type,
            transaction_id: orderPayload.transaction_id,
            sender_number: orderPayload.sender_number,
            payment_proof_url: orderPayload.payment_proof_url,
            subtotal: orderPayload.subtotal,
            discount_amount: orderPayload.discount_amount,
            shipping_cost: orderPayload.shipping_cost,
            tax_amount: orderPayload.tax_amount,
            total_amount: orderPayload.total_amount,
            paid_amount: orderPayload.paid_amount,
            shipping_name: orderPayload.shipping_name,
            shipping_phone: orderPayload.shipping_phone,
            shipping_email: orderPayload.shipping_email,
            shipping_address: orderPayload.shipping_address,
            shipping_city: orderPayload.shipping_city,
            shipping_division_id: orderPayload.shipping_division_id,
            shipping_thana_id: orderPayload.shipping_thana_id,
            shipping_postal_code: orderPayload.shipping_postal_code,
            customer_notes: orderPayload.customer_notes,
            risk_level: orderPayload.risk_level as any,
            risk_flags: orderPayload.risk_flags,
            promo_code: orderPayload.promo_code,
            promo_code_id: orderPayload.promo_code_id,
            promo_discount: orderPayload.promo_discount,
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        const itemsWithOrderId = orderItemsData.map(item => ({
          ...item,
          order_id: order.id,
          fulfillment_status: 'pending' as const,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(itemsWithOrderId);

        if (itemsError) throw itemsError;

        await supabase
          .from("order_status_history")
          .insert({
            order_id: order.id,
            new_status: 'pending',
            status_type: 'order',
            notes: 'Order placed',
          });

        orderId = order.id;
        orderNumber = order.order_number;
      }

      // Record promo code usage if applied
      if (checkoutData.promoCodeId) {
        const { recordPromoUsage } = await import("@/lib/promo");
        await recordPromoUsage(
          checkoutData.promoCodeId,
          checkoutData.customerId || null,
          orderId,
          checkoutData.promoDiscount || 0,
        );
      }

      return { orderId, orderNumber };
    },
    onSuccess: (result) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      toast.success(`Order ${result.orderNumber} placed successfully!`);
      // Fire-and-forget order_placed SMS (provider/template may be disabled — ignored silently)
      supabase.functions.invoke("sms-order-placed", { body: { order_id: result.orderId } }).catch(() => {});
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to place order");
      console.error(error);
    },
  });
};

// Track order by order number, phone, or email (any one field)
// Uses SECURITY DEFINER RPC so guests can look up their own orders
// without exposing all guest orders via RLS.
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
      if (!orderNumber?.trim() && !phone?.trim() && !email?.trim()) {
        throw new Error("Please provide at least one search field");
      }

      const { data, error } = await supabase.rpc("track_orders_lookup", {
        p_order_number: orderNumber?.trim() || null,
        p_phone: phone?.trim() || null,
        p_email: email?.trim() || null,
      });

      if (error) throw new Error("Order not found");
      const arr = (data as any[]) || [];
      if (arr.length === 0) throw new Error("Order not found");
      return arr.length === 1 ? arr[0] : arr;
    },
  });
};