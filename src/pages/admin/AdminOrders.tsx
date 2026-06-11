import { useState } from "react";
import { useOrders, useOrderStats, useDeleteOrder, useMarkOrderCalled, useUpdateCallCenterNotes, OrderStatus, PaymentStatus } from "@/hooks/useOrders";
import { ORDER_STATUS_LABELS, ALLOWED_ORDER_STATUSES } from "@/constants";
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
  Save
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import OrderLocationFilter from "@/components/admin/OrderLocationFilter";
import { useCreateShipment, useResetShipping, useSyncSteadfastStatus } from "@/hooks/useSteadfast";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generatePackingListPdf } from "@/lib/orderPackingPdf";

// Parcel ID cell component - simplified, no auto-fetch
const ParcelIdCell = ({ order }: { order: { id: string; consignment_id: string | null; tracking_number: string | null } }) => {
  const resetShipping = useResetShipping();

  // If no consignment_id, show dash
  if (!order.consignment_id) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-muted-foreground">{order.consignment_id}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          resetShipping.mutate(order.id);
        }}
        disabled={resetShipping.isPending}
        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
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
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [locationMode, setLocationMode] = useState<"include" | "exclude">("include");
  const [locDivisionIds, setLocDivisionIds] = useState<string[]>([]);
  const [locThanaIds, setLocThanaIds] = useState<string[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleteOrderNumber, setDeleteOrderNumber] = useState<string>("");
  const [blockedTransactions, setBlockedTransactions] = useState<{
    orderNumber: string;
    payments: Array<{
      id: string;
      amount: number;
      payment_reference: string | null;
      recorded_at: string;
      transaction_id: string | null;
      account?: { name: string } | null;
    }>;
    paidAmount: number;
    paymentStatus: string;
  } | null>(null);
  const [checkingPayments, setCheckingPayments] = useState(false);

  const { data: stats, isLoading: statsLoading } = useOrderStats();
  const { data: orders, isLoading: ordersLoading } = useOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    paymentStatus: paymentFilter !== "all" ? paymentFilter : undefined,
    search: search || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)).toISOString() : undefined,
    includeDivisionIds: locationMode === "include" ? locDivisionIds : undefined,
    excludeDivisionIds: locationMode === "exclude" ? locDivisionIds : undefined,
    includeThanaIds: locationMode === "include" ? locThanaIds : undefined,
    excludeThanaIds: locationMode === "exclude" ? locThanaIds : undefined,
  });
  const deleteOrder = useDeleteOrder();
  const syncAllSteadfast = useSyncSteadfastStatus();

  const handleSyncAllSteadfast = () => {
    const ids = (orders || [])
      .filter((o: any) => o.tracking_number || o.consignment_id)
      .map((o: any) => o.id);
    if (ids.length === 0) {
      toast.message("No shipped orders in current view to sync");
      return;
    }
    syncAllSteadfast.mutate(ids);
  };

  const handleDownloadPdf = async () => {
    if (!orders || orders.length === 0) {
      toast.error("No orders to download");
      return;
    }
    setDownloadingPdf(true);
    try {
      await generatePackingListPdf(orders);
      toast.success("Packing list downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDeleteClick = async (orderId: string, orderNumber: string, paidAmount: number, paymentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckingPayments(true);

    try {
      // Check if order has linked payment transactions
      const { data: payments, error } = await supabase
        .from("order_payments")
        .select("id, amount, payment_reference, recorded_at, transaction_id, account:accounts(name)")
        .eq("order_id", orderId);

      if (error) throw error;

      const linkedPayments = (payments || []).filter(p => p.transaction_id);

      if (linkedPayments.length > 0) {
        // Block deletion - show transaction info
        setBlockedTransactions({
          orderNumber,
          payments: linkedPayments as any,
          paidAmount,
          paymentStatus,
        });
      } else {
        // Allow deletion
        setDeleteOrderId(orderId);
        setDeleteOrderNumber(orderNumber);
      }
    } catch {
      toast.error("Failed to check payment records");
    } finally {
      setCheckingPayments(false);
    }
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
        <div className="flex gap-2">
          <Button
            onClick={handleSyncAllSteadfast}
            disabled={syncAllSteadfast.isPending || ordersLoading}
            variant="outline"
          >
            {syncAllSteadfast.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Steadfast
          </Button>
          <Button onClick={handleDownloadPdf} disabled={downloadingPdf || ordersLoading} variant="outline">
            {downloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Packing PDF
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALLOWED_ORDER_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="pending_verification">Pending Verification</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      {/* Orders Grid */}
      {ordersLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : orders?.length === 0 ? (
        <div className="border border-border p-12 text-center text-muted-foreground">
          No orders found
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
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

            return (
              <div
                key={order.id}
                className="border border-border bg-card flex flex-col overflow-hidden hover:shadow-md transition-shadow"
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

                {/* Details */}
                <div className="p-2 flex flex-col gap-1.5 text-xs flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold truncate" title={order.order_number}>{order.order_number}</span>
                    <span className="text-muted-foreground text-[10px] shrink-0">
                      {format(new Date(order.created_at), 'MMM d')}
                    </span>
                  </div>

                  <div className="truncate font-medium" title={order.customer?.name || order.shipping_name || ''}>
                    {order.customer?.name || order.shipping_name}
                  </div>
                  <div className="flex items-center justify-between gap-1 text-muted-foreground text-[11px]">
                    <span className="truncate" title={order.customer?.phone || order.shipping_phone || ''}>
                      {order.customer?.phone || order.shipping_phone}
                    </span>
                    <CallCustomerButton order={order as any} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className={`text-[11px] ${paidAmount > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                      Paid: {formatCurrency(paidAmount)}
                    </span>
                    {remaining > 0 && (
                      <span className="text-[11px] text-destructive">Due: {formatCurrency(remaining)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge className={`${orderStatusColors[order.order_status]} text-[10px] px-1.5 py-0`} variant="outline">
                      {ORDER_STATUS_LABELS[order.order_status] || order.order_status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`${paymentStatusColors[order.payment_status]} text-[10px] px-1.5 py-0`} variant="outline">
                      {order.payment_status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="text-[10px] text-muted-foreground truncate">
                    {order.payment_method?.name || 'Unknown'}
                  </div>

                  {(() => {
                    const div = order.shipping_division?.name?.trim().toLowerCase();
                    const label = (div === "dhaka city" || div === "dhaka sub-urban") ? "Inside Dhaka" : "Outside Dhaka";
                    return (
                      <div className="text-[11px] font-medium text-purple-600 truncate">
                        Location: {label}
                      </div>
                    );
                  })()}

                  {/* Parcel + Courier */}
                  <div className="space-y-1 pt-1 border-t border-border">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground">Parcel:</span>
                      <ParcelIdCell order={order as any} />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground">Courier:</span>
                      <CourierStatusCell order={order} />
                    </div>
                  </div>

                  {/* Call center notes */}
                  <div className="pt-1 border-t border-border">
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
                      disabled={checkingPayments}
                      onClick={(e) => handleDeleteClick(order.id, order.order_number, paidAmount, order.payment_status, e)}
                      title="Delete"
                    >
                      {checkingPayments ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* Blocked Deletion - Transaction History Notification */}
      <Dialog open={!!blockedTransactions} onOpenChange={() => setBlockedTransactions(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Deletion Blocked
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Order <strong>{blockedTransactions?.orderNumber}</strong> cannot be deleted because it has recorded transactions linked to the accounts system.
            </p>

            <div className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid Amount:</span>
                <span className="font-medium text-green-600">{formatCurrency(blockedTransactions?.paidAmount ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge variant="outline" className="capitalize">{blockedTransactions?.paymentStatus?.replace('_', ' ')}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Linked Transactions
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {blockedTransactions?.payments.map((payment) => (
                  <div key={payment.id} className="border border-border rounded-md p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono text-xs">{payment.transaction_id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account:</span>
                      <span>{(payment.account as any)?.name || '—'}</span>
                    </div>
                    {payment.payment_reference && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference:</span>
                        <span>{payment.payment_reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{format(new Date(payment.recorded_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              To delete this order, first remove the associated payment records and transactions from the Accounts module.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockedTransactions(null)}>
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
