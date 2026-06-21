import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { PackageCheck, Search, Copy, Phone, Loader2, Inbox, CheckCircle2, RefreshCw, X, ExternalLink, StickyNote, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useSyncSteadfastStatus } from "@/hooks/useSteadfast";
import OrderDetailModal from "@/components/admin/OrderDetailModal";


type StatusFilter = "all" | "not_ready" | "ready";
type IssueValue = "stock_out" | "print_issues" | "courier_issues" | "other_issues";
type IssueFilter = "all" | "none" | IssueValue;

export const ISSUE_LABELS: Record<IssueValue, string> = {
  stock_out: "Stock Out",
  print_issues: "Print Issues",
  courier_issues: "Courier Issues",
  other_issues: "Others Issues",
};

const ISSUE_OPTIONS: { value: IssueValue; label: string }[] = [
  { value: "stock_out", label: ISSUE_LABELS.stock_out },
  { value: "print_issues", label: ISSUE_LABELS.print_issues },
  { value: "courier_issues", label: ISSUE_LABELS.courier_issues },
  { value: "other_issues", label: ISSUE_LABELS.other_issues },
];

interface FulfillmentItem {
  id: string;
  product_id: string | null;
  product_name: string;
  variant_sku: string | null;
  variant_details: Record<string, unknown> | null;
  quantity: number;
  unit_price: number;
  product?: {
    id: string;
    images: { image_url: string; sort_order: number }[] | null;
  } | null;
}

interface FulfillmentOrder {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  payment_method_type: string | null;
  total_amount: number;
  consignment_id: string | null;
  created_at: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  customer_notes: string | null;
  internal_notes: string | null;
  fulfillment_issue: IssueValue | null;
  fulfillment_ready: boolean | null;
  items: FulfillmentItem[];
}

