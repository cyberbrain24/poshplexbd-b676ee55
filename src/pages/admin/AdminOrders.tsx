import { useState } from "react";
import { useOrders, useOrderStats, useDeleteOrder, OrderStatus, PaymentStatus } from "@/hooks/useOrders";
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
  Banknote
} from "lucide-react";
import { format } from "date-fns";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import { useCreateShipment, useResetShipping } from "@/hooks/useSteadfast";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// Courier status component - simplified, shows Ship button or tracking number only
const CourierStatusCell = ({ order }: { order: { id: string; tracking_number: string | null; courier_name: string | null } }) => {
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
    <div className="flex flex-col gap-1">
      <Badge className="bg-blue-100 text-blue-800" variant="outline">
        {order.courier_name || "Steadfast"}
      </Badge>
      <span className="text-xs text-muted-foreground font-mono">{order.tracking_number}</span>
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
  });
  const deleteOrder = useDeleteOrder();

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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
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
      </div>

      {/* Orders Table */}
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Parcel ID</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 12 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.payment_method?.name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {order.customer?.name || order.shipping_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.customer?.phone || order.shipping_phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{order.items?.length || 0} items</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const paidAmount = (order as any).paid_amount ?? 0;
                      const remaining = order.total_amount - paidAmount;
                      return (
                        <div className="flex flex-col">
                          <span className={`font-medium ${paidAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {formatCurrency(paidAmount)}
                          </span>
                          {remaining > 0 && (
                            <span className="text-xs text-destructive">
                              Due: {formatCurrency(remaining)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge className={orderStatusColors[order.order_status]} variant="outline">
                      {order.order_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[order.payment_status]} variant="outline">
                      {order.payment_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ParcelIdCell order={order as any} />
                  </TableCell>
                  <TableCell>
                    <CourierStatusCell order={order} />
                  </TableCell>
                  <TableCell>
                    {order.risk_level !== 'low' && (
                      <Badge className={riskColors[order.risk_level]} variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {order.risk_level}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={checkingPayments}
                        onClick={(e) => handleDeleteClick(order.id, order.order_number, (order as any).paid_amount ?? 0, order.payment_status, e)}
                      >
                        {checkingPayments ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
