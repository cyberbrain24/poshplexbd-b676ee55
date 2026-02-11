/**
 * Promo Code utility functions
 * Centralized validation and calculation logic for promo codes
 */

import { supabase } from "@/integrations/supabase/client";

export type RewardType = 'percentage_discount' | 'fixed_discount' | 'free_delivery' | 'membership_reward';

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  reward_type: RewardType;
  reward_membership_type_id: string | null;
  reward_trigger: 'paid' | 'delivered';
  created_at: string;
}

export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  promo?: PromoCode;
  discount: number;
  freeDelivery: boolean;
  membershipReward?: { typeId: string; trigger: 'paid' | 'delivered' };
}

/**
 * Validate and calculate promo code results
 */
export const validatePromoCode = async (
  code: string,
  subtotal: number,
  shippingCost: number,
  customerPhone?: string,
  customerId?: string | null,
): Promise<PromoValidationResult> => {
  const fail = (error: string): PromoValidationResult => ({
    valid: false, error, discount: 0, freeDelivery: false,
  });

  // Fetch promo code
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error) return fail("Failed to validate promo code");
  if (!data) return fail("Invalid promo code");

  const promo = data as PromoCode;

  // Check starts_at
  if (promo.starts_at && new Date(promo.starts_at) > new Date()) {
    return fail("This promo code is not active yet");
  }

  // Check expiry
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return fail("This promo code has expired");
  }

  // Check min order amount
  if (promo.min_order_amount && subtotal < promo.min_order_amount) {
    return fail(`Minimum order amount for this promo is ৳${promo.min_order_amount}`);
  }

  // Check total usage limit
  if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
    return fail("This promo code has reached its usage limit");
  }

  // Check per-customer limit by phone
  if (promo.per_customer_limit && customerPhone) {
    // Find all customer IDs for this phone
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", customerPhone.trim());

    const customerIds = customers?.map(c => c.id) || [];

    if (customerIds.length > 0) {
      const { count } = await supabase
        .from("promo_code_usages")
        .select("id", { count: "exact", head: true })
        .eq("promo_code_id", promo.id)
        .in("customer_id", customerIds);

      if (count && count >= promo.per_customer_limit) {
        return fail("You have already used this promo code the maximum number of times");
      }
    }

    // Also check by customer_id if provided
    if (customerId && !customerIds.some(id => id === customerId)) {
      const { count } = await supabase
        .from("promo_code_usages")
        .select("id", { count: "exact", head: true })
        .eq("promo_code_id", promo.id)
        .eq("customer_id", customerId);

      if (count && count >= promo.per_customer_limit) {
        return fail("You have already used this promo code the maximum number of times");
      }
    }
  }

  // Calculate based on reward_type
  let discount = 0;
  let freeDelivery = false;
  let membershipReward: PromoValidationResult['membershipReward'];

  switch (promo.reward_type) {
    case 'percentage_discount':
      discount = (subtotal * promo.discount_value) / 100;
      if (promo.max_discount_amount) {
        discount = Math.min(discount, promo.max_discount_amount);
      }
      discount = Math.min(discount, subtotal);
      break;

    case 'fixed_discount':
      discount = Math.min(promo.discount_value, subtotal);
      break;

    case 'free_delivery':
      freeDelivery = true;
      discount = 0; // No product discount, shipping becomes 0
      break;

    case 'membership_reward':
      // Membership reward may also have a discount
      if (promo.discount_value > 0) {
        if (promo.discount_type === 'percentage') {
          discount = (subtotal * promo.discount_value) / 100;
          if (promo.max_discount_amount) {
            discount = Math.min(discount, promo.max_discount_amount);
          }
        } else {
          discount = promo.discount_value;
        }
        discount = Math.min(discount, subtotal);
      }
      if (promo.reward_membership_type_id) {
        membershipReward = {
          typeId: promo.reward_membership_type_id,
          trigger: promo.reward_trigger,
        };
      }
      break;
  }

  return {
    valid: true,
    promo,
    discount,
    freeDelivery,
    membershipReward,
  };
};

/**
 * Calculate promo discount for admin order edit (simpler, no per-customer checks)
 */
export const calculatePromoDiscount = (
  promo: PromoCode,
  subtotal: number,
): { discount: number; freeDelivery: boolean } => {
  let discount = 0;
  let freeDelivery = false;

  switch (promo.reward_type) {
    case 'percentage_discount':
      discount = (subtotal * promo.discount_value) / 100;
      if (promo.max_discount_amount) discount = Math.min(discount, promo.max_discount_amount);
      discount = Math.min(discount, subtotal);
      break;
    case 'fixed_discount':
      discount = Math.min(promo.discount_value, subtotal);
      break;
    case 'free_delivery':
      freeDelivery = true;
      break;
    case 'membership_reward':
      if (promo.discount_value > 0) {
        if (promo.discount_type === 'percentage') {
          discount = (subtotal * promo.discount_value) / 100;
          if (promo.max_discount_amount) discount = Math.min(discount, promo.max_discount_amount);
        } else {
          discount = promo.discount_value;
        }
        discount = Math.min(discount, subtotal);
      }
      break;
  }

  return { discount, freeDelivery };
};

/**
 * Record promo code usage and increment usage_count
 */
export const recordPromoUsage = async (
  promoCodeId: string,
  customerId: string | null,
  orderId: string,
  discountAmount: number,
) => {
  // Record usage
  await supabase.from("promo_code_usages").insert({
    promo_code_id: promoCodeId,
    customer_id: customerId,
    order_id: orderId,
    discount_amount: discountAmount,
  });

  // Increment usage_count
  const { data: current } = await supabase
    .from("promo_codes")
    .select("usage_count")
    .eq("id", promoCodeId)
    .single();

  if (current) {
    await supabase
      .from("promo_codes")
      .update({ usage_count: (current.usage_count || 0) + 1 })
      .eq("id", promoCodeId);
  }
};
