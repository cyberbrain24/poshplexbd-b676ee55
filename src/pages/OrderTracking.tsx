import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Search,
  RotateCcw,
  AlertCircle,
  History
} from "lucide-react";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTrackOrder } from "@/hooks/useCheckout";
import { format } from "date-fns";

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const getStatusIndex = (status: string) => {
  const index = statusSteps.findIndex(s => s.key === status);
  if (status === 'cancelled' || status === 'failed' || status === 'rto') return -1;
  return index >= 0 ? index : 0;
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case 'pending_verification':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending Verification</Badge>;
    case 'unpaid':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unpaid (COD)</Badge>;
    case 'partially_paid':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Partially Paid</Badge>;
    case 'refunded':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Refunded</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getItemStatusBadge = (status: string) => {
  switch (status) {
    case 'delivered':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
    case 'shipped':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Shipped</Badge>;
    case 'reserved':
    case 'pending':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Processing</Badge>;
    case 'out_of_stock':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
    case 'returned':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Returned</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const trackOrderMutation = useTrackOrder();
  
  const [query, setQuery] = useState(searchParams.get('orderNumber') || searchParams.get('phone') || searchParams.get('email') || '');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const detectType = (input: string): { orderNumber?: string; phone?: string; email?: string } => {
    const trimmed = input.trim();
    if (/^PO-/i.test(trimmed)) return { orderNumber: trimmed };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { email: trimmed };
    if (/^[\d+\-() ]{7,15}$/.test(trimmed)) return { phone: trimmed };
    // fallback: treat as order number
    return { orderNumber: trimmed };
  };

  useEffect(() => {
    const initial = searchParams.get('orderNumber') || searchParams.get('phone') || searchParams.get('email');
    if (initial) handleTrackOrder(initial);
  }, []);

  const handleTrackOrder = async (input?: string) => {
    const searchInput = (input ?? query).trim();
    if (!searchInput) return;

    setHasSearched(true);
    setSelectedOrder(null);
    
    try {
      const params = detectType(searchInput);
      const result = await trackOrderMutation.mutateAsync(params);
      
      // Handle single or multiple results
      if (Array.isArray(result)) {
        setOrders(result);
        if (result.length === 1) {
          setSelectedOrder(result[0]);
        }
      } else {
        setOrders([result]);
        setSelectedOrder(result);
      }
    } catch (error) {
      setOrders([]);
      setSelectedOrder(null);
    }
  };

  const currentStatusIndex = selectedOrder ? getStatusIndex(selectedOrder.order_status) : -1;
  const isCancelledOrFailed = selectedOrder && ['cancelled', 'failed', 'rto'].includes(selectedOrder.order_status);

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <main className="pt-8 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-light text-foreground text-center mb-8">Track Your Order</h1>

          {/* Search Form - Any single field works */}
          <div className="bg-muted/20 p-6 rounded-none mb-8">
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Enter your order number, phone number, or email to find your order(s)
            </p>
            <div className="mb-4">
              <Label className="text-sm font-light">Order Number / Phone / Email</Label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter order number, phone number, or email"
                className="mt-1.5 rounded-none"
                onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
              />
            </div>
            <Button 
              onClick={() => handleTrackOrder()}
              disabled={trackOrderMutation.isPending || !query.trim()}
              className="w-full rounded-none"
            >
              {trackOrderMutation.isPending ? (
                "Searching..."
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track Order
                </>
              )}
            </Button>
          </div>

          {/* Not Found */}
          {hasSearched && orders.length === 0 && !trackOrderMutation.isPending && (
            <div className="bg-muted/20 p-8 rounded-none text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-light text-foreground mb-2">Order Not Found</h2>
              <p className="text-muted-foreground text-sm">
                We couldn't find any orders matching your search. 
                Please check your details and try again.
              </p>
            </div>
          )}

          {/* Multiple Orders List */}
          {orders.length > 1 && !selectedOrder && (
            <div className="bg-muted/20 p-6 rounded-none mb-8">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-light text-foreground">Your Orders ({orders.length})</h2>
              </div>
              <div className="space-y-3">
                {orders.map((o: any) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="w-full p-4 bg-background border border-muted-foreground/10 rounded-none flex justify-between items-center hover:bg-muted/30 transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-foreground">{o.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(o.created_at), 'MMM dd, yyyy')} • ৳{o.total_amount?.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentStatusBadge(o.payment_status)}
                      <Badge variant="outline" className="capitalize">{o.order_status}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Back to Orders List */}
          {selectedOrder && orders.length > 1 && (
            <Button 
              variant="ghost" 
              onClick={() => setSelectedOrder(null)} 
              className="mb-4 rounded-none"
            >
              ← Back to all orders
            </Button>
          )}

          {/* Order Details */}
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="bg-muted/20 p-6 rounded-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-foreground">{selectedOrder.order_number}</h2>
                    <p className="text-sm text-muted-foreground">
                      Placed on {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPaymentStatusBadge(selectedOrder.payment_status)}
                  </div>
                </div>

                {/* Status Stepper */}
                {!isCancelledOrFailed ? (
                  <div className="relative">
                    <div className="flex justify-between items-center">
                      {statusSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center
                              ${isCompleted 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                              }
                              ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}
                            `}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs mt-2 text-center ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-none">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">
                        Order {selectedOrder.order_status === 'cancelled' ? 'Cancelled' : 
                               selectedOrder.order_status === 'failed' ? 'Failed' : 'Returned to Origin'}
                      </p>
                      <p className="text-sm text-destructive/80">
                        {selectedOrder.order_status === 'cancelled' && 'This order has been cancelled.'}
                        {selectedOrder.order_status === 'failed' && 'This order could not be completed.'}
                        {selectedOrder.order_status === 'rto' && 'This order is being returned to us.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tracking Info */}
                {selectedOrder.tracking_number && (
                  <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-none">
                    <p className="text-sm text-foreground">
                      <strong>Tracking Number:</strong> {selectedOrder.tracking_number}
                      {selectedOrder.courier_name && <span> ({selectedOrder.courier_name})</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Status History */}
              {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
                <div className="bg-muted/20 p-6 rounded-none">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-base font-light text-foreground">Order Timeline</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.status_history.slice(0, 5).map((history: any) => (
                      <div key={history.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-foreground capitalize">{history.new_status.replace(/_/g, ' ')}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(history.created_at), 'MMM dd, yyyy h:mm a')}
                          </p>
                          {history.notes && (
                            <p className="text-muted-foreground text-xs mt-1">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-muted/20 p-6 rounded-none">
                <h3 className="text-base font-light text-foreground mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-background border border-muted-foreground/10 rounded-none">
                      {item.variant_details?.image && (
                        <div className="w-16 h-16 bg-muted rounded-none overflow-hidden flex-shrink-0">
                          <img 
                            src={item.variant_details.image} 
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground">{item.product_name}</h4>
                        {(item.variant_details?.color || item.variant_details?.size) && (
                          <p className="text-sm text-muted-foreground">
                            {[item.variant_details?.color, item.variant_details?.size].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">৳{item.line_total?.toLocaleString()}</p>
                        {getItemStatusBadge(item.fulfillment_status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Payment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted/20 p-6 rounded-none">
                  <h3 className="text-base font-light text-foreground mb-4">Shipping Address</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedOrder.shipping_name}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_phone}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_address}</p>
                    {selectedOrder.shipping_city && (
                      <p className="text-muted-foreground">{selectedOrder.shipping_city}</p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/20 p-6 rounded-none">
                  <h3 className="text-base font-light text-foreground mb-4">Order Summary</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{selectedOrder.subtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>৳{selectedOrder.shipping_cost?.toLocaleString()}</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Discount</span>
                        <span>-৳{selectedOrder.discount_amount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-base border-t border-muted-foreground/20 pt-2">
                      <span>Total</span>
                      <span>৳{selectedOrder.total_amount?.toLocaleString()}</span>
                    </div>
                    {selectedOrder.paid_amount > 0 && selectedOrder.paid_amount < selectedOrder.total_amount && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Paid</span>
                        <span>৳{selectedOrder.paid_amount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Payment</span>
                      <span>{selectedOrder.payment_method?.name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1 rounded-none" asChild>
                  <Link to="/">
                    Continue Shopping
                  </Link>
                </Button>
                {selectedOrder.order_status === 'delivered' && (
                  <Button variant="outline" className="flex-1 rounded-none">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Request Return
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <PoshplexFooter />
    </div>
  );
};

export default OrderTracking;
