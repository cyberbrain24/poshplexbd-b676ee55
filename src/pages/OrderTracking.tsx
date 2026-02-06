import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight,
  Search,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import CheckoutHeader from "@/components/header/CheckoutHeader";
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
  
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search if params provided
  useEffect(() => {
    const urlOrderNumber = searchParams.get('orderNumber');
    const urlPhone = searchParams.get('phone');
    if (urlOrderNumber && urlPhone) {
      handleTrackOrder(urlOrderNumber, urlPhone);
    }
  }, []);

  const handleTrackOrder = async (orderNum?: string, phoneNum?: string) => {
    const searchOrderNumber = orderNum || orderNumber;
    const searchPhone = phoneNum || phone;
    
    if (!searchOrderNumber.trim() || !searchPhone.trim()) {
      return;
    }

    setHasSearched(true);
    try {
      const result = await trackOrderMutation.mutateAsync({
        orderNumber: searchOrderNumber.trim(),
        phone: searchPhone.trim(),
      });
      setOrder(result);
    } catch (error) {
      setOrder(null);
    }
  };

  const currentStatusIndex = order ? getStatusIndex(order.order_status) : -1;
  const isCancelledOrFailed = order && ['cancelled', 'failed', 'rto'].includes(order.order_status);

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />
      
      <main className="pt-8 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-light text-foreground text-center mb-8">Track Your Order</h1>

          {/* Search Form */}
          <div className="bg-muted/20 p-6 rounded-none mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm font-light">Order Number</Label>
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="PO-XXXXXXXX-XXXX"
                  className="mt-1.5 rounded-none"
                />
              </div>
              <div>
                <Label className="text-sm font-light">Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="mt-1.5 rounded-none"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleTrackOrder()}
              disabled={trackOrderMutation.isPending || !orderNumber.trim() || !phone.trim()}
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
          {hasSearched && !order && !trackOrderMutation.isPending && (
            <div className="bg-muted/20 p-8 rounded-none text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-light text-foreground mb-2">Order Not Found</h2>
              <p className="text-muted-foreground text-sm">
                We couldn't find an order with that number and phone combination. 
                Please check your details and try again.
              </p>
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="bg-muted/20 p-6 rounded-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-foreground">{order.order_number}</h2>
                    <p className="text-sm text-muted-foreground">
                      Placed on {format(new Date(order.created_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPaymentStatusBadge(order.payment_status)}
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
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-none">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">
                        Order {order.order_status === 'cancelled' ? 'Cancelled' : 
                               order.order_status === 'failed' ? 'Failed' : 'Returned to Origin'}
                      </p>
                      <p className="text-sm text-red-600">
                        {order.order_status === 'cancelled' && 'This order has been cancelled.'}
                        {order.order_status === 'failed' && 'This order could not be completed.'}
                        {order.order_status === 'rto' && 'This order is being returned to us.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tracking Info */}
                {order.tracking_number && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-none">
                    <p className="text-sm text-blue-800">
                      <strong>Tracking Number:</strong> {order.tracking_number}
                      {order.courier_name && <span> ({order.courier_name})</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-muted/20 p-6 rounded-none">
                <h3 className="text-base font-light text-foreground mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items?.map((item: any) => (
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
                    <p className="font-medium">{order.shipping_name}</p>
                    <p className="text-muted-foreground">{order.shipping_phone}</p>
                    <p className="text-muted-foreground">{order.shipping_address}</p>
                    {order.shipping_city && (
                      <p className="text-muted-foreground">{order.shipping_city}</p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/20 p-6 rounded-none">
                  <h3 className="text-base font-light text-foreground mb-4">Order Summary</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{order.subtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>৳{order.shipping_cost?.toLocaleString()}</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-৳{order.discount_amount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium text-base border-t border-muted-foreground/20 pt-2">
                      <span>Total</span>
                      <span>৳{order.total_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-muted-foreground">Payment</span>
                      <span>{order.payment_method?.name || 'N/A'}</span>
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
                {/* Future: Return request button */}
                {order.order_status === 'delivered' && (
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
