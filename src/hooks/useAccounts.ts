import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

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
  order_payments?: Array<{
    id: string;
    order_id: string;
    amount: number;
    order?: {
      id: string;
      order_number: string;
      total_amount: number;
    };
  }>;
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
          category:transaction_categories(*),
          order_payments(id, order_id, amount, order:orders(id, order_number, total_amount))
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
      const { data, error } = await supabase
        .from("transactions")
        .update(transaction)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // If amount changed, update related order_payments and recalculate order paid_amount
      if (transaction.amount !== undefined) {
        const { data: orderPayment } = await supabase
          .from("order_payments")
          .select("id, order_id, amount")
          .eq("transaction_id", id)
          .single();

        if (orderPayment) {
          const oldAmount = orderPayment.amount;

          // Update the order_payment amount
          await supabase
            .from("order_payments")
            .update({ amount: transaction.amount })
            .eq("id", orderPayment.id);

          // Recalculate order's total paid_amount from all payments
          const { data: allPayments } = await supabase
            .from("order_payments")
            .select("id, amount")
            .eq("order_id", orderPayment.order_id);

          // The allPayments still has the old amount for this payment, so adjust
          const newPaidAmount = (allPayments || []).reduce(
            (sum, p) => sum + (p.id === orderPayment.id ? transaction.amount! : (p.amount || 0)), 0
          );

          const { data: order } = await supabase
            .from("orders")
            .select("total_amount, order_number, payment_status")
            .eq("id", orderPayment.order_id)
            .single();

          const newPaymentStatus = order && newPaidAmount >= order.total_amount
            ? "paid"
            : newPaidAmount > 0
              ? "partially_paid"
              : "unpaid";

          await supabase
            .from("orders")
            .update({ paid_amount: newPaidAmount, payment_status: newPaymentStatus })
            .eq("id", orderPayment.order_id);

          // Add timeline history entry
          await supabase.from("order_status_history").insert({
            order_id: orderPayment.order_id,
            previous_status: order?.payment_status || "unknown",
            new_status: newPaymentStatus,
            status_type: "payment",
            notes: `Payment updated from ${formatCurrency(oldAmount)} to ${formatCurrency(transaction.amount)}. New paid: ${formatCurrency(newPaidAmount)}`,
            metadata: { updated_transaction_id: id },
          });
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["order-payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
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
      // Find linked order_payments before deleting
      const { data: linkedPayments, error: fetchError } = await supabase
        .from("order_payments")
        .select("id, order_id, amount")
        .eq("transaction_id", id);

      if (fetchError) throw fetchError;

      // Collect affected order IDs and removed amounts BEFORE deleting
      const affectedOrders: { orderId: string; removedAmount: number }[] = [];
      if (linkedPayments && linkedPayments.length > 0) {
        const orderIds = [...new Set(linkedPayments.map((p) => p.order_id))];
        for (const orderId of orderIds) {
          const removedAmount = linkedPayments
            .filter((p) => p.order_id === orderId)
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          affectedOrders.push({ orderId, removedAmount });
        }

        // Delete order_payments referencing this transaction
        const { error: paymentError } = await supabase
          .from("order_payments")
          .delete()
          .eq("transaction_id", id);
        if (paymentError) throw paymentError;
      }

      // Delete the transaction
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;

      // Recalculate each affected order's paid_amount and payment_status
      for (const { orderId, removedAmount } of affectedOrders) {
        // Get remaining payments for this order
        const { data: remainingPayments } = await supabase
          .from("order_payments")
          .select("amount")
          .eq("order_id", orderId);

        const newPaidAmount = (remainingPayments || []).reduce(
          (sum, p) => sum + (p.amount || 0), 0
        );

        const { data: order } = await supabase
          .from("orders")
          .select("total_amount, order_number, payment_status")
          .eq("id", orderId)
          .single();

        const newPaymentStatus = newPaidAmount >= (order?.total_amount || 0)
          ? "paid"
          : newPaidAmount > 0
            ? "partially_paid"
            : "unpaid";

        // Update order paid_amount and payment_status
        const { error: updateError } = await supabase
          .from("orders")
          .update({ paid_amount: newPaidAmount, payment_status: newPaymentStatus })
          .eq("id", orderId);
        if (updateError) throw updateError;

        // Add timeline history entry
        await supabase.from("order_status_history").insert({
          order_id: orderId,
          previous_status: order?.payment_status || "unknown",
          new_status: newPaymentStatus,
          status_type: "payment",
          notes: `Payment of ${formatCurrency(removedAmount)} reversed — transaction deleted from accounts. New paid: ${formatCurrency(newPaidAmount)}`,
          metadata: { deleted_transaction_id: id },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["order-payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      toast.success("Transaction and linked payment records deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete transaction: " + error.message);
    },
  });
};