const AdminOrderFulfillment = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [issueFilter, setIssueFilter] = useState<IssueFilter>("all");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fulfillment-orders", statusFilter, search],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select(
          `
          id, order_number, order_status, payment_status, total_amount,
          payment_method_type, consignment_id, created_at,
          shipping_name, shipping_phone, shipping_address,
          customer_notes, internal_notes, fulfillment_issue, fulfillment_ready,
          items:order_items(
            id, product_id, product_name, variant_sku, variant_details, quantity, unit_price,
            product:products(id, images:product_images(image_url, sort_order))
          )
        `,
          { count: "exact" }
        )
        .eq("order_status", "confirmed")
        .order("created_at", { ascending: true });

      if (search.trim()) {
        const s = search.trim();
        q = q.or(
          `order_number.ilike.%${s}%,shipping_name.ilike.%${s}%,shipping_phone.ilike.%${s}%`
        );
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { orders: (data || []) as unknown as FulfillmentOrder[], count: count || 0 };
    },
  });

  const setIssue = useCallback(
    async (orderId: string, value: IssueValue | null) => {
      const { error } = await supabase
        .from("orders")
        .update({ fulfillment_issue: value })
        .eq("id", orderId);
      if (error) {
        toast.error("Failed to update status");
        return;
      }
      qc.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    [qc]
  );

  const toggleReady = useCallback(
    async (orderId: string, currentlyReady: boolean) => {
      const next = !currentlyReady;
      const update: { fulfillment_ready: boolean; fulfillment_issue?: null } = {
        fulfillment_ready: next,
      };
      if (next) update.fulfillment_issue = null;
      const { error } = await supabase
        .from("orders")
        .update(update)
        .eq("id", orderId);
      if (error) {
        toast.error("Failed to update status");
        return;
      }
      toast.success(next ? "Marked as Ready" : "Moved back to Not Ready");
      qc.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    [qc]
  );


  const allOrders = data?.orders ?? [];
  const orders = useMemo(() => {
    let list = allOrders;
    if (statusFilter === "ready") list = list.filter((o) => !!o.fulfillment_ready);
    else if (statusFilter === "not_ready") list = list.filter((o) => !o.fulfillment_ready);

    if (issueFilter !== "all") {
      if (issueFilter === "none") list = list.filter((o) => !o.fulfillment_issue);
      else list = list.filter((o) => o.fulfillment_issue === issueFilter);
    }
    return list;
  }, [allOrders, statusFilter, issueFilter]);

  const syncAllSteadfast = useSyncSteadfastStatus();

  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);

  const handleSyncAllSteadfast = async () => {
    try {
      // Only sync orders that still need an update — skip orders already in a final state.
      const { data: syncData, error } = await supabase
        .from("orders")
        .select("id, tracking_number, consignment_id, order_status")
        .or("tracking_number.not.is.null,consignment_id.not.is.null")
        .not("order_status", "in", "(delivered,cancelled,returned,refunded)");
      if (error) throw error;
      const ids = (syncData || [])
        .filter((o: any) => o.tracking_number || o.consignment_id)
        .map((o: any) => o.id);
      if (ids.length === 0) {
        toast.message("No active shipped orders to sync");
        return;
      }

      // Chunk the IDs so each edge-function invocation finishes well under the timeout.
      const CHUNK = 20;
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

      setSyncProgress({ done: 0, total: ids.length });
      const toastId = toast.loading(`Syncing 0 / ${ids.length} orders…`);

      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      let processed = 0;

      for (const chunk of chunks) {
        try {
          const res = await new Promise<any>((resolve, reject) => {
            syncAllSteadfast.mutate(chunk, {
              onSuccess: (d) => resolve(d),
              onError: (e) => reject(e),
            });
          });
          const results = (res?.results || []) as Array<{ mapped_status?: string; skipped?: boolean }>;
          totalUpdated += results.filter((r) => r.mapped_status).length;
          totalSkipped += results.filter((r) => r.skipped).length;
        } catch (e) {
          console.error("[Sync chunk failed]", e);
          totalFailed += chunk.length;
        }
        processed += chunk.length;
        setSyncProgress({ done: processed, total: ids.length });
        toast.loading(`Syncing ${processed} / ${ids.length} orders…`, { id: toastId });
      }

      toast.dismiss(toastId);
      if (totalUpdated > 0) toast.success(`${totalUpdated} order(s) synced with Steadfast`);
      else if (totalSkipped > 0 && totalFailed === 0) toast.message(`No status changes (${totalSkipped} skipped)`);
      if (totalFailed > 0) toast.error(`${totalFailed} order(s) failed to sync`);

      setSyncProgress(null);
      qc.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders-optimized"] });
    } catch (err) {
      console.error(err);
      setSyncProgress(null);
      toast.error("Failed to load orders for sync");
    }
  };

  const filterConfig: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All In Review Order" },
    { key: "not_ready", label: "Mark as not Ready" },
    { key: "ready", label: "Mark as Ready" },
  ];

  const showIssueFilter = statusFilter === "all" || statusFilter === "not_ready";

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <PackageCheck className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order Fulfillment</h1>
            <p className="text-sm text-muted-foreground">
              Pack & prepare orders before sending to courier
            </p>
          </div>
          <Badge variant="secondary" className="ml-2">
            {data?.count ?? 0}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filterConfig.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={statusFilter === f.key ? "default" : "outline"}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
          {showIssueFilter && (
            <Select value={issueFilter} onValueChange={(v) => setIssueFilter(v as IssueFilter)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="All issues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All issues</SelectItem>
                <SelectItem value="none">None</SelectItem>
                {ISSUE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="PO / phone / name"
              className="pl-8 h-9 w-56"
            />
          </div>
          <Button
            onClick={() => {
              const withConsignment = orders.filter((o) => o.consignment_id);
              if (withConsignment.length === 0) {
                toast.message("No parcel IDs in current view");
                return;
              }
              withConsignment.forEach((o) => {
                window.open(
                  `https://steadfast.com.bd/user/edit-parcel/${o.consignment_id}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              });
            }}
            disabled={!orders.some((o) => o.consignment_id)}
            variant="outline"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open All Parcels
          </Button>
          <Button
            onClick={handleSyncAllSteadfast}
            disabled={syncAllSteadfast.isPending || isLoading}
            variant="outline"
            size="sm"
          >
            {syncAllSteadfast.isPending || syncProgress ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {syncProgress ? `Syncing ${syncProgress.done}/${syncProgress.total}` : "Sync Steadfast"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Inbox className="w-10 h-10 opacity-50" />
          <p className="font-medium">No orders in review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <FulfillmentCard
              key={order.id}
              order={order}
              isReady={!!order.fulfillment_ready}
              onOpen={() => setOpenOrderId(order.id)}
              onToggleReady={() => toggleReady(order.id, !!order.fulfillment_ready)}
              onChangeIssue={(v) => setIssue(order.id, v)}
            />
          ))}
        </div>
      )}

      {openOrderId && (
        <OrderDetailModal
          orderId={openOrderId}
          open={!!openOrderId}
          onClose={() => setOpenOrderId(null)}
        />
      )}
    </div>
  );
};

interface CardProps {
  order: FulfillmentOrder;
  onOpen: () => void;
  onToggleReady: () => void;
  isReady: boolean;
  onChangeIssue: (v: IssueValue | null) => void;
}

const FulfillmentCard = ({ order, onOpen, onToggleReady, isReady, onChangeIssue }: CardProps) => {
  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const getImage = (item: FulfillmentItem) => {
    const imgs = item.product?.images;
    if (!imgs || imgs.length === 0) return null;
    const sorted = [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return sorted[0]?.image_url ?? null;
  };

  const variantText = (item: FulfillmentItem) => {
    const d = item.variant_details || {};
    const parts: string[] = [];
    const size = (d as Record<string, unknown>).size;
    const color = (d as Record<string, unknown>).color;
    if (size) parts.push(String(size));
    if (color) parts.push(String(color));
    if (parts.length === 0 && item.variant_sku) parts.push(item.variant_sku);
    return parts.join(" · ");
  };

  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const note = order.customer_notes?.trim() || order.internal_notes?.trim() || "";
  const issue = order.fulfillment_issue;
  const issueLabel = issue ? ISSUE_LABELS[issue] : "None";

  return (
    <div
      className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Thumbnails */}
        <div className="flex gap-3 flex-wrap min-w-0 flex-1">
          {order.items.map((item) => {
            const img = getImage(item);
            return (
          <div key={item.id} className="flex flex-col items-center w-56 sm:w-28 shrink-0">
                <div className="w-56 h-56 sm:w-28 sm:h-28 rounded-xl bg-muted overflow-hidden border">
                  {img ? (
                    <img
                      src={img}
                      alt={item.product_name}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightbox({ src: img, alt: item.product_name });
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold mt-1.5 text-center leading-tight">
                  ×{item.quantity}
                </div>
                <div className="text-sm font-bold text-foreground text-center leading-tight truncate w-full">
                  {variantText(item) || "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base">{order.order_number}</span>
            <Badge variant="outline" className="capitalize">
              {order.order_status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {order.consignment_id ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const w = window.open(
                    `https://steadfast.com.bd/user/edit-parcel/${order.consignment_id}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                  if (w) {
                    w.blur();
                    window.focus();
                  }
                }}
                className="text-lg font-bold text-foreground flex items-center gap-1 hover:underline hover:text-primary bg-transparent border-0 p-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Parcel ID: {order.consignment_id}
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>
            ) : (
              <span className="text-lg font-bold text-foreground flex items-center gap-1">
                <Copy className="w-4 h-4 text-muted-foreground" />
                Parcel ID: —
              </span>
            )}
          </div>
          <div className="font-medium">{order.shipping_name}</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyText(order.shipping_phone, "Phone");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            {order.shipping_phone}
          </button>
          {note && (
            <div className="text-xs text-muted-foreground flex items-start gap-1">
              <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2 break-words">{note}</span>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "dd MMM yyyy · HH:mm")} ·{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Action */}
        <div
          className="flex lg:flex-col items-stretch lg:items-end justify-end gap-2 shrink-0 w-full lg:w-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            value={issue ?? "none"}
            onValueChange={(v) => onChangeIssue(v === "none" ? null : (v as IssueValue))}
          >
            <SelectTrigger
              className={`h-9 w-full lg:w-44 ${
                issue
                  ? "bg-red-700 hover:bg-red-800 text-white border-red-700 focus:ring-red-700 [&>svg]:text-white"
                  : ""
              }`}
            >
              {issue ? (
                <span className="flex items-center gap-1.5 truncate">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {issueLabel}
                </span>
              ) : (
                <SelectValue placeholder="Status" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {ISSUE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isReady ? (
            <Button
              onClick={onToggleReady}
              className="w-full lg:w-auto gap-2 text-white hover:opacity-90"
              style={{ backgroundColor: '#16a34a' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Ready
            </Button>
          ) : (
            <Button
              onClick={onToggleReady}
              className="w-full lg:w-auto gap-2 bg-black text-white hover:bg-black/90"
            >
              <PackageCheck className="w-4 h-4" />
              Mark as Ready
            </Button>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setLightbox(null);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminOrderFulfillment;
