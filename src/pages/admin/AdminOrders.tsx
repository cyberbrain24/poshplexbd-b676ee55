import { useState } from "react";
import { useOrders, useOrderStats, OrderStatus, PaymentStatus } from "@/hooks/useOrders";
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
  Package, 
  Search, 
  Clock, 
  CreditCard, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Truck,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import { useCreateShipment, STEADFAST_STATUS_MAP, useTrackShipment } from "@/hooks/useSteadfast";

// Courier status component for each order row
const CourierStatusCell = ({ order }: { order: { id: string; tracking_number: string | null; courier_name: string | null } }) => {
  const createShipment = useCreateShipment();
  const { data: trackingData, isLoading: trackingLoading } = useTrackShipment(order.tracking_number || undefined);

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

  const deliveryStatus = trackingData?.delivery_status || "pending";
  const statusInfo = STEADFAST_STATUS_MAP[deliveryStatus] || STEADFAST_STATUS_MAP["unknown"];

  const colorClasses: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    orange: "bg-orange-100 text-orange-800",
    purple: "bg-purple-100 text-purple-800",
    teal: "bg-teal-100 text-teal-800",
    gray: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge className={colorClasses[statusInfo.color] || "bg-gray-100 text-gray-800"} variant="outline">
        {trackingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : statusInfo.label}
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

  const { data: stats, isLoading: statsLoading } = useOrderStats();
  const { data: orders, isLoading: ordersLoading } = useOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    paymentStatus: paymentFilter !== "all" ? paymentFilter : undefined,
    search: search || undefined,
  });

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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
          <CreditCard className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-medium">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : `৳${(stats?.todayRevenue || 0).toLocaleString()}`}
          </p>
          <p className="text-sm text-muted-foreground">Today's Revenue</p>
        </div>
        <div className="p-4 border border-border bg-yellow-50">
          <Clock className="h-5 w-5 text-yellow-600 mb-2" />
          <p className="text-2xl font-medium text-yellow-700">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pendingVerification || 0}
          </p>
          <p className="text-sm text-yellow-600">Pending Verification</p>
        </div>
        <div className="p-4 border border-border bg-blue-50">
          <Package className="h-5 w-5 text-blue-600 mb-2" />
          <p className="text-2xl font-medium text-blue-700">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.pendingFulfillment || 0}
          </p>
          <p className="text-sm text-blue-600">To Fulfill</p>
        </div>
        <div className="p-4 border border-border">
          <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
          <p className="text-2xl font-medium text-green-700">
            {statsLoading ? <Skeleton className="h-8 w-16" /> : `৳${(stats?.totalRevenue || 0).toLocaleString()}`}
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
                  {Array.from({ length: 11 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
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
                    <div className="font-medium">{order.shipping_name}</div>
                    <div className="text-xs text-muted-foreground">{order.shipping_phone}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{order.items?.length || 0} items</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">৳{order.total_amount.toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const paidAmount = (order as any).paid_amount ?? 0;
                      const remaining = order.total_amount - paidAmount;
                      return (
                        <div className="flex flex-col">
                          <span className={`font-medium ${paidAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            ৳{paidAmount.toLocaleString()}
                          </span>
                          {remaining > 0 && (
                            <span className="text-xs text-destructive">
                              Due: ৳{remaining.toLocaleString()}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
    </div>
  );
};

export default AdminOrders;
