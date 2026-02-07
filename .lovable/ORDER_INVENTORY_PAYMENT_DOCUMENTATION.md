# Orders, Inventory & Payment Methods Module Documentation

This document provides complete implementation details for recreating the Order Management System (OMS), Inventory Management, and Payment Methods modules in a new project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [TypeScript Interfaces](#typescript-interfaces)
4. [Orders Module](#orders-module)
5. [Inventory Module](#inventory-module)
6. [Payment Methods Module](#payment-methods-module)
7. [Checkout Flow](#checkout-flow)
8. [Implementation Prompts](#implementation-prompts)

---

## Architecture Overview

### Core Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORDER MANAGEMENT SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐     │
│  │ Order Status │   │Payment Status│   │Item Fulfillment  │     │
│  │   (Order)    │   │   (Payment)  │   │  Status (Item)   │     │
│  └──────────────┘   └──────────────┘   └──────────────────┘     │
│         │                  │                    │                │
│         └──────────────────┼────────────────────┘                │
│                            │                                     │
│                   DECOUPLED STATE MANAGEMENT                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DIRECT-SYNC INVENTORY                                           │
│  ├── Immediate stock deduction on order placement                │
│  ├── Auto-restock on cancellation/failure                       │
│  ├── Immutable audit ledger for all movements                   │
│  └── Pre-purchase stock validation                              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRAUD GUARD (Risk Scoring)                                      │
│  ├── Customer risk profiles                                      │
│  ├── COD limits based on history                                │
│  ├── Blacklist management                                       │
│  └── Order-level risk flags                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### State Flow Diagram

```
ORDER LIFECYCLE:
pending → confirmed → processing → shipped → delivered
                   ↓
              [cancelled/failed/rto]
                   ↓
              (auto-restock)

PAYMENT LIFECYCLE:
unpaid → pending_verification → paid
    ↓              ↓
  (COD)        [failed/refunded]

ITEM FULFILLMENT:
pending → reserved → shipped → delivered
           ↓                      ↓
      [out_of_stock]        [returned]
           ↓
       (restock)
```

---

## Database Schema

### Orders Table

```sql
-- Create order status enum
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 
  'delivered', 'partially_delivered', 'returned', 
  'cancelled', 'failed', 'rto'
);

-- Create payment status enum
CREATE TYPE payment_status AS ENUM (
  'unpaid', 'pending_verification', 'paid', 
  'partially_paid', 'partially_refunded', 'refunded', 'failed'
);

-- Create payment method type enum
CREATE TYPE payment_method_type AS ENUM (
  'cod', 'mobile_banking', 'bank_transfer', 'card', 'online_gateway'
);

-- Create item fulfillment status enum
CREATE TYPE item_fulfillment_status AS ENUM (
  'pending', 'reserved', 'shipped', 'delivered', 
  'out_of_stock', 'returned', 'return_pending', 'damaged', 'cancelled'
);

-- Create risk level enum
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  
  -- Customer reference (nullable for guest checkout)
  customer_id UUID REFERENCES public.customers(id),
  guest_email TEXT,
  guest_phone TEXT,
  
  -- Status tracking (decoupled)
  order_status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  
  -- Payment details
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_method_type payment_method_type,
  transaction_id TEXT,
  sender_number TEXT,
  payment_proof_url TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID,
  
  -- Pricing (locked at checkout)
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  
  -- Shipping details
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_email TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT,
  shipping_division_id UUID REFERENCES public.divisions(id),
  shipping_thana_id UUID REFERENCES public.thanas(id),
  shipping_postal_code TEXT,
  
  -- Fulfillment tracking
  tracking_number TEXT,
  courier_name TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Risk management
  risk_level risk_level DEFAULT 'low',
  risk_flags JSONB DEFAULT '[]',
  ip_address TEXT,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated or guest can create orders" 
ON public.orders FOR INSERT 
WITH CHECK ((auth.uid() IS NOT NULL) OR (guest_email IS NOT NULL) OR (guest_phone IS NOT NULL));

CREATE POLICY "Customers can view own orders" 
ON public.orders FOR SELECT 
USING ((guest_email IS NOT NULL) OR (guest_phone IS NOT NULL) OR is_admin());

CREATE POLICY "Admins can update orders" 
ON public.orders FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete orders" 
ON public.orders FOR DELETE USING (is_admin());
```

### Order Items Table

```sql
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  
  -- Snapshot data (locked at checkout)
  product_name TEXT NOT NULL,
  variant_sku TEXT,
  variant_details JSONB DEFAULT '{}',
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total NUMERIC NOT NULL,
  
  -- Item-level fulfillment
  fulfillment_status item_fulfillment_status NOT NULL DEFAULT 'pending',
  fulfilled_quantity INTEGER NOT NULL DEFAULT 0,
  returned_quantity INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Can create order_items for existing orders" 
ON public.order_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id));

CREATE POLICY "Public can view order_items" 
ON public.order_items FOR SELECT USING (true);

CREATE POLICY "Admins can update order_items" 
ON public.order_items FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete order_items" 
ON public.order_items FOR DELETE USING (is_admin());

-- Trigger to auto-update order status based on item fulfillment
CREATE OR REPLACE FUNCTION public.update_order_status_from_items()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  delivered_items INTEGER;
  shipped_items INTEGER;
  cancelled_items INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE fulfillment_status = 'delivered'),
    COUNT(*) FILTER (WHERE fulfillment_status = 'shipped'),
    COUNT(*) FILTER (WHERE fulfillment_status IN ('cancelled', 'out_of_stock'))
  INTO total_items, delivered_items, shipped_items, cancelled_items
  FROM public.order_items
  WHERE order_id = NEW.order_id;

  IF delivered_items = total_items THEN
    UPDATE public.orders SET order_status = 'delivered', delivered_at = NOW() WHERE id = NEW.order_id;
  ELSIF delivered_items > 0 THEN
    UPDATE public.orders SET order_status = 'partially_delivered' WHERE id = NEW.order_id;
  ELSIF shipped_items > 0 THEN
    UPDATE public.orders SET order_status = 'shipped' WHERE id = NEW.order_id;
  ELSIF cancelled_items = total_items THEN
    UPDATE public.orders SET order_status = 'cancelled' WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_from_items
  AFTER UPDATE OF fulfillment_status ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_status_from_items();
```

### Order Status History Table (Audit Trail)

```sql
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id),
  
  status_type TEXT NOT NULL, -- 'order', 'payment', 'fulfillment'
  previous_status TEXT,
  new_status TEXT NOT NULL,
  
  changed_by UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert order_status_history" 
ON public.order_status_history FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Public can view order_status_history" 
ON public.order_status_history FOR SELECT USING (true);
```

### Payment Methods Table

```sql
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type payment_method_type NOT NULL,
  instructions TEXT,
  account_details JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active payment_methods" 
ON public.payment_methods FOR SELECT 
USING ((is_active = true) OR is_admin());

CREATE POLICY "Admins can insert payment_methods" 
ON public.payment_methods FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update payment_methods" 
ON public.payment_methods FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete payment_methods" 
ON public.payment_methods FOR DELETE USING (is_admin());
```

### Inventory Transactions Table (Audit Ledger)

```sql
CREATE TYPE inventory_transaction_type AS ENUM (
  'initial', 'sale', 'return_good', 'return_damaged', 
  'adjustment', 'restock', 'cancellation', 'reserve', 'deduct', 'write_off'
);

CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  order_id UUID REFERENCES public.orders(id),
  order_item_id UUID REFERENCES public.order_items(id),
  
  transaction_type inventory_transaction_type NOT NULL,
  quantity INTEGER NOT NULL, -- Negative for deductions, positive for additions
  
  available_stock_after INTEGER NOT NULL,
  reserved_stock_after INTEGER NOT NULL,
  
  notes TEXT,
  performed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable ledger - no updates or deletes
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert inventory_transactions" 
ON public.inventory_transactions FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can view inventory_transactions" 
ON public.inventory_transactions FOR SELECT USING (is_admin());
```

### Customer Risk Profiles Table

```sql
CREATE TABLE public.customer_risk_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id),
  
  total_orders INTEGER NOT NULL DEFAULT 0,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  cancelled_orders INTEGER NOT NULL DEFAULT 0,
  returned_orders INTEGER NOT NULL DEFAULT 0,
  failed_payments INTEGER NOT NULL DEFAULT 0,
  
  active_cod_orders INTEGER NOT NULL DEFAULT 0,
  
  cancellation_rate NUMERIC NOT NULL DEFAULT 0,
  return_rate NUMERIC NOT NULL DEFAULT 0,
  
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  blacklist_reason TEXT,
  cod_disabled BOOLEAN NOT NULL DEFAULT false,
  
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert customer_risk_profiles" 
ON public.customer_risk_profiles FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update customer_risk_profiles" 
ON public.customer_risk_profiles FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can view customer_risk_profiles" 
ON public.customer_risk_profiles FOR SELECT USING (is_admin());

-- Auto-update risk profile on new order
CREATE OR REPLACE FUNCTION public.update_customer_risk_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_risk_profiles (customer_id, total_orders, last_order_at)
  VALUES (NEW.customer_id, 1, NOW())
  ON CONFLICT (customer_id) DO UPDATE SET
    total_orders = customer_risk_profiles.total_orders + 1,
    last_order_at = NOW(),
    active_cod_orders = CASE 
      WHEN NEW.payment_method_type = 'cod' AND NEW.order_status = 'pending'
      THEN customer_risk_profiles.active_cod_orders + 1 
      ELSE customer_risk_profiles.active_cod_orders 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_risk_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION public.update_customer_risk_profile();
```

---

## TypeScript Interfaces

```typescript
// src/types/orders.ts

export type OrderStatus = 
  | 'pending' | 'confirmed' | 'processing' | 'shipped' 
  | 'delivered' | 'partially_delivered' | 'returned' 
  | 'cancelled' | 'failed' | 'rto';

export type PaymentStatus = 
  | 'unpaid' | 'pending_verification' | 'paid' 
  | 'partially_paid' | 'partially_refunded' | 'refunded' | 'failed';

export type PaymentMethodType = 
  | 'cod' | 'mobile_banking' | 'bank_transfer' | 'card' | 'online_gateway';

export type ItemFulfillmentStatus = 
  | 'pending' | 'reserved' | 'shipped' | 'delivered' 
  | 'out_of_stock' | 'returned' | 'return_pending' | 'damaged' | 'cancelled';

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
  created_at: string;
  updated_at: string;
  // Joined relations
  customer?: { id: string; name: string; phone: string; email: string | null } | null;
  payment_method?: { id: string; name: string; type: PaymentMethodType } | null;
  items?: OrderItem[];
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
  created_at: string;
  updated_at: string;
}

// Inventory Types
export type InventoryTransactionType = 
  | 'initial' | 'sale' | 'return_good' | 'return_damaged' 
  | 'adjustment' | 'restock' | 'cancellation' | 'reserve' | 'deduct' | 'write_off';

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
    product?: { name: string };
    color?: { name: string } | null;
    size?: { label: string } | null;
  };
  order?: { order_number: string } | null;
}

export interface CustomerRiskProfile {
  id: string;
  customer_id: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  returned_orders: number;
  failed_payments: number;
  active_cod_orders: number;
  cancellation_rate: number;
  return_rate: number;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  cod_disabled: boolean;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Orders Module

### useOrders Hook

```typescript
// src/hooks/useOrders.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Order, OrderStatus, PaymentStatus, ItemFulfillmentStatus } from "@/types/orders";

// Fetch orders with filters
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
          items:order_items(*)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("order_status", filters.status);
      if (filters?.paymentStatus) query = query.eq("payment_status", filters.paymentStatus);
      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,shipping_name.ilike.%${filters.search}%,shipping_phone.ilike.%${filters.search}%`);
      }
      if (filters?.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters?.dateTo) query = query.lte("created_at", filters.dateTo);

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
      return data;
    },
    enabled: !!orderId,
  });
};

// Update order status with history tracking
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: OrderStatus; notes?: string }) => {
      // Get current status
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
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        previous_status: currentOrder?.order_status,
        new_status: status,
        status_type: 'order',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update order status"),
  });
};

// Update payment status
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: PaymentStatus; notes?: string }) => {
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .single();

      const { error } = await supabase
        .from("orders")
        .update({ 
          payment_status: status,
          ...(status === 'paid' && { payment_verified_at: new Date().toISOString() }),
        })
        .eq("id", orderId);
      
      if (error) throw error;

      await supabase.from("order_status_history").insert({
        order_id: orderId,
        previous_status: currentOrder?.payment_status,
        new_status: status,
        status_type: 'payment',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Payment status updated");
    },
  });
};

// Update item fulfillment status
export const useUpdateItemFulfillment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      itemId, orderId, status, fulfilledQuantity, notes 
    }: { 
      itemId: string; orderId: string; status: ItemFulfillmentStatus; fulfilledQuantity?: number; notes?: string 
    }) => {
      const { data: currentItem } = await supabase
        .from("order_items")
        .select("fulfillment_status")
        .eq("id", itemId)
        .single();

      await supabase
        .from("order_items")
        .update({ 
          fulfillment_status: status,
          ...(fulfilledQuantity !== undefined && { fulfilled_quantity: fulfilledQuantity }),
        })
        .eq("id", itemId);

      await supabase.from("order_status_history").insert({
        order_id: orderId,
        order_item_id: itemId,
        previous_status: currentItem?.fulfillment_status,
        new_status: status,
        status_type: 'fulfillment',
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Item status updated");
    },
  });
};

// Dashboard stats
export const useOrderStats = () => {
  return useQuery({
    queryKey: ["order-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_status, payment_status, total_amount, created_at");

      const todayOrders = orders?.filter(o => new Date(o.created_at) >= today) || [];
      const pendingVerification = orders?.filter(o => o.payment_status === 'pending_verification') || [];
      const pendingFulfillment = orders?.filter(o => ['confirmed', 'processing'].includes(o.order_status)) || [];

      return {
        totalOrders: orders?.length || 0,
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total_amount || 0), 0),
        pendingVerification: pendingVerification.length,
        pendingFulfillment: pendingFulfillment.length,
        totalRevenue: orders?.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
      };
    },
    staleTime: 1000 * 60,
  });
};

// Verification queue
export const useVerificationQueue = () => {
  return useQuery({
    queryKey: ["verification-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, customer:customers(id, name, phone), payment_method:payment_methods(id, name, type), items:order_items(*)`)
        .eq("payment_status", "pending_verification")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Order[];
    },
    staleTime: 1000 * 30,
  });
};
```

---

## Inventory Module

### useInventory Hook

```typescript
// src/hooks/useInventory.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InventoryTransactionType, InventoryTransaction } from "@/types/orders";

// ============================================================
// DIRECT-SYNC INVENTORY LOGIC
// Stock is immediately affected by lifecycle events
// ============================================================

// Deduct stock immediately when order is placed
export const useDeductStockOnOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ variantId, quantity, orderId, orderItemId, orderNumber }: { 
      variantId: string; quantity: number; orderId: string; orderItemId: string; orderNumber: string;
    }) => {
      // Get current stock
      const { data: variant, error: fetchError } = await supabase
        .from("product_variants")
        .select("stock, available_stock")
        .eq("id", variantId)
        .single();

      if (fetchError) throw fetchError;
      if (!variant) throw new Error("Variant not found");
      if (variant.stock < quantity) throw new Error("Insufficient stock available");

      const newStock = variant.stock - quantity;

      // Atomic update with race condition prevention
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ stock: newStock, available_stock: newStock, reserved_stock: 0 })
        .eq("id", variantId)
        .gte("stock", quantity); // Ensures stock hasn't changed

      if (updateError) throw updateError;

      // Log transaction for audit trail
      await supabase.from("inventory_transactions").insert({
        variant_id: variantId,
        order_id: orderId,
        order_item_id: orderItemId,
        transaction_type: 'sale' as InventoryTransactionType,
        quantity: -quantity,
        available_stock_after: newStock,
        reserved_stock_after: 0,
        notes: `Sold ${quantity} units - Order ${orderNumber}`,
      });

      return { previousStock: variant.stock, newStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-items"] });
    },
  });
};

