import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Types
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
  shipping_cost?: number;
  created_at: string;
  updated_at: string;
}


export interface CustomerType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  show_on_public_page: boolean;
  show_member_since: boolean;
  created_at: string;
  updated_at: string;
}


export interface CustomerAccount {
  id: string;
  auth_user_id: string;
  customer_id: string | null;
  phone: string | null;
  email: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  division_id: string | null;
  thana_id: string | null;
  address: string | null;
  gender: 'male' | 'female' | 'other';
  customer_type_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  birthdate: string | null;
  profile_image_url: string | null;
  postal_code: string | null;
  public_profile_visible: boolean;
  membership_assigned_at: string | null;
  division?: Division;
  thana?: Thana;
  customer_type?: CustomerType;
  
  customer_account?: CustomerAccount | null;
  has_account?: boolean;
  order_count?: number;
  total_spent?: number;
}

export interface CustomerFilters {
  search?: string;
  gender?: string;
  customer_type_id?: string;
  division_id?: string;
  thana_id?: string;


}

// Divisions hooks
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

// Thanas hooks
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

// Customer Types hooks
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

// Customers hooks
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
        .order("created_at", { ascending: false })
        .limit(1000);

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
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch promo usage counts for each customer (from promo_code_usages)
      const customerIds = data.map(c => c.id);

      // Guard against empty list — Supabase .in() with empty array returns an error
      if (customerIds.length === 0) {
        return [] as Customer[];
      }

      // Run secondary lookups in parallel for faster load
      const [promoRes, accountsRes, orderRes] = await Promise.all([
        supabase.from("promo_code_usages").select("customer_id").in("customer_id", customerIds),
        supabase.from("customer_accounts").select("customer_id, auth_user_id").in("customer_id", customerIds),
        supabase
          .from("orders")
          .select("customer_id, total_amount, order_status")
          .in("customer_id", customerIds)
          .not("order_status", "in", '("cancelled","failed","returned")'),
      ]);

      if (promoRes.error) throw promoRes.error;
      if (accountsRes.error) throw accountsRes.error;
      const promoData = promoRes.data || [];
      const accountsData = accountsRes.data || [];
      const orderStats = orderRes.data;
      const orderError = orderRes.error;

      // Create a map of customer_id to account status
      const accountMap: Record<string, boolean> = {};
      accountsData?.forEach(a => {
        if (a.customer_id && a.auth_user_id) {
          accountMap[a.customer_id] = true;
        }
      });

      // Count promo usages per customer
      const promoCountMap: Record<string, number> = {};
      promoData.forEach(p => {
        promoCountMap[p.customer_id] = (promoCountMap[p.customer_id] || 0) + 1;
      });

      // Order stats fetched in parallel above

      const orderCountMap: Record<string, number> = {};
      const totalSpentMap: Record<string, number> = {};
      if (!orderError && orderStats) {
        orderStats.forEach(o => {
          if (o.customer_id) {
            orderCountMap[o.customer_id] = (orderCountMap[o.customer_id] || 0) + 1;
            totalSpentMap[o.customer_id] = (totalSpentMap[o.customer_id] || 0) + Number(o.total_amount);
          }
        });
      }

      const customersWithPromo = data.map(customer => ({
        ...customer,
        promo_usage_count: promoCountMap[customer.id] || 0,
        has_account: accountMap[customer.id] || false,
        order_count: orderCountMap[customer.id] || 0,
        total_spent: totalSpentMap[customer.id] || 0,
      }));

      // Filter by promo usage if specified
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
    mutationFn: async (customer: Omit<Customer, "id" | "created_at" | "updated_at" | "division" | "thana" | "customer_type" | "promo_usage_count" | "profile_image_url" | "postal_code">) => {
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
      // Strip computed/relational fields but KEEP postal_code and profile_image_url as they are real DB columns
      const { division, thana, customer_type, promo_usage_count, has_account, order_count, total_spent, ...customerData } = customer as any;
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
      // 1. Find linked auth user(s) before deleting DB records
      const { data: accountData } = await supabase
        .from("customer_accounts")
        .select("auth_user_id")
        .eq("customer_id", id);

      const authUserIds = (accountData || []).map((a) => a.auth_user_id).filter(Boolean);

      // 2. Cascade-delete all child records in correct order
      // promo_code_usages
      await supabase.from("promo_code_usages").delete().eq("customer_id", id);
      // reviews
      await supabase.from("reviews").delete().eq("customer_id", id);
      // customer_risk_profiles
      await supabase.from("customer_risk_profiles").delete().eq("customer_id", id);
      // return_requests
      await supabase.from("return_requests").delete().eq("customer_id", id);
      // Unlink orders (set customer_id to null to preserve order history)
      await supabase.from("orders").update({ customer_id: null }).eq("customer_id", id);
      // customer_accounts (DB row)
      await supabase.from("customer_accounts").delete().eq("customer_id", id);

      // 3. Delete the customer record itself
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;

      // 4. Delete auth users via edge function (requires service role)
      if (authUserIds.length > 0) {
        await supabase.functions.invoke("delete-auth-users", {
          body: { userIds: authUserIds },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Customer deleted successfully", description: "All associated data and accounts have been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete customer", description: error.message, variant: "destructive" });
    },
  });
};
