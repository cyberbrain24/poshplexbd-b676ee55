# Customer Module Documentation

> Complete reference for recreating the Customer CRM system in a new project.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [TypeScript Interfaces](#3-typescript-interfaces)
4. [React Query Hooks](#4-react-query-hooks)
5. [Admin UI Components](#5-admin-ui-components)
6. [Validation Schemas](#6-validation-schemas)
7. [Implementation Prompts](#7-implementation-prompts)

---

## 1. Architecture Overview

### Core Concepts

The Customer Module follows a **CRM-Hierarchy Pattern** with these key features:

1. **Hierarchical Location Data**: Divisions → Thanas (parent-child relationship for geographic segmentation)
2. **Customer Segmentation**: Customer Types for membership/tier classification
3. **Promo Tracking**: Individual promo usage history per customer for marketing analytics
4. **Birthdate Marketing**: Birthdate field enables automated birthday campaigns
5. **Multi-Filter Search**: Compound filtering across name, phone, email, location, gender, and promo usage

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOMER MODULE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────┐    ┌───────────┐    ┌────────────────┐          │
│  │ Divisions │───▶│  Thanas   │    │ Customer Types │          │
│  │ (Regions) │    │ (SubDist) │    │ (Membership)   │          │
│  └─────┬─────┘    └─────┬─────┘    └───────┬────────┘          │
│        │                │                   │                   │
│        └────────────────┼───────────────────┘                   │
│                         ▼                                       │
│              ┌─────────────────────┐                            │
│              │     CUSTOMERS       │                            │
│              │  ─────────────────  │                            │
│              │ • name, phone, email│                            │
│              │ • gender, birthdate │                            │
│              │ • address           │                            │
│              │ • division_id       │                            │
│              │ • thana_id          │                            │
│              │ • customer_type_id  │                            │
│              └──────────┬──────────┘                            │
│                         │                                       │
│                         ▼                                       │
│              ┌─────────────────────┐                            │
│              │   PROMO USAGES      │                            │
│              │  ─────────────────  │                            │
│              │ • promo_code        │                            │
│              │ • benefit_type      │                            │
│              │ • benefit_amount    │                            │
│              │ • used_at           │                            │
│              └─────────────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Query Key Strategy

```typescript
// Reference data (long cache)
["divisions"]           // All divisions
["thanas", divisionId?] // Thanas, optionally filtered by division
["customerTypes"]       // All customer types

// Transactional data (reactive)
["customers", filters?] // Customer list with optional filters
["promoUsages", customerId] // Promo history for specific customer
```

---

## 2. Database Schema

### Core Tables

```sql
-- ============================================================
-- DIVISIONS TABLE (Parent in location hierarchy)
-- ============================================================
CREATE TABLE public.divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Divisions
CREATE POLICY "Admins can view divisions" ON public.divisions
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert divisions" ON public.divisions
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update divisions" ON public.divisions
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete divisions" ON public.divisions
  FOR DELETE USING (is_admin());

-- ============================================================
-- THANAS TABLE (Child in location hierarchy)
-- ============================================================
CREATE TABLE public.thanas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for foreign key lookups
CREATE INDEX idx_thanas_division_id ON public.thanas(division_id);

-- Enable RLS
ALTER TABLE public.thanas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Thanas
CREATE POLICY "Admins can view thanas" ON public.thanas
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert thanas" ON public.thanas
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update thanas" ON public.thanas
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete thanas" ON public.thanas
  FOR DELETE USING (is_admin());

-- ============================================================
-- CUSTOMER TYPES TABLE (Membership/Tier system)
-- ============================================================
CREATE TABLE public.customer_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Customer Types
CREATE POLICY "Admins can view customer_types" ON public.customer_types
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert customer_types" ON public.customer_types
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update customer_types" ON public.customer_types
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete customer_types" ON public.customer_types
  FOR DELETE USING (is_admin());

-- ============================================================
-- CUSTOMERS TABLE (Core CRM entity)
-- ============================================================
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  birthdate DATE,
  address TEXT,
  division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
  thana_id UUID REFERENCES public.thanas(id) ON DELETE SET NULL,
  customer_type_id UUID REFERENCES public.customer_types(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for search and filtering
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_division_id ON public.customers(division_id);
CREATE INDEX idx_customers_thana_id ON public.customers(thana_id);
CREATE INDEX idx_customers_customer_type_id ON public.customers(customer_type_id);
CREATE INDEX idx_customers_gender ON public.customers(gender);
CREATE INDEX idx_customers_birthdate ON public.customers(birthdate);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Customers
CREATE POLICY "Admins can view customers" ON public.customers
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert customers" ON public.customers
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update customers" ON public.customers
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete customers" ON public.customers
  FOR DELETE USING (is_admin());

-- ============================================================
-- PROMO USAGES TABLE (Marketing tracking)
-- ============================================================
CREATE TABLE public.promo_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  promo_code TEXT NOT NULL,
  benefit_type TEXT,
  benefit_amount NUMERIC,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for customer lookups
CREATE INDEX idx_promo_usages_customer_id ON public.promo_usages(customer_id);
CREATE INDEX idx_promo_usages_used_at ON public.promo_usages(used_at);

-- Enable RLS
ALTER TABLE public.promo_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Promo Usages
CREATE POLICY "Admins can view promo_usages" ON public.promo_usages
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert promo_usages" ON public.promo_usages
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update promo_usages" ON public.promo_usages
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete promo_usages" ON public.promo_usages
  FOR DELETE USING (is_admin());

-- ============================================================
-- UPDATED_AT TRIGGER (Auto-update timestamps)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_divisions_updated_at
  BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_thanas_updated_at
  BEFORE UPDATE ON public.thanas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_types_updated_at
  BEFORE UPDATE ON public.customer_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 3. TypeScript Interfaces

```typescript
// ============================================================
// LOCATION INTERFACES
// ============================================================
export interface Division {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Thana {
  id: string;
  name: string;
  division_id: string;
  division?: Division;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CUSTOMER TYPE INTERFACE
// ============================================================
export interface CustomerType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PROMO USAGE INTERFACE
// ============================================================
export interface PromoUsage {
  id: string;
  customer_id: string;
  promo_code: string;
  benefit_type: string | null;
  benefit_amount: number | null;
  used_at: string;
  notes: string | null;
  created_at: string;
}

// ============================================================
// CUSTOMER INTERFACE (Core entity)
// ============================================================
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: 'male' | 'female' | 'other';
  birthdate: string | null;
  address: string | null;
  division_id: string | null;
  thana_id: string | null;
  customer_type_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  division?: Division;
  thana?: Thana;
  customer_type?: CustomerType;
  promo_usages?: PromoUsage[];
  promo_usage_count?: number; // Computed field
}

// ============================================================
// FILTER INTERFACE
// ============================================================
export interface CustomerFilters {
  search?: string;           // Searches name, phone, email, address
  gender?: string;
  customer_type_id?: string;
  division_id?: string;
  thana_id?: string;
  min_promo_usage?: number;
  max_promo_usage?: number;
}
```

---

## 4. React Query Hooks

### Complete Hook Implementation

```typescript
// src/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// DIVISIONS HOOKS
// ============================================================
export const useDivisions = () => {
  return useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("divisions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Division[];
    },
  });
};

export const useCreateDivision = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (division: Omit<Division, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("divisions")
        .insert(division)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      toast({ title: "Division created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create division", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateDivision = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...division }: Partial<Division> & { id: string }) => {
      const { data, error } = await supabase
        .from("divisions")
        .update(division)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Division updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update division", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteDivision = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("divisions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["thanas"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Division deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete division", description: error.message, variant: "destructive" });
    },
  });
};

// ============================================================
// THANAS HOOKS
// ============================================================
export const useThanas = (divisionId?: string) => {
  return useQuery({
    queryKey: ["thanas", divisionId],
    queryFn: async () => {
      let query = supabase
        .from("thanas")
        .select("*, division:divisions(*)")
        .order("name");
      
      if (divisionId) {
        query = query.eq("division_id", divisionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Thana[];
    },
  });
};

export const useCreateThana = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (thana: Omit<Thana, "id" | "created_at" | "updated_at" | "division">) => {
      const { data, error } = await supabase
        .from("thanas")
        .insert(thana)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thanas"] });
      toast({ title: "Thana created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create thana", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateThana = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...thana }: Partial<Thana> & { id: string }) => {
      const { division, ...thanaData } = thana;
      const { data, error } = await supabase
        .from("thanas")
        .update(thanaData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thanas"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Thana updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update thana", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteThana = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("thanas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thanas"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Thana deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete thana", description: error.message, variant: "destructive" });
    },
  });
};

// ============================================================
// CUSTOMER TYPES HOOKS
// ============================================================
export const useCustomerTypes = () => {
  return useQuery({
    queryKey: ["customerTypes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as CustomerType[];
    },
  });
};

export const useCreateCustomerType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerType: Omit<CustomerType, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("customer_types")
        .insert(customerType)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerTypes"] });
      toast({ title: "Customer type created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create customer type", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateCustomerType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...customerType }: Partial<CustomerType> & { id: string }) => {
      const { data, error } = await supabase
        .from("customer_types")
        .update(customerType)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerTypes"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer type updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update customer type", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteCustomerType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customerTypes"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer type deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete customer type", description: error.message, variant: "destructive" });
    },
  });
};

