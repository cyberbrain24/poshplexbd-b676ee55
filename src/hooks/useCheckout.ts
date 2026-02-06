import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart, CartItem } from "@/contexts/CartContext";
import { PaymentMethodType } from "./useOrders";
import { checkStockAvailability } from "./useInventory";

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
      // Step 1: Check stock availability
      const stockCheck = await checkStockAvailability(
        cartItems.map(item => ({
          variantId: item.variantId || item.id,
          quantity: item.quantity,
        }))
      );

      const outOfStock = stockCheck.filter(s => !s.available);
      if (outOfStock.length > 0) {
        throw new Error("Some items are out of stock. Please update your cart.");
      }

      // Step 2: Calculate risk score
      const { riskLevel, flags } = await calculateRiskScore(
        checkoutData.customerId,
        checkoutData.paymentMethodType,
        checkoutData.subtotal + (checkoutData.shippingCost || 0)
      );

      // Step 3: Determine initial payment status
      const paymentStatus = checkoutData.paymentMethodType === 'cod' 
        ? 'unpaid' 
        : 'pending_verification';

      // Step 4: Create order
      const totalAmount = checkoutData.subtotal 
        - (checkoutData.discountAmount || 0) 
        + (checkoutData.shippingCost || 0) 
        + (checkoutData.taxAmount || 0);

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

      // Step 5: Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.productId || null,
        variant_id: item.variantId || null,
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

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      // Step 6: Reserve stock for each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const cartItem = cartItems[i];
        const variantId = cartItem.variantId || cartItem.id;

        // Get current stock
        const { data: variant } = await supabase
          .from("product_variants")
          .select("available_stock, reserved_stock")
          .eq("id", variantId)
          .single();

        if (variant) {
          const newAvailable = variant.available_stock - cartItem.quantity;
          const newReserved = variant.reserved_stock + cartItem.quantity;

          // Update stock
          await supabase
            .from("product_variants")
            .update({
              available_stock: newAvailable,
              reserved_stock: newReserved,
            })
            .eq("id", variantId);

          // Log transaction
          await supabase
            .from("inventory_transactions")
            .insert({
              variant_id: variantId,
              order_id: order.id,
              order_item_id: item.id,
              transaction_type: 'reserve',
              quantity: cartItem.quantity,
              available_stock_after: newAvailable,
              reserved_stock_after: newReserved,
              notes: `Reserved for order ${order.order_number}`,
            });

          // Update item status to reserved
          await supabase
            .from("order_items")
            .update({ fulfillment_status: 'reserved' })
            .eq("id", item.id);
        }
      }

      // Step 7: Add initial status history
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

// Track order by order number (for guest checkout)
export const useTrackOrder = () => {
  return useMutation({
    mutationFn: async ({ 
      orderNumber, 
      phone 
    }: { 
      orderNumber: string; 
      phone: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*),
          payment_method:payment_methods(id, name, type)
        `)
        .eq("order_number", orderNumber)
        .or(`shipping_phone.eq.${phone},guest_phone.eq.${phone}`)
        .single();

      if (error) throw new Error("Order not found");
      return data;
    },
  });
};
