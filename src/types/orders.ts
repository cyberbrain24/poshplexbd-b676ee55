/**
 * Order-related type definitions
 * Centralized types for order management
 */

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'partially_delivered' 
  | 'returned' 
  | 'cancelled' 
  | 'failed' 
  | 'rto';

export type PaymentStatus = 
  | 'unpaid' 
  | 'pending_verification' 
  | 'paid' 
  | 'partially_paid' 
  | 'partially_refunded' 
  | 'refunded' 
  | 'failed';

export type PaymentMethodType = 
  | 'cod' 
  | 'mobile_banking' 
  | 'bank_transfer' 
  | 'card' 
  | 'online_gateway';

export type ItemFulfillmentStatus = 
  | 'pending' 
  | 'reserved' 
  | 'shipped' 
  | 'delivered' 
  | 'out_of_stock' 
  | 'returned' 
  | 'return_pending' 
  | 'damaged' 
  | 'cancelled';

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
  consignment_id: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  risk_level: RiskLevel;
  risk_flags: string[];
  ip_address: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  collected_amount: number | null;
  amount_approved_at: string | null;
  amount_approved_by: string | null;
  created_at: string;
  updated_at: string;
  customer?: OrderCustomer | null;
  payment_method?: OrderPaymentMethod | null;
  items?: OrderItem[];
  shipping_division?: { id: string; name: string } | null;
  shipping_thana?: { id: string; name: string } | null;
}

export interface OrderCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address?: string | null;
}

export interface OrderPaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  instructions?: string | null;
  account_details?: Record<string, unknown>;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_sku: string | null;
  variant_details: Record<string, unknown>;
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
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  instructions: string | null;
  account_details: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodFormData {
  name: string;
  type: PaymentMethodType;
  instructions?: string;
  account_details?: Record<string, unknown>;
  is_active?: boolean;
  sort_order?: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
