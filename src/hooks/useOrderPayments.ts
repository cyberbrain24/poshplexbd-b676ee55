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

// Record a new payment with idempotency protection
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
      idempotencyKey,
    }: {
      orderId: string;
      amount: number;
      accountId: string;
      paymentReference?: string;
      totalAmount: number;
      currentPaidAmount: number;
      idempotencyKey?: string;
    }) => {
      // Client-side guards (server enforces too)
      const remainingBalance = totalAmount - currentPaidAmount;
      if (amount <= 0) throw new Error("Payment amount must be greater than 0");
      if (amount > remainingBalance) {
        throw new Error(`Payment amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`);
      }

      const idemKey = idempotencyKey || `${orderId}-${amount}-${Date.now()}`;

      // Atomic server-side write: transaction + order_payment + order update + history
      const { data, error } = await supabase.rpc("record_order_payment_atomic", {
        p_order_id: orderId,
        p_amount: amount,
        p_account_id: accountId,
        p_payment_reference: paymentReference || null,
        p_idempotency_key: idemKey,
      });

      if (error) throw new Error(error.message);
      const result = data as { new_paid_amount: number; new_payment_status: string };
      return {
        newPaidAmount: Number(result.new_paid_amount),
        newPaymentStatus: result.new_payment_status,
      };
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
