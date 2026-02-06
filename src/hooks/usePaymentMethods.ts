import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PaymentMethodType } from "./useOrders";

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

export interface PaymentMethodFormData {
  name: string;
  type: PaymentMethodType;
  instructions?: string;
  account_details?: Record<string, any>;
  is_active?: boolean;
  sort_order?: number;
}

// Fetch all payment methods for admin
export const usePaymentMethodsAdmin = () => {
  return useQuery({
    queryKey: ["payment-methods-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("sort_order");
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
      queryClient.invalidateQueries({ queryKey: ["payment-methods-admin"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create payment method");
      console.error(error);
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
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods-admin"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update payment method");
      console.error(error);
    },
  });
};

// Delete payment method
export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods-admin"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete payment method");
      console.error(error);
    },
  });
};

// Toggle payment method active status
export const useTogglePaymentMethodStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods-admin"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method status updated");
    },
    onError: (error) => {
      toast.error("Failed to update status");
      console.error(error);
    },
  });
};
