import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerRiskProfile {
  id: string;
  customer_id: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  returned_orders: number;
  failed_payments: number;
  cancellation_rate: number;
  return_rate: number;
  cod_disabled: boolean;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  last_order_at: string | null;
  active_cod_orders: number;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
}

// Fetch all risk profiles
export const useRiskProfiles = () => {
  return useQuery({
    queryKey: ["risk-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_risk_profiles")
        .select(`
          *,
          customer:customers(id, name, phone, email)
        `)
        .order("cancellation_rate", { ascending: false });
      if (error) throw error;
      return data as CustomerRiskProfile[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Fetch high-risk customers
export const useHighRiskCustomers = () => {
  return useQuery({
    queryKey: ["high-risk-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_risk_profiles")
        .select(`
          *,
          customer:customers(id, name, phone, email)
        `)
        .or("cancellation_rate.gte.30,return_rate.gte.30,is_blacklisted.eq.true")
        .order("cancellation_rate", { ascending: false });
      if (error) throw error;
      return data as CustomerRiskProfile[];
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Toggle COD for customer
export const useToggleCOD = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      disabled 
    }: { 
      customerId: string; 
      disabled: boolean;
    }) => {
      // Check if profile exists
      const { data: existing } = await supabase
        .from("customer_risk_profiles")
        .select("id")
        .eq("customer_id", customerId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("customer_risk_profiles")
          .update({ cod_disabled: disabled })
          .eq("customer_id", customerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_risk_profiles")
          .insert({ 
            customer_id: customerId, 
            cod_disabled: disabled 
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { disabled }) => {
      queryClient.invalidateQueries({ queryKey: ["risk-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["high-risk-customers"] });
      toast.success(disabled ? "COD disabled for customer" : "COD enabled for customer");
    },
    onError: (error) => {
      toast.error("Failed to update COD status");
      console.error(error);
    },
  });
};

// Blacklist customer
export const useBlacklistCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      blacklisted,
      reason 
    }: { 
      customerId: string; 
      blacklisted: boolean;
      reason?: string;
    }) => {
      const { data: existing } = await supabase
        .from("customer_risk_profiles")
        .select("id")
        .eq("customer_id", customerId)
        .single();

      const updateData = {
        is_blacklisted: blacklisted,
        blacklist_reason: blacklisted ? (reason || 'Manual blacklist') : null,
        cod_disabled: blacklisted ? true : undefined, // Also disable COD when blacklisting
      };

      if (existing) {
        const { error } = await supabase
          .from("customer_risk_profiles")
          .update(updateData)
          .eq("customer_id", customerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_risk_profiles")
          .insert({ 
            customer_id: customerId, 
            ...updateData
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { blacklisted }) => {
      queryClient.invalidateQueries({ queryKey: ["risk-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["high-risk-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(blacklisted ? "Customer blacklisted" : "Customer removed from blacklist");
    },
    onError: (error) => {
      toast.error("Failed to update blacklist status");
      console.error(error);
    },
  });
};

// Update risk profile after order completion/cancellation
export const useUpdateRiskProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      action 
    }: { 
      customerId: string; 
      action: 'completed' | 'cancelled' | 'returned' | 'payment_failed';
    }) => {
      const { data: profile, error: fetchError } = await supabase
        .from("customer_risk_profiles")
        .select("*")
        .eq("customer_id", customerId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const current = profile || {
        total_orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        returned_orders: 0,
        failed_payments: 0,
        active_cod_orders: 0,
      };

      const updates: any = {};

      switch (action) {
        case 'completed':
          updates.completed_orders = current.completed_orders + 1;
          updates.active_cod_orders = Math.max(0, current.active_cod_orders - 1);
          break;
        case 'cancelled':
          updates.cancelled_orders = current.cancelled_orders + 1;
          updates.active_cod_orders = Math.max(0, current.active_cod_orders - 1);
          break;
        case 'returned':
          updates.returned_orders = current.returned_orders + 1;
          break;
        case 'payment_failed':
          updates.failed_payments = current.failed_payments + 1;
          break;
      }

      // Recalculate rates
      const totalOrders = current.total_orders;
      if (totalOrders > 0) {
        updates.cancellation_rate = ((current.cancelled_orders + (action === 'cancelled' ? 1 : 0)) / totalOrders) * 100;
        updates.return_rate = ((current.returned_orders + (action === 'returned' ? 1 : 0)) / totalOrders) * 100;
      }

      if (profile) {
        const { error } = await supabase
          .from("customer_risk_profiles")
          .update(updates)
          .eq("customer_id", customerId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_risk_profiles")
          .insert({
            customer_id: customerId,
            total_orders: 1,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["risk-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["high-risk-customers"] });
    },
  });
};

// Check duplicate transaction IDs
export const useCheckDuplicateTransaction = () => {
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_id, created_at")
        .eq("transaction_id", transactionId)
        .neq("payment_status", "failed");
      
      if (error) throw error;
      return data;
    },
  });
};