// ============================================================
// CUSTOMERS HOOKS (Core CRUD with compound filtering)
// ============================================================
export const useCustomers = (filters?: CustomerFilters) => {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: async () => {
      let query = supabase
        .from("customers")
        .select(`
          *,
          division:divisions(*),
          thana:thanas(*),
          customer_type:customer_types(*)
        `)
        .order("created_at", { ascending: false });

      // Apply server-side filters
      if (filters?.gender) {
        query = query.eq("gender", filters.gender);
      }
      if (filters?.customer_type_id) {
        query = query.eq("customer_type_id", filters.customer_type_id);
      }
      if (filters?.division_id) {
        query = query.eq("division_id", filters.division_id);
      }
      if (filters?.thana_id) {
        query = query.eq("thana_id", filters.thana_id);
      }
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch promo usage counts (secondary query)
      const customerIds = data.map(c => c.id);
      const { data: promoData, error: promoError } = await supabase
        .from("promo_usages")
        .select("customer_id")
        .in("customer_id", customerIds);

      if (promoError) throw promoError;

      // Count promo usages per customer
      const promoCountMap: Record<string, number> = {};
      promoData.forEach(p => {
        promoCountMap[p.customer_id] = (promoCountMap[p.customer_id] || 0) + 1;
      });

      // Merge promo counts into customer data
      const customersWithPromo = data.map(customer => ({
        ...customer,
        promo_usage_count: promoCountMap[customer.id] || 0,
      }));

      // Apply client-side promo usage filters
      let filteredCustomers = customersWithPromo;
      if (filters?.min_promo_usage !== undefined) {
        filteredCustomers = filteredCustomers.filter(c => c.promo_usage_count >= filters.min_promo_usage!);
      }
      if (filters?.max_promo_usage !== undefined) {
        filteredCustomers = filteredCustomers.filter(c => c.promo_usage_count <= filters.max_promo_usage!);
      }

      return filteredCustomers as Customer[];
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "created_at" | "updated_at" | "division" | "thana" | "customer_type" | "promo_usages" | "promo_usage_count">) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create customer", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      // Strip relation fields before update
      const { division, thana, customer_type, promo_usages, promo_usage_count, ...customerData } = customer;
      const { data, error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update customer", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete customer", description: error.message, variant: "destructive" });
    },
  });
};

