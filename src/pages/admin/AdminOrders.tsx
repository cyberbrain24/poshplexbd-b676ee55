import { useState, useEffect, useMemo } from "react";
import { useOrders, useOrderStats, useDeleteOrder, useMarkOrderCalled, useUpdateCallCenterNotes, OrderStatus, PaymentStatus } from "@/hooks/useOrders";
import { ORDER_STATUS_LABELS, ALLOWED_ORDER_STATUSES, PAYMENT_STATUS_LABELS } from "@/constants";
import MultiSelectFilter from "@/components/admin/MultiSelectFilter";
import ProductMultiSelectFilter, { type PickedProduct } from "@/components/admin/ProductMultiSelectFilter";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Package,
  Search,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Eye,
  Truck,
  Loader2,
  Trash2,
  ShieldAlert,
  Banknote,
  Download,
  RefreshCw,
  Phone,
  PhoneCall,
  ExternalLink,
  Save,
  CheckSquare,
  X,
  ListChecks,
  Copy,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import OrderLocationFilter from "@/components/admin/OrderLocationFilter";
import { useCreateShipment, useResetShipping, useSyncSteadfastStatus } from "@/hooks/useSteadfast";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


// Parcel ship cell - shows Ship button or Shipped: {consignment_id} in green
const ParcelIdCell = ({ order }: { order: { id: string; consignment_id: string | null; tracking_number: string | null } }) => {
  const createShipment = useCreateShipment();
  const resetShipping = useResetShipping();

  if (!order.consignment_id) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          createShipment.mutate(order.id);
        }}
        disabled={createShipment.isPending}
        className="h-6 px-2 text-[10px] w-full"
      >
        {createShipment.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <Truck className="h-3 w-3 mr-1" />
        )}
        Ship
      </Button>
    );
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(order.consignment_id || "");
      toast.success("Parcel ID copied to clipboard");
    } catch {
      toast.error("Failed to copy parcel ID");
    }
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="h-6 px-2 text-[10px] flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300 font-mono justify-center gap-1"
        title={`Shipped — Consignment ${order.consignment_id} (click to copy)`}
      >
        <Copy className="h-3 w-3" />
        Shipped: {order.consignment_id}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          resetShipping.mutate(order.id);
        }}
        disabled={resetShipping.isPending}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
        title="Reset shipping (if deleted from Steadfast)"
      >
        {resetShipping.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
};

