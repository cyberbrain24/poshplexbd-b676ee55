import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

export interface OrderPayment {
  id: string;
  order_id: string;
  amount: number;
  account_id: string;
  transaction_id: string | null;
  payment_reference: string | null;
  recorded_by: string | null;
  recorded_at: string;
  created_at: string;
  account?: {
    id: string;
    name: string;
  };
}

// Fetch payments for a specific order
export const useOrderPayments = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ["order-payments", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_payments")
        .select(`
          *,
          account:accounts(id, name)
        `)
        .eq("order_id", orderId)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return data as OrderPayment[];
    },
    enabled: !!orderId,
  });
};

// Record a new payment
export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      amount,
      accountId,
      paymentReference,
      totalAmount,
      currentPaidAmount,
    }: {
      orderId: string;
      amount: number;
      accountId: string;
      paymentReference?: string;
      totalAmount: number;
      currentPaidAmount: number;
    }) => {
      // Validate amount
      const remainingBalance = totalAmount - currentPaidAmount;
      if (amount <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }
      if (amount > remainingBalance) {
        throw new Error(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`);
      }

      // 1. Create income transaction
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          account_id: accountId,
          type: "income",
          amount: amount,
          notes: `Payment for order - Ref: ${paymentReference || 'N/A'}`,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Insert order payment record
      const { error: paymentError } = await supabase
        .from("order_payments")
        .insert({
          order_id: orderId,
          amount: amount,
          account_id: accountId,
          transaction_id: transaction.id,
          payment_reference: paymentReference || null,
        });

      if (paymentError) throw paymentError;

      // 3. Calculate new paid amount and determine payment status
      const newPaidAmount = currentPaidAmount + amount;
      const newPaymentStatus = newPaidAmount >= totalAmount ? "paid" : "partially_paid";

      // 4. Update order with new paid_amount and payment_status
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          paid_amount: newPaidAmount,
          payment_status: newPaymentStatus,
          ...(newPaymentStatus === "paid" && { payment_verified_at: new Date().toISOString() }),
        })
        .eq("id", orderId);

      if (orderError) throw orderError;

      // 5. Add to order status history
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          previous_status: currentPaidAmount > 0 ? "partially_paid" : "unpaid",
          new_status: newPaymentStatus,
          status_type: "payment",
          notes: `Payment of ${formatCurrency(amount)} recorded. ${paymentReference ? `Ref: ${paymentReference}` : ''}`,
          metadata: { amount, account_id: accountId, transaction_id: transaction.id },
        });

      if (historyError) throw historyError;

      return { newPaidAmount, newPaymentStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-payments"] });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`Payment recorded. Status: ${data.newPaymentStatus.replace('_', ' ')}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record payment");
      console.error(error);
    },
  });
};
