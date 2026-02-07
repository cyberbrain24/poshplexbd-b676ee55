/**
 * Steadfast Courier Integration Hook
 * Provides methods for shipping orders via Steadfast Courier API
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SteadfastConsignment {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface SteadfastResponse {
  status: number;
  message?: string;
  consignment?: SteadfastConsignment;
  delivery_status?: string;
  current_balance?: number;
}

async function callSteadfast(
  action: string,
  params?: Record<string, string>,
  body?: Record<string, unknown>
): Promise<SteadfastResponse> {
  const queryParams = new URLSearchParams({ action, ...params });
  
  const { data, error } = await supabase.functions.invoke("steadfast-courier", {
    method: body ? "POST" : "GET",
    body: body || undefined,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // For GET requests, we need to pass query params differently
  if (!body) {
    const response = await supabase.functions.invoke(
      `steadfast-courier?${queryParams.toString()}`
    );
    if (response.error) throw new Error(response.error.message);
    return response.data;
  }

  if (error) throw new Error(error.message);
  return data;
}

// Create shipment for a single order
export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=create_order",
        {
          method: "POST",
          body: { order_id: orderId },
        }
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      if (data.consignment) {
        toast.success(`Shipment created! Tracking: ${data.consignment.tracking_code}`);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["orders-optimized"] });
      } else {
        toast.error(data.message || "Failed to create shipment");
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create shipment: ${error.message}`);
    },
  });
}

// Bulk create shipments
export function useBulkCreateShipments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=bulk_create",
        {
          method: "POST",
          body: { order_ids: orderIds },
        }
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        const successCount = data.filter((c: { status: string }) => c.status === "success").length;
        const errorCount = data.filter((c: { status: string }) => c.status === "error").length;
        
        if (successCount > 0) {
          toast.success(`${successCount} shipments created successfully`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} shipments failed`);
        }
        
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["orders-optimized"] });
      }
    },
    onError: (error: Error) => {
      toast.error(`Bulk shipment failed: ${error.message}`);
    },
  });
}

// Track shipment by tracking code
export function useTrackShipment(trackingCode?: string) {
  return useQuery({
    queryKey: ["steadfast-track", trackingCode],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        `steadfast-courier?action=track_by_tracking_code&tracking_code=${trackingCode}`
      );
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!trackingCode,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Track by order number (invoice)
export function useTrackByInvoice(orderNumber?: string) {
  return useQuery({
    queryKey: ["steadfast-track-invoice", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        `steadfast-courier?action=track_by_invoice&invoice=${orderNumber}`
      );
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!orderNumber,
    staleTime: 1000 * 60,
  });
}

// Get Steadfast balance
export function useSteadfastBalance() {
  return useQuery({
    queryKey: ["steadfast-balance"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=get_balance"
      );
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create return request
export function useCreateReturn() {
  return useMutation({
    mutationFn: async ({
      consignment_id,
      invoice,
      tracking_code,
      reason,
    }: {
      consignment_id?: string;
      invoice?: string;
      tracking_code?: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=create_return",
        {
          method: "POST",
          body: { consignment_id, invoice, tracking_code, reason },
        }
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Return request created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create return: ${error.message}`);
    },
  });
}

// Get return requests
export function useReturnRequests() {
  return useQuery({
    queryKey: ["steadfast-returns"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=get_returns"
      );
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Get payments
export function useSteadfastPayments() {
  return useQuery({
    queryKey: ["steadfast-payments"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=get_payments"
      );
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Get police stations (for address lookup)
export function usePoliceStations() {
  return useQuery({
    queryKey: ["steadfast-police-stations"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=get_police_stations"
      );
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - this data rarely changes
  });
}

// Sync locations (Districts/Thanas) from Steadfast API
export function useSyncLocationsFromSteadfast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "steadfast-courier?action=sync_locations",
        { method: "POST" }
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Locations synced from Steadfast API");
      queryClient.invalidateQueries({ queryKey: ["divisions"] });
      queryClient.invalidateQueries({ queryKey: ["thanas"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync locations: ${error.message}`);
    },
  });
}

// Delivery status mapper
export const STEADFAST_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "yellow" },
  delivered_approval_pending: { label: "Delivered (Pending Approval)", color: "blue" },
  partial_delivered_approval_pending: { label: "Partial Delivered (Pending)", color: "blue" },
  cancelled_approval_pending: { label: "Cancelled (Pending)", color: "orange" },
  unknown_approval_pending: { label: "Unknown (Pending)", color: "gray" },
  delivered: { label: "Delivered", color: "green" },
  partial_delivered: { label: "Partially Delivered", color: "teal" },
  cancelled: { label: "Cancelled", color: "red" },
  hold: { label: "On Hold", color: "orange" },
  in_review: { label: "In Review", color: "purple" },
  unknown: { label: "Unknown", color: "gray" },
};