// ============================================================
// PROMO USAGES HOOKS
// ============================================================
export const usePromoUsages = (customerId?: string) => {
  return useQuery({
    queryKey: ["promoUsages", customerId],
    queryFn: async () => {
      let query = supabase
        .from("promo_usages")
        .select("*")
        .order("used_at", { ascending: false });

      if (customerId) {
        query = query.eq("customer_id", customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PromoUsage[];
    },
    enabled: !!customerId, // Only run when customerId is provided
  });
};

export const useCreatePromoUsage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promoUsage: Omit<PromoUsage, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("promo_usages")
        .insert(promoUsage)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoUsages"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] }); // Refresh promo counts
      toast({ title: "Promo usage recorded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to record promo usage", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdatePromoUsage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...promoUsage }: Partial<PromoUsage> & { id: string }) => {
      const { data, error } = await supabase
        .from("promo_usages")
        .update(promoUsage)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoUsages"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Promo usage updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update promo usage", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeletePromoUsage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_usages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoUsages"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Promo usage deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete promo usage", description: error.message, variant: "destructive" });
    },
  });
};
```

### Public Location Data Hook (for Checkout/Forms)

```typescript
// src/hooks/useLocationData.ts
// Lightweight hook for public-facing forms (checkout, registration)

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Division {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Thana {
  id: string;
  name: string;
  division_id: string;
  is_active: boolean;
}

export const useDivisions = () => {
  return useQuery({
    queryKey: ["divisions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("divisions")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Division[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (location data rarely changes)
  });
};

export const useThanas = (divisionId?: string) => {
  return useQuery({
    queryKey: ["thanas-public", divisionId],
    queryFn: async () => {
      let query = supabase
        .from("thanas")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (divisionId) {
        query = query.eq("division_id", divisionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Thana[];
    },
    enabled: !!divisionId,
    staleTime: 1000 * 60 * 10,
  });
};
```

---

## 5. Admin UI Components

### Customer Modal (Create/Edit Form)

Key features:
- **Cascading Location Selects**: Division selection triggers Thana reload
- **Birthdate Calendar Picker**: Uses react-day-picker with date constraints
- **Inline Management Links**: Quick links to manage Divisions/Thanas from the form
- **Zod Validation**: Client-side validation before submission

```typescript
// Form Schema Pattern
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  division_id: z.string().optional(),
  thana_id: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  customer_type_id: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean(),
  birthdate: z.date().optional(),
});

// Cascading Division → Thana pattern
const [selectedDivisionId, setSelectedDivisionId] = useState<string | undefined>();
const { data: thanas } = useThanas(selectedDivisionId);

const handleDivisionChange = (divisionId: string) => {
  setSelectedDivisionId(divisionId || undefined);
  form.setValue("division_id", divisionId);
  form.setValue("thana_id", ""); // Reset thana when division changes
};
```

### Customer List Page Features

1. **Stats Dashboard**: Total customers, male/female breakdown, promo usage count
2. **Multi-Filter Bar**: Gender, Customer Type, Division, Promo Usage threshold
3. **Global Search**: Searches across name, phone, email, address simultaneously
4. **Inline Promo History**: Click promo count to open history modal

### Promo Usage History Modal

- **Nested CRUD**: Add/Edit/Delete promo usages directly from customer context
- **Datetime Tracking**: Records exact usage timestamp
- **Benefit Tracking**: Optional benefit type and amount fields

---

## 6. Validation Schemas

```typescript
// src/utils/validation-schemas.ts

import { z } from "zod";

const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/; // Bangladesh phone format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const phoneSchema = z.string().regex(phoneRegex, "Invalid phone number format");
const uuidSchema = z.string().regex(uuidRegex, "Invalid ID format");
const emailSchema = z.string().email("Invalid email address").max(255);

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

export type CustomerInput = z.infer<typeof customerSchema>;
```

---

## 7. Implementation Prompts

Use these prompts to recreate the Customer Module in a new project:

### Prompt 1: Database Setup

```
Create a Customer CRM database with:
1. Divisions table (id, name, is_active, timestamps)
2. Thanas table with division_id foreign key (cascading delete)
3. Customer Types table for membership tiers (id, name, description, is_active)
4. Customers table with:
   - Required: name, phone, gender (male/female/other)
   - Optional: email, birthdate, address, notes
   - Foreign keys: division_id, thana_id, customer_type_id (all SET NULL on delete)
5. Promo Usages table (customer_id FK cascade, promo_code, benefit_type, benefit_amount, used_at, notes)

Add RLS policies for admin-only access. Include indexes on phone, email, and all foreign keys.
Create updated_at triggers for all tables.
```

### Prompt 2: React Query Hooks

```
Create useCustomers.ts with React Query hooks:
1. Division CRUD hooks (useDivisions, useCreateDivision, useUpdateDivision, useDeleteDivision)
2. Thana CRUD hooks with optional division_id filter
3. Customer Type CRUD hooks
4. Customer hooks with compound filtering:
   - useCustomers(filters) - supports search, gender, customer_type_id, division_id, thana_id, min/max_promo_usage
   - Include promo_usage_count computed from secondary query
   - Strip relation fields (division, thana, customer_type) before update mutations
5. Promo Usage CRUD hooks with customerId filter

Use toast notifications for success/error. Invalidate related queries on mutations.
```

### Prompt 3: Customer Modal Component

```
Create CustomerModal.tsx with:
1. react-hook-form + zod validation
2. Two-column grid layout for name/phone, email/gender
3. Cascading Division → Thana selects (reset thana when division changes)
4. Customer Type select for membership tier
5. Birthdate calendar picker (react-day-picker, max date = today)
6. Address and Notes textareas
7. Active toggle switch
8. "Manage" links to open Division/Thana admin pages in new tabs

Handle both create and edit modes via optional customer prop.
```

### Prompt 4: Customer List Page

```
Create AdminCustomers.tsx with:
1. Stats cards row: Total Customers, Male count, Female count, With Promo Usage count
2. Search input (name, phone, email, address)
3. Filter row: Gender dropdown, Customer Type dropdown, Division dropdown, Promo Usage threshold
4. Clear Filters button (only shows when filters active)
5. Customer table with columns: Name, Phone, Email, Gender badge, Division/Thana, Customer Type, Promo Usage (clickable), Actions
6. Promo Usage column opens PromoUsageHistoryModal
7. Edit/Delete action buttons with confirmation dialog for delete
```

### Prompt 5: Location Management Pages

```
Create admin pages for location data:
1. AdminDivisions.tsx - Simple CRUD table with name and active status
2. AdminThanas.tsx - CRUD table with Division filter dropdown, shows Division name column

Both pages should have:
- Add button opening modal
- Table with Name, Status badge, Actions
- Edit/Delete buttons
- Confirmation dialog for delete (cascade warning for divisions)
```

### Prompt 6: Promo Usage Tracking

```
Create promo usage components:
1. PromoUsageHistoryModal - Shows all promo usages for a customer with Add/Edit/Delete
2. PromoUsageModal - Form with promo_code (required), benefit_type, benefit_amount, datetime picker for used_at, notes

Include table columns: Promo Code badge, Benefit Type, Amount (formatted currency), Date Used, Notes, Actions
```

---

## File Reference

| File | Purpose |
|------|---------|
| `src/hooks/useCustomers.ts` | All customer-related React Query hooks |
| `src/hooks/useLocationData.ts` | Lightweight public location hooks |
| `src/pages/admin/AdminCustomers.tsx` | Customer list page with filtering |
| `src/pages/admin/AdminDivisions.tsx` | Division management page |
| `src/pages/admin/AdminThanas.tsx` | Thana management page |
| `src/pages/admin/AdminCustomerTypes.tsx` | Customer type management page |
| `src/components/admin/CustomerModal.tsx` | Customer create/edit form |
| `src/components/admin/CustomerTypeModal.tsx` | Customer type create/edit form |
| `src/components/admin/DivisionModal.tsx` | Division create/edit form |
| `src/components/admin/ThanaModal.tsx` | Thana create/edit form |
| `src/components/admin/PromoUsageHistoryModal.tsx` | Customer promo history view |
| `src/components/admin/PromoUsageModal.tsx` | Promo usage create/edit form |
| `src/utils/validation-schemas.ts` | Zod schemas for customer validation |

---

## Integration Points

### With Orders Module
- `customer_id` foreign key in orders table
- Customer lookup by phone in checkout
- Customer risk profiles for fraud detection

### With Marketing Module
- Birthday campaign targeting via `birthdate` field
- Customer segmentation via `customer_type_id`
- Promo usage history for campaign analytics

### With Checkout Flow
- Location data for shipping (divisions, thanas)
- Customer type for special pricing/discounts