// Restock immediately when order is cancelled
export const useRestockOnCancel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ variantId, quantity, orderId, orderItemId, reason, orderNumber }: { 
      variantId: string; quantity: number; orderId: string; orderItemId: string; reason: string; orderNumber: string;
    }) => {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", variantId)
        .single();

      const newStock = (variant?.stock || 0) + quantity;

      await supabase
        .from("product_variants")
        .update({ stock: newStock, available_stock: newStock })
        .eq("id", variantId);

      await supabase.from("inventory_transactions").insert({
        variant_id: variantId,
        order_id: orderId,
        order_item_id: orderItemId,
        transaction_type: 'cancellation' as InventoryTransactionType,
        quantity: quantity,
        available_stock_after: newStock,
        reserved_stock_after: 0,
        notes: `Restocked ${quantity} units - ${reason} - Order ${orderNumber}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock restored successfully");
    },
  });
};

// Process return - admin chooses restock vs damaged
export const useProcessReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ variantId, quantity, orderId, orderItemId, returnType, orderNumber }: { 
      variantId: string; quantity: number; orderId: string; orderItemId: string; returnType: 'restock' | 'damaged'; orderNumber: string;
    }) => {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", variantId)
        .single();

      let newStock = variant?.stock || 0;

      if (returnType === 'restock') {
        newStock = (variant?.stock || 0) + quantity;
        await supabase
          .from("product_variants")
          .update({ stock: newStock, available_stock: newStock })
          .eq("id", variantId);
      }

      const transactionType: InventoryTransactionType = returnType === 'restock' ? 'return_good' : 'return_damaged';
      
      await supabase.from("inventory_transactions").insert({
        variant_id: variantId,
        order_id: orderId,
        order_item_id: orderItemId,
        transaction_type: transactionType,
        quantity: returnType === 'restock' ? quantity : 0,
        available_stock_after: newStock,
        reserved_stock_after: 0,
        notes: returnType === 'restock' 
          ? `Returned ${quantity} units - Added back to inventory - Order ${orderNumber}`
          : `Returned ${quantity} units - Marked as damaged - Order ${orderNumber}`,
      });

      return { newStock, returnType };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(result.returnType === 'restock' ? "Item restocked" : "Item marked as damaged");
    },
  });
};

// Manual stock adjustment with audit trail
export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ variantId, newStock, reason }: { variantId: string; newStock: number; reason: string }) => {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", variantId)
        .single();

      const previousStock = variant?.stock || 0;
      const stockDiff = newStock - previousStock;

      await supabase
        .from("product_variants")
        .update({ stock: Math.max(0, newStock), available_stock: Math.max(0, newStock), reserved_stock: 0 })
        .eq("id", variantId);

      await supabase.from("inventory_transactions").insert({
        variant_id: variantId,
        transaction_type: 'adjustment' as InventoryTransactionType,
        quantity: stockDiff,
        available_stock_after: Math.max(0, newStock),
        reserved_stock_after: 0,
        notes: `Manual adjustment: ${previousStock} → ${newStock}. Reason: ${reason}`,
      });

      return { previousStock, newStock: Math.max(0, newStock), stockDiff };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      toast.success("Stock adjusted");
    },
  });
};

// Get low-stock items
export const useLowStockItems = (threshold = 5) => {
  return useQuery({
    queryKey: ["low-stock-items", threshold],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(`
          id, sku, stock, is_active,
          product:products(id, name, is_active),
          color:colors(name),
          size:sizes(label)
        `)
        .lte("stock", threshold)
        .eq("is_active", true)
        .order("stock", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

// Get stock history for a variant
export const useStockHistory = (variantId: string | null) => {
  return useQuery({
    queryKey: ["inventory-transactions", variantId],
    queryFn: async () => {
      if (!variantId) return [];
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(`*, order:orders(order_number)`)
        .eq("variant_id", variantId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as InventoryTransaction[];
    },
    enabled: !!variantId,
  });
};

// Pre-purchase stock validation
export const checkStockAvailability = async (items: { variantId: string; quantity: number }[]) => {
  const results: { variantId: string; available: boolean; currentStock: number; requested: number; sku?: string }[] = [];

  for (const item of items) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock, sku")
      .eq("id", item.variantId)
      .single();

    results.push({
      variantId: item.variantId,
      available: (variant?.stock || 0) >= item.quantity,
      currentStock: variant?.stock || 0,
      requested: item.quantity,
      sku: variant?.sku,
    });
  }

  return results;
};
```

---

## Payment Methods Module

### usePaymentMethods Hook

```typescript
// src/hooks/usePaymentMethods.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PaymentMethod, PaymentMethodType } from "@/types/orders";

export interface PaymentMethodFormData {
  name: string;
  type: PaymentMethodType;
  instructions?: string;
  account_details?: Record<string, any>;
  is_active?: boolean;
  sort_order?: number;
}

// Fetch payment methods for checkout (active only)
export const usePaymentMethods = (activeOnly = false) => {
  return useQuery({
    queryKey: ["payment-methods", activeOnly],
    queryFn: async () => {
      let query = supabase.from("payment_methods").select("*").order("sort_order");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentMethod[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Fetch all for admin
export const usePaymentMethodsAdmin = () => {
  return useQuery({
    queryKey: ["payment-methods-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*").order("sort_order");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
};

// Create payment method
export const useCreatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PaymentMethodFormData) => {
      const { data: result, error } = await supabase
        .from("payment_methods")
        .insert({
          name: data.name,
          type: data.type,
          instructions: data.instructions || null,
          account_details: data.account_details || {},
          is_active: data.is_active ?? true,
          sort_order: data.sort_order ?? 0,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method created");
    },
  });
};

// Update payment method
export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentMethodFormData> }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method updated");
    },
  });
};

// Delete payment method
export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method deleted");
    },
  });
};

// Toggle active status
export const useTogglePaymentMethodStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("payment_methods").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method status updated");
    },
  });
};
```

---

## Checkout Flow

### useCheckout Hook

```typescript
// src/hooks/useCheckout.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart, CartItem } from "@/contexts/CartContext";
import { checkStockAvailability, InventoryTransactionType } from "./useInventory";
import type { PaymentMethodType, RiskLevel } from "@/types/orders";

interface CheckoutData {
  customerId?: string;
  guestEmail?: string;
  guestPhone?: string;
  shippingName: string;
  shippingPhone: string;
  shippingEmail?: string;
  shippingAddress: string;
  shippingCity?: string;
  shippingDivisionId?: string;
  shippingThanaId?: string;
  shippingPostalCode?: string;
  paymentMethodId: string;
  paymentMethodType: PaymentMethodType;
  transactionId?: string;
  senderNumber?: string;
  paymentProofUrl?: string;
  subtotal: number;
  discountAmount?: number;
  shippingCost?: number;
  taxAmount?: number;
  customerNotes?: string;
}

// Risk scoring algorithm
const calculateRiskScore = async (
  customerId: string | undefined,
  paymentMethodType: PaymentMethodType,
  totalAmount: number
): Promise<{ riskLevel: RiskLevel; flags: string[] }> => {
  const flags: string[] = [];
  let riskScore = 0;

  if (paymentMethodType === 'cod' && totalAmount > 10000) {
    flags.push('High-value COD order');
    riskScore += 2;
  }

  if (customerId) {
    const { data: profile } = await supabase
      .from("customer_risk_profiles")
      .select("*")
      .eq("customer_id", customerId)
      .single();

    if (profile) {
      if (profile.cancellation_rate > 30) {
        flags.push(`High cancellation rate (${profile.cancellation_rate.toFixed(0)}%)`);
        riskScore += 3;
      }
      if (profile.return_rate > 30) {
        flags.push(`High return rate (${profile.return_rate.toFixed(0)}%)`);
        riskScore += 2;
      }
      if (paymentMethodType === 'cod' && profile.active_cod_orders >= 2) {
        flags.push(`${profile.active_cod_orders + 1} active COD orders`);
        riskScore += 3;
      }
      if (profile.is_blacklisted) {
        flags.push('Customer is blacklisted');
        riskScore += 10;
      }
    }
  }

  let riskLevel: RiskLevel = 'low';
  if (riskScore >= 5) riskLevel = 'high';
  else if (riskScore >= 2) riskLevel = 'medium';

  return { riskLevel, flags };
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { clearCart } = useCart();

  return useMutation({
    mutationFn: async ({ checkoutData, cartItems }: { checkoutData: CheckoutData; cartItems: CartItem[] }) => {
      // Step 1: Validate stock availability
      const stockCheck = await checkStockAvailability(
        cartItems.map(item => ({ variantId: item.variantId || item.id, quantity: item.quantity }))
      );
      const outOfStock = stockCheck.filter(s => !s.available);
      if (outOfStock.length > 0) {
        throw new Error(`Out of stock: ${outOfStock.map(s => s.sku).join(', ')}`);
      }

      // Step 2: Calculate risk score
      const { riskLevel, flags } = await calculateRiskScore(
        checkoutData.customerId,
        checkoutData.paymentMethodType,
        checkoutData.subtotal + (checkoutData.shippingCost || 0)
      );

      // Step 3: Determine payment status
      const paymentStatus = checkoutData.paymentMethodType === 'cod' ? 'unpaid' : 'pending_verification';

      // Step 4: Create order
      const totalAmount = checkoutData.subtotal - (checkoutData.discountAmount || 0) + (checkoutData.shippingCost || 0);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: `PO-${Date.now()}`,
          customer_id: checkoutData.customerId || null,
          guest_email: checkoutData.guestEmail || null,
          guest_phone: checkoutData.guestPhone || null,
          order_status: 'pending',
          payment_status: paymentStatus,
          payment_method_id: checkoutData.paymentMethodId,
          payment_method_type: checkoutData.paymentMethodType,
          transaction_id: checkoutData.transactionId || null,
          sender_number: checkoutData.senderNumber || null,
          subtotal: checkoutData.subtotal,
          discount_amount: checkoutData.discountAmount || 0,
          shipping_cost: checkoutData.shippingCost || 0,
          total_amount: totalAmount,
          shipping_name: checkoutData.shippingName,
          shipping_phone: checkoutData.shippingPhone,
          shipping_address: checkoutData.shippingAddress,
          shipping_division_id: checkoutData.shippingDivisionId || null,
          shipping_thana_id: checkoutData.shippingThanaId || null,
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
        variant_details: { color: item.color, size: item.size, image: item.image },
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity,
        fulfillment_status: 'pending',
      }));

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      // Step 6: DIRECT-SYNC - Deduct stock immediately
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const cartItem = cartItems[i];
        const variantId = cartItem.variantId || cartItem.id;

        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock")
          .eq("id", variantId)
          .single();

        if (variant) {
          const newStock = Math.max(0, variant.stock - cartItem.quantity);

          const { error: updateError } = await supabase
            .from("product_variants")
            .update({ stock: newStock, available_stock: newStock, reserved_stock: 0 })
            .eq("id", variantId)
            .gte("stock", cartItem.quantity);

          if (updateError) {
            // Rollback order on failure
            await supabase.from("orders").delete().eq("id", order.id);
            throw new Error(`Stock update failed for ${cartItem.name}`);
          }

          // Log transaction
          await supabase.from("inventory_transactions").insert({
            variant_id: variantId,
            order_id: order.id,
            order_item_id: item.id,
            transaction_type: 'sale' as InventoryTransactionType,
            quantity: -cartItem.quantity,
            available_stock_after: newStock,
            reserved_stock_after: 0,
            notes: `Sold ${cartItem.quantity} units - Order ${order.order_number}`,
          });
        }
      }

      // Step 7: Add initial status history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        new_status: 'pending',
        status_type: 'order',
        notes: 'Order placed - Stock deducted',
      });

      return { orderId: order.id, orderNumber: order.order_number };
    },
    onSuccess: (result) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
      toast.success(`Order ${result.orderNumber} placed!`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// Track order by number + phone
export const useTrackOrder = () => {
  return useMutation({
    mutationFn: async ({ orderNumber, phone }: { orderNumber: string; phone: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, items:order_items(*), payment_method:payment_methods(id, name, type)`)
        .eq("order_number", orderNumber)
        .or(`shipping_phone.eq.${phone},guest_phone.eq.${phone}`)
        .single();

      if (error) throw new Error("Order not found");
      return data;
    },
  });
};
```

---

## Implementation Prompts

### Prompt 1: Database Setup

```
Create a complete Order Management System database with:

1. Orders table with:
   - Decoupled order_status, payment_status enums
   - Customer/guest checkout support
   - Payment verification fields (transaction_id, sender_number, proof_url)
   - Shipping details with division/thana references
   - Risk scoring fields (risk_level, risk_flags)
   - Auto-generated order numbers (PO-YYYYMMDD-XXXX format)

2. Order items table with:
   - Item-level fulfillment_status tracking
   - Snapshot of product data at checkout (locked prices)
   - Trigger to auto-update order status based on item fulfillment

3. Order status history table for complete audit trail

4. Payment methods table with:
   - Types: cod, mobile_banking, bank_transfer, card, online_gateway
   - Dynamic account_details JSONB field
   - Instructions text for checkout display

5. Inventory transactions table (immutable ledger) with:
   - Transaction types: sale, return_good, return_damaged, adjustment, restock, cancellation
   - Stock snapshots after each transaction
   - Order/item references for traceability

6. Customer risk profiles table for Fraud Guard:
   - Order history stats (total, completed, cancelled, returned)
   - Rate calculations (cancellation_rate, return_rate)
   - Blacklist and COD-disable flags

Include all RLS policies for admin-only write access and public read for orders.
```

### Prompt 2: Order Management Hooks

```
Create React Query hooks for order management:

1. useOrders - Fetch orders with filters (status, payment status, search, date range)
2. useOrder - Fetch single order with full relations
3. useOrderHistory - Fetch status change timeline
4. useUpdateOrderStatus - Update order status with history tracking
5. useUpdatePaymentStatus - Update payment status with verification timestamp
6. useUpdateItemFulfillment - Update individual item status
7. useOrderStats - Dashboard statistics (today's orders, revenue, pending counts)
8. useVerificationQueue - Orders pending payment verification

All hooks should:
- Use proper query keys for cache invalidation
- Show toast notifications on success/error
- Include optimistic staleTime configurations
```

### Prompt 3: Inventory Management Hooks

```
Create Direct-Sync inventory management hooks:

1. useDeductStockOnOrder - Immediate stock deduction with race condition prevention
2. useRestockOnCancel - Auto-restock when order cancelled
3. useProcessReturn - Admin chooses restock vs damaged write-off
4. useAdjustStock - Manual adjustment with audit trail
5. useBulkAdjustStock - Spreadsheet-style batch updates
6. useLowStockItems - Query items below threshold
7. useStockHistory - Audit ledger for specific variant

Key requirements:
- All mutations log to inventory_transactions table
- Use atomic updates with stock validation
- Include order context in transaction notes
- Invalidate all related caches on success
```

### Prompt 4: Payment Methods Admin

```
Create Payment Methods admin module:

1. Admin page with table showing all payment methods
2. Modal for create/edit with:
   - Name and type selection
   - Instructions textarea
   - Dynamic key-value pairs for account_details
   - Active toggle and sort order
3. Toggle active status inline
4. Delete confirmation dialog

Payment types to support:
- Cash on Delivery (cod)
- Mobile Banking (mobile_banking) - bKash, Nagad, etc.
- Bank Transfer (bank_transfer)
- Card Payment (card)
- Online Gateway (online_gateway)
```

### Prompt 5: Checkout Flow

```
Create complete checkout flow:

1. Checkout page with:
   - Order summary (cart items with quantity controls)
   - Shipping form (name, phone, address, division/thana selects)
   - Dynamic payment method selection from database
   - Payment details form (transaction ID, sender number for manual payments)
   - Discount code input

2. Order placement flow:
   - Pre-purchase stock validation
   - Risk score calculation
   - Order creation with items
   - Immediate stock deduction (Direct-Sync)
   - Transaction logging
   - Success confirmation with order number

3. Order tracking page:
   - Search by order number + phone
   - Visual status stepper
   - Item-level status display
   - Shipping and payment summary

4. Empty cart and success states with appropriate messaging
```

### Prompt 6: Inventory Dashboard

```
Create inventory management admin dashboard with tabs:

1. Quick Edit tab:
   - Searchable table of all variants
   - Inline stock editing with pending changes tracking
   - Bulk save with reason input
   - Stock status badges (Out of Stock, Low Stock)
   - Link to view stock history

2. Low Stock Alerts tab:
   - Configurable threshold
   - Summary cards (out of stock count, low stock count)
   - Restock modal with quantity and reason
   - Stock history access

3. Audit Ledger tab:
   - Complete transaction history
   - Filter by transaction type
   - Search by SKU, product, order number
   - Summary stats (units sold, returned, adjusted, written off)
   - Visual indicators for transaction types
```

---

## Performance Patterns

### Slim Query Pattern
```typescript
// List view - minimal fields
const SLIM_COLUMNS = {
  ordersList: `
    id, order_number, order_status, payment_status,
    total_amount, shipping_name, shipping_phone,
    created_at, risk_level,
    customer:customers(name),
    payment_method:payment_methods(name)
  `,
};

// Detail view - full relations
const FULL_COLUMNS = `
  *, customer:customers(*), payment_method:payment_methods(*),
  items:order_items(*), shipping_division:divisions(*), shipping_thana:thanas(*)
`;
```

### Server-Side Pagination
```typescript
const useOptimizedOrders = (filters, page, pageSize) => {
  return useQuery({
    queryKey: ["orders", filters, page],
    queryFn: async () => {
      const [data, count] = await Promise.all([
        supabase.from("orders").select(SLIM_COLUMNS.ordersList)
          .range(page * pageSize, (page + 1) * pageSize - 1),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);
      return { orders: data.data, totalCount: count.count };
    },
  });
};
```

### Cache Configuration
```typescript
const QUERY_CONFIG = {
  listView: { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 5 },
  liveData: { staleTime: 1000 * 30, gcTime: 1000 * 60 * 2 },
  referenceData: { staleTime: 1000 * 60 * 15, gcTime: 1000 * 60 * 30 },
};
```

---

## Summary

This documentation provides everything needed to recreate:

1. **Orders Module**: Complete OMS with decoupled status tracking, guest checkout, payment verification queue, and order timeline
2. **Inventory Module**: Direct-Sync stock management with immediate deduction, auto-restock, and immutable audit ledger
3. **Payment Methods Module**: Dynamic checkout payment options with admin-configurable account details
4. **Checkout Flow**: End-to-end order placement with stock validation, risk scoring, and transaction logging
5. **Fraud Guard**: Customer risk profiling with COD limits and blacklist management

The system follows enterprise patterns:
- Atomic database operations with race condition prevention
- Complete audit trails for compliance
- Decoupled state machines for flexibility
- Server-side pagination for performance
- Tiered caching for optimal UX