// Courier status component - shows Ship button or tracking number + tracking link
const CourierStatusCell = ({ order }: { order: { id: string; tracking_number: string | null; courier_name: string | null; consignment_id?: string | null } }) => {
  const createShipment = useCreateShipment();

  if (!order.tracking_number) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          createShipment.mutate(order.id);
        }}
        disabled={createShipment.isPending}
        className="h-7 text-xs"
      >
        {createShipment.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <Truck className="h-3 w-3 mr-1" />
        )}
        Ship
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1 items-end">
      <Badge className="bg-blue-100 text-blue-800" variant="outline">
        {order.courier_name || "Steadfast"}
      </Badge>
      <span className="text-xs text-muted-foreground font-mono">{order.tracking_number}</span>
      {order.tracking_number && (
        <a
          href={`https://steadfast.com.bd/t/${order.tracking_number}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
        >
          Track <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
};

// Call customer button — toggles "called" state
const CallCustomerButton = ({ order }: { order: { id: string; customer_called_at: string | null; shipping_phone: string; customer?: { phone: string } | null } }) => {
  const mark = useMarkOrderCalled();
  const phone = order.customer?.phone || order.shipping_phone;
  const called = !!order.customer_called_at;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        mark.mutate({ orderId: order.id, called: !called });
      }}
      disabled={mark.isPending}
      title={called ? `Called ${format(new Date(order.customer_called_at!), 'MMM d, h:mm a')} — click to undo` : "Mark as called"}
      className={`inline-flex items-center justify-center h-5 w-5 rounded-sm border transition-colors ${
        called
          ? 'bg-green-100 border-green-400 text-green-700'
          : 'border-border text-muted-foreground hover:bg-muted'
      }`}
    >
      {mark.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : called ? <PhoneCall className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
      <span className="sr-only">{called ? `Called ${phone}` : `Mark ${phone} as called`}</span>
    </button>
  );
};

// Call center notes editor (collapsible)
const CallNotesEditor = ({ order }: { order: { id: string; call_center_notes: string | null } }) => {
  const [open, setOpen] = useState(!!order.call_center_notes);
  const [value, setValue] = useState(order.call_center_notes || "");
  const save = useUpdateCallCenterNotes();

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="text-[10px] text-primary hover:underline self-start"
      >
        + Add call note
      </button>
    );
  }

  return (
    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Call notes…"
        rows={2}
        className="text-[11px] min-h-[44px] p-1.5"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-6 text-[10px] px-2 w-full"
        disabled={save.isPending || value === (order.call_center_notes || "")}
        onClick={() => save.mutate({ orderId: order.id, notes: value })}
      >
        {save.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1" /> Save note</>}
      </Button>
    </div>
  );
};

const orderStatusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  partially_delivered: "bg-teal-100 text-teal-800",
  returned: "bg-orange-100 text-orange-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-200 text-red-900",
  rto: "bg-gray-100 text-gray-800",
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  unpaid: "bg-gray-100 text-gray-800",
  pending_verification: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  partially_paid: "bg-blue-100 text-blue-800",
  partially_refunded: "bg-orange-100 text-orange-800",
  refunded: "bg-purple-100 text-purple-800",
  failed: "bg-red-100 text-red-800",
};

const riskColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const AdminOrders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus[]>([]);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [locationMode, setLocationMode] = useState<"include" | "exclude">("include");
  const [locDivisionIds, setLocDivisionIds] = useState<string[]>([]);
  const [locThanaIds, setLocThanaIds] = useState<string[]>([]);
  const [productFilter, setProductFilter] = useState<PickedProduct[]>([]);
  // Map<orderId, order> — stores full order data so selection survives filter changes
  const [selectedOrdersMap, setSelectedOrdersMap] = useState<Map<string, any>>(new Map());
  const selectedOrderIds = useMemo(() => new Set(selectedOrdersMap.keys()), [selectedOrdersMap]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showSelectedDialog, setShowSelectedDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleteOrderNumber, setDeleteOrderNumber] = useState<string>("");



  const hasActiveFilters = Boolean(
    search ||
    statusFilter.length > 0 ||
    paymentFilter.length > 0 ||
    dateFrom ||
    dateTo ||
    locDivisionIds.length > 0 ||
    locThanaIds.length > 0 ||
    productFilter.length > 0
  );
  const [visibleLimit, setVisibleLimit] = useState<number>(100);

  // Reset only the visible limit when filters change — selection persists across searches/filters
  useEffect(() => {
    setVisibleLimit(100);
  }, [search, statusFilter, paymentFilter, dateFrom, dateTo, locDivisionIds, locThanaIds, locationMode, productFilter]);

  const { data: stats, isLoading: statsLoading } = useOrderStats();
  const { data: ordersRaw, isLoading: ordersLoading } = useOrders({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    paymentStatus: paymentFilter.length > 0 ? paymentFilter : undefined,
    search: search || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString() : undefined,
    includeDivisionIds: locationMode === "include" ? locDivisionIds : undefined,
    excludeDivisionIds: locationMode === "exclude" ? locDivisionIds : undefined,
    includeThanaIds: locationMode === "include" ? locThanaIds : undefined,
    excludeThanaIds: locationMode === "exclude" ? locThanaIds : undefined,
    limit: hasActiveFilters ? null : visibleLimit,
  });

  // Client-side product filter (preserves all existing query logic)
  const orders = useMemo(() => {
    if (!ordersRaw) return ordersRaw;
    if (productFilter.length === 0) return ordersRaw;
    const ids = new Set(productFilter.map(p => p.id));
    return ordersRaw.filter((o: any) =>
      (o.items || []).some((it: any) => it.product_id && ids.has(it.product_id))
    );
  }, [ordersRaw, productFilter]);
  const deleteOrder = useDeleteOrder();
  const syncAllSteadfast = useSyncSteadfastStatus();
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);

  const handleSyncAllSteadfast = async () => {
    try {
      // Sync across the entire orders DB, only orders not in a final state
      const { data, error } = await supabase
        .from("orders")
        .select("id, tracking_number, consignment_id, order_status")
        .or("tracking_number.not.is.null,consignment_id.not.is.null");
      if (error) throw error;
      const FINAL = new Set(["delivered", "cancelled", "returned", "refunded", "rto"]);
      const ids = (data || [])
        .filter((o: any) => (o.tracking_number || o.consignment_id) && !FINAL.has(o.order_status))
        .map((o: any) => o.id);
      if (ids.length === 0) {
        toast.message("No shipped orders to sync");
        return;
      }
      const CHUNK = 20;
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

      let updated = 0;
      let failed = 0;
      let processed = 0;
      setSyncProgress({ done: 0, total: ids.length });
      const loadingId = toast.loading(`Syncing 0/${ids.length} orders…`);

      for (const chunk of chunks) {
        try {
          const data: any = await syncAllSteadfast.mutateAsync(chunk);
          const results = (data?.results || []) as Array<{ mapped_status?: string }>;
          updated += results.filter(r => r.mapped_status).length;
        } catch (e) {
          console.error("[Sync chunk failed]", e);
          failed += chunk.length;
        }
        processed += chunk.length;
        setSyncProgress({ done: processed, total: ids.length });
        toast.loading(`Syncing ${processed}/${ids.length} orders…`, { id: loadingId });
      }

      toast.dismiss(loadingId);
      if (updated > 0) toast.success(`${updated} order(s) synced${failed ? ` (${failed} failed)` : ""}`);
      else if (failed > 0) toast.error(`Sync failed for ${failed} order(s)`);
      else toast.message("Status unchanged");
      setSyncProgress(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders for sync");
      setSyncProgress(null);
    }
  };



  // Helper: which orders does an action target — selected ones if any, otherwise all visible
  const getTargetOrders = (): any[] => {
    if (selectedOrdersMap.size > 0) return Array.from(selectedOrdersMap.values());
    return (orders as any[]) || [];
  };

  const handleDownloadPdf = async () => {
    const targets = getTargetOrders();
    if (targets.length === 0) {
      toast.error("No orders to download");
      return;
    }
    setDownloadingPdf(true);
    try {
      await generatePackingListPdf(targets);
      toast.success(`Packing list for ${targets.length} order(s) downloaded`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const toggleSelectOrder = (order: any) => {
    setSelectedOrdersMap((prev) => {
      const next = new Map(prev);
      if (next.has(order.id)) next.delete(order.id);
      else next.set(order.id, order);
      return next;
    });
  };

  const removeFromSelection = (id: string) => {
    setSelectedOrdersMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedOrdersMap(new Map());

  const toggleSelectAllVisible = () => {
    if (!orders) return;
    const visible = orders as any[];
    const allSelected = visible.length > 0 && visible.every((o) => selectedOrdersMap.has(o.id));
    setSelectedOrdersMap((prev) => {
      const next = new Map(prev);
      if (allSelected) {
        visible.forEach((o) => next.delete(o.id));
      } else {
        visible.forEach((o) => next.set(o.id, o));
      }
      return next;
    });
  };

  const handleDownloadCsv = () => {
    const targets = getTargetOrders();
    if (targets.length === 0) {
      toast.error("No orders to export");
      return;
    }
    try {
      downloadOrdersCsv(targets);
      toast.success(`CSV exported (${targets.length})`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV");
    }
  };

  const handleDownloadReportPdf = () => {
    const targets = getTargetOrders();
    if (targets.length === 0) {
      toast.error("No orders to export");
      return;
    }
    setDownloadingReport(true);
    try {
      generateOrdersReportPdf(targets);
      toast.success(`Report PDF downloaded (${targets.length})`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setDownloadingReport(false);
    }
  };


  const handleDeleteClick = (orderId: string, orderNumber: string, _paidAmount: number, _paymentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteOrderId(orderId);
    setDeleteOrderNumber(orderNumber);
  };


  const confirmDelete = () => {
    if (deleteOrderId) {
      deleteOrder.mutate(deleteOrderId, {
        onSuccess: () => {
          setDeleteOrderId(null);
          setDeleteOrderNumber("");
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders and fulfillment</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center justify-end">
          <Button
            variant={selectionMode ? "default" : "outline"}
            onClick={() => setSelectionMode((m) => !m)}
            title="Toggle order selection mode"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Select{selectedOrdersMap.size > 0 ? ` (${selectedOrdersMap.size})` : ''}
          </Button>
          {selectionMode && orders && orders.length > 0 && (
            <Button
              variant="ghost"
              onClick={toggleSelectAllVisible}
              title="Select / deselect all visible orders"
            >
              {orders.every((o: any) => selectedOrdersMap.has(o.id)) ? 'Deselect page' : 'Select page'}
            </Button>
          )}
          {selectedOrdersMap.size > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowSelectedDialog(true)}
              >
                <ListChecks className="h-4 w-4 mr-2" />
                Show selected ({selectedOrdersMap.size})
              </Button>
              <Button variant="ghost" onClick={clearSelection}>
                Clear
              </Button>
            </>
          )}
          <Button
            onClick={handleSyncAllSteadfast}
            disabled={syncAllSteadfast.isPending || ordersLoading || !!syncProgress}
            variant="outline"
          >
            {syncAllSteadfast.isPending || syncProgress ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {syncProgress ? `Syncing ${syncProgress.done}/${syncProgress.total}` : "Sync Steadfast"}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={downloadingPdf || ordersLoading} variant="outline">
            {downloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Packing PDF{selectedOrdersMap.size > 0 ? ` (${selectedOrdersMap.size})` : ''}
          </Button>
          <Button onClick={handleDownloadCsv} disabled={ordersLoading} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV Report{selectedOrdersMap.size > 0 ? ` (${selectedOrdersMap.size})` : ''}
          </Button>
          <Button onClick={handleDownloadReportPdf} disabled={downloadingReport || ordersLoading} variant="outline">
            {downloadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            PDF Report{selectedOrdersMap.size > 0 ? ` (${selectedOrdersMap.size})` : ''}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 border border-border">
          <Package className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalOrders || 0}
          </p>
          <p className="text-sm text-muted-foreground">Total Orders</p>
        </div>
        <div className="p-4 border border-border">
          <TrendingUp className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.todayOrders || 0}
          </p>
          <p className="text-sm text-muted-foreground">Today's Orders</p>
        </div>
        <div className="p-4 border border-border">
          <Package className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : formatCurrency(stats?.todayOrderAmount || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Today's Order Amount</p>
        </div>
        <div className="p-4 border border-border">
          <CreditCard className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : formatCurrency(stats?.todayRevenue || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Today's Revenue</p>
        </div>
        <div className="p-4 border border-border">
          <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
          <p className="text-2xl font-medium text-green-700">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : formatCurrency(stats?.totalRevenue || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Status Breakdown</p>
        {statsLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {ALLOWED_ORDER_STATUSES
              .filter((s) => (stats?.byStatus?.[s]?.count || 0) > 0)
              .map((s) => {
                const row = stats!.byStatus![s];
                return (
                  <div key={s} className="border border-border p-2 flex flex-col gap-0.5">
                    <Badge className={`${orderStatusColors[s]} text-[10px] px-1.5 py-0 self-start`} variant="outline">
                      {ORDER_STATUS_LABELS[s]}
                    </Badge>
                    <p className="text-sm font-semibold">{row.count} order{row.count !== 1 ? 's' : ''}</p>
                    <p className="text-[11px] text-muted-foreground">{formatCurrency(row.amount)}</p>
                  </div>
                );
              })}
            {ALLOWED_ORDER_STATUSES.every((s) => (stats?.byStatus?.[s]?.count || 0) === 0) && (
              <p className="col-span-full text-xs text-muted-foreground">No orders yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Filters */}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <MultiSelectFilter
          label="Order Status"
          options={ALLOWED_ORDER_STATUSES.map(s => ({ value: s, label: ORDER_STATUS_LABELS[s] }))}
          values={statusFilter}
          onChange={(vals) => setStatusFilter(vals as OrderStatus[])}
          width="w-[180px]"
        />
        <MultiSelectFilter
          label="Payment Status"
          options={[
            { value: "unpaid", label: PAYMENT_STATUS_LABELS.unpaid },
            { value: "pending_verification", label: PAYMENT_STATUS_LABELS.pending_verification },
            { value: "paid", label: PAYMENT_STATUS_LABELS.paid },
            { value: "partially_paid", label: PAYMENT_STATUS_LABELS.partially_paid },
            { value: "failed", label: PAYMENT_STATUS_LABELS.failed },
            { value: "refunded", label: PAYMENT_STATUS_LABELS.refunded },
            { value: "partially_refunded", label: PAYMENT_STATUS_LABELS.partially_refunded },
          ]}
          values={paymentFilter}
          onChange={(vals) => setPaymentFilter(vals as PaymentStatus[])}
          width="w-[180px]"
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
            placeholder="From"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
            placeholder="To"
          />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Clear
            </Button>
          )}
        </div>
        <OrderLocationFilter
          divisionIds={locDivisionIds}
          thanaIds={locThanaIds}
          mode={locationMode}
          onDivisionChange={setLocDivisionIds}
          onThanaChange={setLocThanaIds}
          onModeChange={setLocationMode}
        />
        <ProductMultiSelectFilter
          values={productFilter}
          onChange={setProductFilter}
        />
      </div>





      {/* Orders Grid */}
      {ordersLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="border border-border p-12 text-center text-muted-foreground">
          No orders found
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {orders?.map((order) => {
            const items = (order.items || []) as any[];
            const itemImages = items.map((it) => {
              const imgs = it?.product?.product_images || [];
              const main = imgs.find((i: any) => i.is_main) || imgs.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
              return { url: main?.image_url as string | undefined, name: it.product_name as string, qty: it.quantity as number };
            });
            const paidAmount = (order as any).paid_amount ?? 0;
            const remaining = order.total_amount - paidAmount;
            const itemCount = items.length;
            // Choose grid cols for the inner image collage
            const innerCols = itemCount <= 1 ? 1 : itemCount === 2 ? 2 : itemCount <= 4 ? 2 : 3;

            const isSelected = selectedOrderIds.has(order.id);
            return (
              <div
                key={order.id}
                className={`relative border bg-card flex flex-col overflow-hidden hover:shadow-md transition-shadow ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
              >
                {/* Images collage */}
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className="relative aspect-square w-full bg-muted overflow-hidden"
                >
                  {itemImages.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Package className="h-8 w-8" />
                    </div>
                  ) : (
                    <div
                      className="grid h-full w-full gap-px"
                      style={{ gridTemplateColumns: `repeat(${innerCols}, minmax(0, 1fr))` }}
                    >
                      {itemImages.map((im, idx) => (
                        <div key={idx} className="relative bg-muted overflow-hidden">
                          {im.url ? (
                            <img
                              src={im.url}
                              alt={im.name}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          {im.qty > 1 && (
                            <span className="absolute bottom-0.5 right-0.5 bg-foreground/80 text-background text-[9px] leading-none px-1 py-0.5 rounded-sm">
                              ×{im.qty}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {order.risk_level !== 'low' && (
                    <span className="absolute top-1 left-1">
                      <Badge className={`${riskColors[order.risk_level]} text-[10px] px-1.5 py-0`} variant="outline">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        {order.risk_level}
                      </Badge>
                    </span>
                  )}
                </button>

                {/* Selection checkbox overlay (only in selection mode) */}
                {selectionMode && (
                  <div
                    className="absolute top-1 right-1 z-10 bg-background/90 border border-border rounded-sm p-1 cursor-pointer hover:bg-background"
                    onClick={(e) => { e.stopPropagation(); toggleSelectOrder(order); }}
                    title={isSelected ? 'Deselect order' : 'Select order'}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  </div>
                )}


                {/* Details */}
                <div className="p-1.5 flex flex-col gap-1 text-xs flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold truncate" title={order.order_number}>{order.order_number}</span>
                    <span className="text-muted-foreground text-[10px] shrink-0">
                      {format(new Date(order.created_at), 'MMM d')}
                    </span>
                  </div>

                  <div className="truncate font-medium text-[11px]" title={order.customer?.name || order.shipping_name || ''}>
                    {order.customer?.name || order.shipping_name}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-bold text-[13px] text-foreground" title={order.customer?.phone || order.shipping_phone || ''}>
                      {order.customer?.phone || order.shipping_phone}
                    </span>
                    <CallCustomerButton order={order as any} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[11px] ${paidAmount > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      Paid: {formatCurrency(paidAmount)}
                    </span>
                    {remaining > 0 && (
                      <span className="text-[11px] text-destructive font-medium">Due: {formatCurrency(remaining)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge className={`${orderStatusColors[order.order_status]} text-[10px] px-1.5 py-0`} variant="outline">
                      {ORDER_STATUS_LABELS[order.order_status] || order.order_status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`${paymentStatusColors[order.payment_status]} text-[10px] px-1.5 py-0`} variant="outline">
                      {order.payment_status.replace('_', ' ')}
                    </Badge>
                    {(order as any).fulfillment_issue && (
                      <Badge className="bg-red-700 hover:bg-red-700 text-white border-red-700 text-[10px] px-1.5 py-0">
                        {({ stock_out: 'Stock Out', print_issues: 'Print Issues', courier_issues: 'Courier Issues', other_issues: 'Others Issues' } as Record<string, string>)[(order as any).fulfillment_issue]}
                      </Badge>
                    )}
                    {(() => {
                      const src = (order as any).created_by_source;
                      const isAdmin = src === 'admin';
                      return (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${isAdmin ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-muted-foreground border-border'}`}
                        >
                          {isAdmin ? 'Admin Order' : 'Web Order'}
                        </Badge>
                      );
                    })()}
                  </div>

                  {order.customer_notes && (
                    <div
                      className="text-[10px] text-muted-foreground line-clamp-2 italic"
                      title={order.customer_notes}
                    >
                      Note: {order.customer_notes}
                    </div>
                  )}

                  <div className="text-[10px] text-muted-foreground truncate">
                    {order.payment_method?.name || 'Unknown'}
                  </div>


                  {(() => {
                    const div = order.shipping_division?.name?.trim().toLowerCase();
                    const isInside = div === "dhaka city" || div === "dhaka sub-urban";
                    const label = isInside ? "Inside Dhaka" : "Outside Dhaka";
                    return (
                      <div className={`text-[11px] font-medium truncate ${isInside ? 'text-emerald-600' : 'text-amber-600'}`}>
                        Location: {label}
                      </div>
                    );
                  })()}

                  {/* Ship / Parcel */}
                  <div className="pt-0.5 border-t border-border">
                    <ParcelIdCell order={order as any} />
                  </div>


                  {/* Call center notes */}
                  <div className="pt-0.5 border-t border-border">
                    <CallNotesEditor order={order as any} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 mt-auto pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSelectedOrderId(order.id)}
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(order.id, order.order_number, paidAmount, order.payment_status, e)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more (only when no filters are active) */}
      {!hasActiveFilters && orders && orders.length >= visibleLimit && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setVisibleLimit((n) => (n >= 500 ? 100000 : n + 200))}
            disabled={ordersLoading}
          >
            {ordersLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Load more orders
          </Button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          open={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order <strong>{deleteOrderNumber}</strong>? 
              This will permanently remove the order, all items, payment records, and history. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>




      {/* Selected Orders Review Dialog */}
      <Dialog open={showSelectedDialog} onOpenChange={setShowSelectedDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Selected Orders ({selectedOrdersMap.size})
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 pb-2 border-b">
            <Button size="sm" onClick={handleDownloadPdf} disabled={downloadingPdf || selectedOrdersMap.size === 0}>
              {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
              Packing PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadCsv} disabled={selectedOrdersMap.size === 0}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
              CSV Report
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadReportPdf} disabled={downloadingReport || selectedOrdersMap.size === 0}>
              {downloadingReport ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-2" />}
              PDF Report
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection} className="ml-auto">
              Clear all
            </Button>
          </div>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            {selectedOrdersMap.size === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders selected.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(selectedOrdersMap.values()).map((o: any) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => { setSelectedOrderId(o.id); setShowSelectedDialog(false); }}>
                      <TableCell><Checkbox checked className="pointer-events-none" /></TableCell>
                      <TableCell className="font-medium">{o.order_number}</TableCell>
                      <TableCell className="text-xs">{format(new Date(o.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="truncate max-w-[160px]">{o.customer?.name || o.shipping_name}</TableCell>
                      <TableCell className="text-xs">{o.customer?.phone || o.shipping_phone}</TableCell>
                      <TableCell className="text-right">{formatCurrency(o.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {ORDER_STATUS_LABELS[o.order_status as OrderStatus] || o.order_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {PAYMENT_STATUS_LABELS[o.payment_status as PaymentStatus] || o.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); removeFromSelection(o.id); }}
                          title="Remove from selection"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectedDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
