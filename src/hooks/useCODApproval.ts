import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApproveAmountParams {
  orderId: string;
  collectedAmount: number;
  accountId: string; // Account to credit the income
}

/**
 * Hook to approve COD collected amount after Steadfast delivery
 * This will:
 * 1. Update order with collected_amount and amount_approved_at
 * 2. Set payment_status to 'paid'
 * 3. Create an income transaction in the accounts system
 */
export const useApproveCODAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, collectedAmount, accountId }: ApproveAmountParams) => {
      // 1. Get order details for transaction notes
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("order_number, total_amount")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // 2. Update order with collected amount and approval timestamp
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          collected_amount: collectedAmount,
          amount_approved_at: new Date().toISOString(),
          payment_status: "paid",
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 3. Create income transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          account_id: accountId,
          type: "income",
          amount: collectedAmount,
          date: new Date().toISOString().split("T")[0],
          notes: `COD collection for order ${order.order_number}`,
        });

      if (transactionError) throw transactionError;

      return { orderId, collectedAmount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["order", data.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(`COD amount ৳${data.collectedAmount.toLocaleString()} approved and recorded`);
    },
    onError: (error: Error) => {
      toast.error("Failed to approve amount: " + error.message);
    },
  });
};

/**
 * Hook to fetch COD amount from Steadfast tracking data
 * Steadfast returns collected amount in their tracking response
 */
export const useSteadfastCODAmount = (trackingData: { cod_amount?: number } | null | undefined) => {
  return trackingData?.cod_amount ?? null;
};
