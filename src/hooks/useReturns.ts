import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_item_id: string;
  customer_id: string | null;
  quantity: number;
  reason: string;
  description: string | null;
  proof_images: string[];
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  restock_decision: string | null;
  restocked_at: string | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: string;
    customer_id: string | null;
  };
  order_item?: {
    id: string;
    product_name: string;
    variant_sku: string | null;
    unit_price: number;
    quantity: number;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

// Fetch all return requests
export const useReturnRequests = (status?: string) => {
  return useQuery({
    queryKey: ["return-requests", status],
    queryFn: async () => {
      let query = supabase
        .from("return_requests")
        .select(`
          *,
          order:orders(id, order_number, customer_id),
          order_item:order_items(id, product_name, variant_sku, unit_price, quantity),
          customer:customers(id, name, phone)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReturnRequest[];
    },
    staleTime: 1000 * 60,
  });
};

// Create return request (customer-facing)
export const useCreateReturnRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      orderItemId,
      customerId,
      quantity,
      reason,
      description,
      proofImages,
    }: {
      orderId: string;
      orderItemId: string;
      customerId?: string;
      quantity: number;
      reason: string;
      description?: string;
      proofImages?: string[];
    }) => {
      const { data, error } = await supabase
        .from("return_requests")
        .insert({
          order_id: orderId,
          order_item_id: orderItemId,
          customer_id: customerId || null,
          quantity,
          reason,
          description: description || null,
          proof_images: proofImages || [],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Update order item status
      await supabase
        .from("order_items")
        .update({ fulfillment_status: 'return_pending' })
        .eq("id", orderItemId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Return request submitted");
    },
    onError: (error) => {
      toast.error("Failed to submit return request");
      console.error(error);
    },
  });
};

// Process return request (admin)
export const useProcessReturnRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      adminNotes,
      restockDecision,
    }: {
      requestId: string;
      status: 'approved' | 'rejected' | 'received' | 'restocked' | 'damaged';
      adminNotes?: string;
      restockDecision?: 'restock' | 'damaged';
    }) => {
      const updateData: any = {
        status,
        admin_notes: adminNotes || null,
        processed_at: new Date().toISOString(),
      };

      if (restockDecision) {
        updateData.restock_decision = restockDecision;
      }

      if (status === 'restocked' || status === 'damaged') {
        updateData.restocked_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("return_requests")
        .update(updateData)
        .eq("id", requestId)
        .select(`
          *,
          order_item:order_items(id, variant_id, quantity)
        `)
        .single();

      if (error) throw error;

      // Update order item status based on decision
      if (status === 'approved' || status === 'received') {
        await supabase
          .from("order_items")
          .update({ fulfillment_status: 'return_pending' })
          .eq("id", data.order_item_id);
      } else if (status === 'restocked') {
        await supabase
          .from("order_items")
          .update({ 
            fulfillment_status: 'returned',
            returned_quantity: data.quantity,
          })
          .eq("id", data.order_item_id);
      } else if (status === 'damaged') {
        await supabase
          .from("order_items")
          .update({ 
            fulfillment_status: 'damaged',
            returned_quantity: data.quantity,
          })
          .eq("id", data.order_item_id);
      } else if (status === 'rejected') {
        await supabase
          .from("order_items")
          .update({ fulfillment_status: 'delivered' })
          .eq("id", data.order_item_id);
      }

      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["return-requests"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Return request ${status}`);
    },
    onError: (error) => {
      toast.error("Failed to process return request");
      console.error(error);
    },
  });
};
