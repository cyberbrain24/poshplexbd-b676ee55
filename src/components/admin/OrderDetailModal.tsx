import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useOrder, 
  useOrderHistory, 
  useUpdateOrderStatus, 
  useUpdatePaymentStatus,
  useUpdateItemFulfillment,
  OrderStatus,
  PaymentStatus,
  ItemFulfillmentStatus 
} from "@/hooks/useOrders";
import { format } from "date-fns";
import { 
  Package, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  AlertTriangle,
  Truck,
  CheckCircle,
  XCircle,
  Image as ImageIcon
} from "lucide-react";

interface OrderDetailModalProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

const statusOptions: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 
  'partially_delivered', 'returned', 'cancelled', 'failed', 'rto'
];

const paymentOptions: PaymentStatus[] = [
  'unpaid', 'pending_verification', 'paid', 'partially_paid',
  'partially_refunded', 'refunded', 'failed'
];

const itemStatusOptions: ItemFulfillmentStatus[] = [
  'pending', 'reserved', 'shipped', 'delivered', 
  'out_of_stock', 'returned', 'cancelled'
];

const OrderDetailModal = ({ orderId, open, onClose }: OrderDetailModalProps) => {
  const { data: order, isLoading } = useOrder(orderId);
  const { data: history } = useOrderHistory(orderId);
  const updateOrderStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const updateItemFulfillment = useUpdateItemFulfillment();
  
  const [statusNote, setStatusNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | "">("");

  const handleUpdateOrderStatus = () => {
    if (!selectedStatus || !order) return;
    updateOrderStatus.mutate({
      orderId: order.id,
      status: selectedStatus,
      notes: statusNote,
    });
    setStatusNote("");
    setSelectedStatus("");
  };

  const handleUpdatePaymentStatus = () => {
    if (!selectedPaymentStatus || !order) return;
    updatePaymentStatus.mutate({
      orderId: order.id,
      status: selectedPaymentStatus,
      notes: statusNote,
    });
    setStatusNote("");
    setSelectedPaymentStatus("");
  };

  const handleUpdateItemStatus = (itemId: string, status: ItemFulfillmentStatus) => {
    if (!order) return;
    updateItemFulfillment.mutate({
      itemId,
      orderId: order.id,
      status,
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Skeleton className="h-6 w-48" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <span>Order {order.order_number}</span>
            {order.risk_level !== 'low' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {order.risk_level} risk
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="border border-border p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Shipping Details
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{order.shipping_name}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {order.shipping_phone}
                </p>
                {order.shipping_email && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" /> {order.shipping_email}
                  </p>
                )}
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5" /> {order.shipping_address}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border border-border p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span>{order.payment_method?.name || 'Unknown'}</span>
                </div>
                {order.transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono">{order.transaction_id}</span>
                  </div>
                )}
                {order.sender_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sender Number:</span>
                    <span>{order.sender_number}</span>
                  </div>
                )}
                {order.payment_proof_url && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-xs">Payment Proof:</span>
                    <a 
                      href={order.payment_proof_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline text-sm mt-1"
                    >
                      <ImageIcon className="h-3 w-3" /> View Proof
                    </a>
                  </div>
                )}
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>৳{order.subtotal.toLocaleString()}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-৳{order.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>৳{order.shipping_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total:</span>
                  <span>৳{order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Risk Flags */}
            {order.risk_flags && order.risk_flags.length > 0 && (
              <div className="border border-red-200 bg-red-50 p-4 space-y-2">
                <h3 className="font-medium flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" /> Risk Flags
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {order.risk_flags.map((flag, i) => (
                    <li key={i}>• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="border border-border p-4 space-y-4">
              <h3 className="font-medium">Update Status</h3>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select 
                    value={selectedStatus} 
                    onValueChange={(v) => setSelectedStatus(v as OrderStatus)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Order Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>
                          {s.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleUpdateOrderStatus}
                    disabled={!selectedStatus || updateOrderStatus.isPending}
                  >
                    Update
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Select 
                    value={selectedPaymentStatus} 
                    onValueChange={(v) => setSelectedPaymentStatus(v as PaymentStatus)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map(s => (
                        <SelectItem key={s} value={s}>
                          {s.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleUpdatePaymentStatus}
                    disabled={!selectedPaymentStatus || updatePaymentStatus.isPending}
                  >
                    Update
                  </Button>
                </div>

                <Textarea
                  placeholder="Add a note about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-border p-4 space-y-3">
              <h3 className="font-medium">Order Items ({order.items?.length || 0})</h3>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.variant_sku || 'N/A'} • Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        ৳{item.line_total.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Select
                        value={item.fulfillment_status}
                        onValueChange={(v) => handleUpdateItemStatus(item.id, v as ItemFulfillmentStatus)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {itemStatusOptions.map(s => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 border border-border p-4">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" /> Order Timeline
          </h3>
          <div className="space-y-3">
            {history?.map((event, i) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    event.status_type === 'payment' ? 'bg-green-500' : 
                    event.status_type === 'order' ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                  {i < (history?.length || 0) - 1 && (
                    <div className="w-0.5 h-full bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <p className="text-sm font-medium">
                    {event.status_type}: {event.new_status.replace('_', ' ')}
                  </p>
                  {event.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Order Created</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Info */}
        {order.tracking_number && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium flex items-center gap-2 text-blue-800">
              <Truck className="h-4 w-4" /> Tracking Information
            </h4>
            <p className="text-sm mt-1">
              <span className="text-blue-600">Courier:</span> {order.courier_name}
            </p>
            <p className="text-sm">
              <span className="text-blue-600">Tracking #:</span> {order.tracking_number}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
