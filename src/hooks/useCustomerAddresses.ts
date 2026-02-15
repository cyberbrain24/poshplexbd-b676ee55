import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  address: string;
  division_id: string | null;
  thana_id: string | null;
  postal_code: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
  division?: { id: string; name: string } | null;
  thana?: { id: string; name: string; shipping_cost?: number } | null;
}

export interface AddressFormData {
  label: string;
  address: string;
  division_id: string | null;
  thana_id: string | null;
  postal_code: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

export function useCustomerAddresses(customerId: string | null) {
  return useQuery({
    queryKey: ["customer-addresses", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*, division:divisions(id, name), thana:thanas(id, name, shipping_cost)")
        .eq("customer_id", customerId)
        .order("is_default_shipping", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CustomerAddress[];
    },
    enabled: !!customerId,
  });
}

export function useCreateAddress(customerId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: AddressFormData) => {
      if (!customerId) throw new Error("No customer ID");
      const { data, error } = await supabase
        .from("customer_addresses")
        .insert({ ...form, customer_id: customerId })
        .select("*, division:divisions(id, name), thana:thanas(id, name, shipping_cost)")
        .single();
      if (error) throw error;
      return data as unknown as CustomerAddress;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-addresses", customerId] }),
  });
}

export function useUpdateAddress(customerId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: AddressFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("customer_addresses")
        .update(form)
        .eq("id", id)
        .select("*, division:divisions(id, name), thana:thanas(id, name, shipping_cost)")
        .single();
      if (error) throw error;
      return data as unknown as CustomerAddress;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-addresses", customerId] }),
  });
}

export function useDeleteAddress(customerId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer-addresses", customerId] }),
  });
}
