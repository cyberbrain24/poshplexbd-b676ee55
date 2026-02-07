import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Account {
  id: string;
  name: string;
  description: string | null;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
  to_account?: Account;
  category?: TransactionCategory;
}

// Accounts hooks
export const useAccounts = () => {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Account[];
    },
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (account: Omit<Account, "id" | "created_at" | "updated_at" | "current_balance">) => {
      const { data, error } = await supabase
        .from("accounts")
        .insert({ ...account, current_balance: account.initial_balance })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create account: " + error.message);
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...account }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from("accounts")
        .update(account)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update account: " + error.message);
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete account: " + error.message);
    },
  });
};

// Transaction Categories hooks
export const useTransactionCategories = (type?: "income" | "expense") => {
  return useQuery({
    queryKey: ["transaction-categories", type],
    queryFn: async () => {
      let query = supabase.from("transaction_categories").select("*").order("name");
      if (type) {
        query = query.eq("type", type);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as TransactionCategory[];
    },
  });
};

export const useCreateTransactionCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<TransactionCategory, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
      toast.success("Category created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create category: " + error.message);
    },
  });
};

export const useUpdateTransactionCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<TransactionCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .update(category)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
      toast.success("Category updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update category: " + error.message);
    },
  });
};

export const useDeleteTransactionCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transaction_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete category: " + error.message);
    },
  });
};

// Transactions hooks
export interface TransactionFilters {
  accountId?: string;
  type?: "income" | "expense" | "transfer";
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export const useTransactions = (filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          account:accounts!transactions_account_id_fkey(*),
          to_account:accounts!transactions_to_account_id_fkey(*),
          category:transaction_categories(*)
        `)
        .order("date", { ascending: false });

      if (filters?.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "created_at" | "updated_at" | "account" | "category">) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Transaction created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create transaction: " + error.message);
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...transaction }: Partial<Transaction> & { id: string }) => {
      // Update the transaction
      const { data, error } = await supabase
        .from("transactions")
        .update(transaction)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // If amount changed, update related order_payments and recalculate order paid_amount
      if (transaction.amount !== undefined) {
        // Find related order_payment
        const { data: orderPayment } = await supabase
          .from("order_payments")
          .select("id, order_id, amount")
          .eq("transaction_id", id)
          .single();

        if (orderPayment) {
          const amountDiff = transaction.amount - orderPayment.amount;
          
          // Update the order_payment amount
          await supabase
            .from("order_payments")
            .update({ amount: transaction.amount })
            .eq("id", orderPayment.id);

          // Recalculate order's total paid_amount
          const { data: allPayments } = await supabase
            .from("order_payments")
            .select("amount")
            .eq("order_id", orderPayment.order_id);

          const newPaidAmount = (allPayments || []).reduce(
            (sum, p) => sum + (p.amount || 0), 0
          ) + amountDiff;

          // Get order total to determine payment status
          const { data: order } = await supabase
            .from("orders")
            .select("total_amount")
            .eq("id", orderPayment.order_id)
            .single();

          const newPaymentStatus = order && newPaidAmount >= order.total_amount 
            ? "paid" 
            : newPaidAmount > 0 
              ? "partially_paid" 
              : "unpaid";

          await supabase
            .from("orders")
            .update({ 
              paid_amount: newPaidAmount,
              payment_status: newPaymentStatus 
            })
            .eq("id", orderPayment.order_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["order-payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Transaction updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update transaction: " + error.message);
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // First, delete any order_payments that reference this transaction
      const { error: paymentError } = await supabase
        .from("order_payments")
        .delete()
        .eq("transaction_id", id);
      
      if (paymentError) throw paymentError;

      // Then delete the transaction itself
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["order-payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Transaction deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete transaction: " + error.message);
    },
  });
};
