/**
 * Poshplex ERP Validation Schemas
 * Zod validation middleware for all data inputs
 */

import { z } from "zod";

// ============================================================
// COMMON VALIDATORS
// ============================================================
const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const phoneSchema = z.string().regex(phoneRegex, "Invalid phone number format");
const uuidSchema = z.string().regex(uuidRegex, "Invalid ID format");
const emailSchema = z.string().email("Invalid email address").max(255);
const priceSchema = z.number().min(0, "Price must be positive").max(10000000);
const quantitySchema = z.number().int().min(0).max(100000);

// ============================================================
// ORDER SCHEMAS
// ============================================================
export const orderItemSchema = z.object({
  product_id: uuidSchema.optional().nullable(),
  variant_id: uuidSchema.optional().nullable(),
  product_name: z.string().min(1).max(255),
  variant_sku: z.string().max(100).optional().nullable(),
  variant_details: z.record(z.any()).optional(),
  unit_price: priceSchema,
  quantity: quantitySchema.min(1),
  line_total: priceSchema,
});

export const createOrderSchema = z.object({
  customer_id: uuidSchema.optional().nullable(),
  guest_email: emailSchema.optional().nullable(),
  guest_phone: phoneSchema.optional().nullable(),
  shipping_name: z.string().min(1, "Name is required").max(255),
  shipping_phone: phoneSchema,
  shipping_email: emailSchema.optional().nullable(),
  shipping_address: z.string().min(5, "Address is required").max(500),
  shipping_city: z.string().max(100).optional().nullable(),
  shipping_division_id: uuidSchema.optional().nullable(),
  shipping_thana_id: uuidSchema.optional().nullable(),
  shipping_postal_code: z.string().max(20).optional().nullable(),
  payment_method_id: uuidSchema.optional().nullable(),
  payment_method_type: z.enum(["cod", "mobile_banking", "bank_transfer", "card", "online_gateway"]).optional().nullable(),
  transaction_id: z.string().max(100).optional().nullable(),
  sender_number: z.string().max(50).optional().nullable(),
  subtotal: priceSchema,
  discount_amount: priceSchema.optional().default(0),
  shipping_cost: priceSchema.optional().default(0),
  tax_amount: priceSchema.optional().default(0),
  total_amount: priceSchema,
  customer_notes: z.string().max(1000).optional().nullable(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
}).refine(
  (data) => data.customer_id || data.guest_email || data.guest_phone,
  { message: "Either customer ID, email, or phone is required" }
);

export const updateOrderStatusSchema = z.object({
  orderId: uuidSchema,
  status: z.enum([
    "pending", "confirmed", "processing", "shipped", 
    "delivered", "partially_delivered", "returned", 
    "cancelled", "failed", "rto"
  ]),
  notes: z.string().max(500).optional(),
});

export const updatePaymentStatusSchema = z.object({
  orderId: uuidSchema,
  status: z.enum([
    "unpaid", "pending_verification", "paid", 
    "partially_paid", "partially_refunded", "refunded", "failed"
  ]),
  notes: z.string().max(500).optional(),
});

// ============================================================
// PRODUCT SCHEMAS
// ============================================================
export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().max(100).optional(),
  product_type: z.enum(["simple", "variable"]),
  category_id: uuidSchema.optional().nullable(),
  brand_id: uuidSchema.optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  full_description: z.string().max(10000).optional().nullable(),
  base_price: priceSchema,
  youtube_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
  youtube_autoplay: z.boolean().optional().default(false),
  youtube_mute: z.boolean().optional().default(true),
  size_guide_id: uuidSchema.optional().nullable(),
  care_instruction_id: uuidSchema.optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const productVariantSchema = z.object({
  color_id: uuidSchema.optional().nullable(),
  size_id: uuidSchema.optional().nullable(),
  material_id: uuidSchema.optional().nullable(),
  sku: z.string().max(100).optional(),
  purchase_price: priceSchema,
  selling_price: priceSchema,
  stock: quantitySchema,
  is_active: z.boolean().optional().default(true),
});

// ============================================================
// INVENTORY SCHEMAS
// ============================================================
export const stockAdjustmentSchema = z.object({
  variantId: uuidSchema,
  newStock: quantitySchema,
  reason: z.string().min(3, "Reason is required").max(500),
});

export const bulkStockAdjustmentSchema = z.object({
  adjustments: z.array(stockAdjustmentSchema).min(1).max(100),
});

export const processReturnSchema = z.object({
  variantId: uuidSchema,
  quantity: quantitySchema.min(1),
  orderId: uuidSchema,
  orderItemId: uuidSchema,
  returnType: z.enum(["restock", "damaged"]),
  orderNumber: z.string().max(50),
});

// ============================================================
// CUSTOMER SCHEMAS
// ============================================================
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: phoneSchema,
  email: emailSchema.optional().nullable(),
  gender: z.enum(["male", "female", "other"]),
  birthdate: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  division_id: uuidSchema.optional().nullable(),
  thana_id: uuidSchema.optional().nullable(),
  customer_type_id: uuidSchema.optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

// ============================================================
// PAYMENT METHOD SCHEMAS
// ============================================================
export const paymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["cod", "mobile_banking", "bank_transfer", "card", "online_gateway"]),
  instructions: z.string().max(1000).optional().nullable(),
  account_details: z.record(z.string()).optional().default({}),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().min(0).max(1000).optional().default(0),
});

// ============================================================
// SEARCH & FILTER SCHEMAS
// ============================================================
export const searchSchema = z.object({
  query: z.string().max(100).optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(50),
});

export const orderFilterSchema = searchSchema.extend({
  status: z.enum([
    "pending", "confirmed", "processing", "shipped", 
    "delivered", "partially_delivered", "returned", 
    "cancelled", "failed", "rto"
  ]).optional(),
  paymentStatus: z.enum([
    "unpaid", "pending_verification", "paid", 
    "partially_paid", "partially_refunded", "refunded", "failed"
  ]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ============================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation failed: ${errors}`);
  }
  return result.data;
}

export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }
  return { success: true, data: result.data };
}

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
