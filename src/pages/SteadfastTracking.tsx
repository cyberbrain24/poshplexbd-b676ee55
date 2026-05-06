import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package } from "lucide-react";

interface StatusData {
  status?: string;
  consignment?: any;
  delivery_status?: string;
  [k: string]: any;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending — Not Picked",
  delivered_approval_pending: "Delivered (Approval Pending)",
  partial_delivered_approval_pending: "Partial Delivered (Approval Pending)",
  cancelled_approval_pending: "Cancelled (Approval Pending)",
  unknown_approval_pending: "Unknown (Approval Pending)",
  delivered: "Delivered",
  partial_delivered: "Partial Delivered",
  cancelled: "Cancelled",
  hold: "On Hold",
  in_review: "In Review",
  unknown: "Unknown",
};

export default function SteadfastTracking() {
  const { consignmentId } = useParams<{ consignmentId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatusData | null>(null);

  useEffect(() => {
    if (!consignmentId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error } = await supabase.functions.invoke(
          "steadfast-courier",
          {
            body: null,
            method: "GET",
            // pass action via query
          } as any
        );
        // Fallback: call via direct URL with query string
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steadfast-courier?action=track_by_consignment&consignment_id=${consignmentId}`;
        const r = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });
        const json = await r.json();
        if (!r.ok) throw new Error(json?.error || "Failed to load tracking");
        setData(json);
        void res; void error;
      } catch (e: any) {
        setError(e.message || "Failed to load tracking");
      } finally {
        setLoading(false);
      }
    })();
  }, [consignmentId]);

  const statusKey = (data?.delivery_status || data?.status || "").toString();
  const statusLabel = STATUS_LABEL[statusKey] || statusKey || "—";

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Package className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight uppercase">
              Steadfast Tracking
            </h1>
            <p className="text-muted-foreground text-sm font-mono">
              Consignment: {consignmentId}
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Fetching status…
          </div>
        )}

        {error && (
          <div className="border border-destructive/30 bg-destructive/5 text-destructive p-4 rounded">
            {error}
          </div>
        )}

        {data && !error && (
          <div className="space-y-6">
            <div className="border border-border p-6 rounded-lg">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Current Status
              </div>
              <div className="text-2xl font-semibold">{statusLabel}</div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 text-sm font-medium">
                Full Response
              </div>
              <pre className="p-4 text-xs overflow-auto max-h-[60vh] bg-card">
{JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
