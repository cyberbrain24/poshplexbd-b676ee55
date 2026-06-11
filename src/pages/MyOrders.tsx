import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  ChevronRight,
  ShoppingBag,
  LogOut,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  Pencil,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { ORDER_STATUS_LABELS, type OrderStatusType } from "@/constants";

const getOrderStatusBadge = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    processing: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
    shipped: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    delivered: "bg-green-100 text-green-800 hover:bg-green-100",
    partially_delivered: "bg-teal-100 text-teal-800 hover:bg-teal-100",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
    returned: "bg-red-100 text-red-800 hover:bg-red-100",
    failed: "bg-red-100 text-red-800 hover:bg-red-100",
    rto: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  const label = ORDER_STATUS_LABELS[status as OrderStatusType] || status;
  return <Badge className={colorMap[status] || ""}>{label}</Badge>;
};

const getPaymentStatusBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    paid: { className: "bg-green-100 text-green-800 hover:bg-green-100", label: "Paid" },
    pending_verification: { className: "bg-amber-100 text-amber-800 hover:bg-amber-100", label: "Pending" },
    unpaid: { className: "bg-gray-100 text-gray-800 hover:bg-gray-100", label: "COD" },
    partially_paid: { className: "bg-blue-100 text-blue-800 hover:bg-blue-100", label: "Partial" },
  };
  const s = map[status] || { className: "", label: status };
  return <Badge className={s.className}>{s.label}</Badge>;
};

const statusSteps = [
  { key: 'pending', label: ORDER_STATUS_LABELS.pending, icon: Package },
  { key: 'confirmed', label: ORDER_STATUS_LABELS.confirmed, icon: CheckCircle2 },
  { key: 'processing', label: ORDER_STATUS_LABELS.processing, icon: Clock },
  { key: 'shipped', label: ORDER_STATUS_LABELS.shipped, icon: Truck },
  { key: 'delivered', label: ORDER_STATUS_LABELS.delivered, icon: CheckCircle2 },
];

const getStatusIndex = (status: string) => {
  const index = statusSteps.findIndex(s => s.key === status);
  if (['cancelled', 'failed', 'rto'].includes(status)) return -1;
  return index >= 0 ? index : 0;
};

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  line_total: number;
  fulfillment_status: string;
  variant_details: { color?: string; size?: string; image?: string } | null;
}

interface StatusHistory {
  id: string;
  new_status: string;
  status_type: string;
  notes: string | null;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  created_at: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  tracking_number: string | null;
  courier_name: string | null;
  items: OrderItem[];
  status_history: StatusHistory[];
}

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const storedPhone = localStorage.getItem('poshplex_customer_phone');
    if (!storedPhone) {
      navigate('/');
      return;
    }
    setCustomerPhone(storedPhone);
    fetchOrders(storedPhone);
  }, [navigate]);

  const fetchOrders = async (phone: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, order_status, payment_status, total_amount,
          subtotal, shipping_cost, discount_amount, created_at,
          shipping_name, shipping_phone, shipping_address,
          tracking_number, courier_name,
          items:order_items(id, product_name, quantity, line_total, fulfillment_status, variant_details),
          status_history:order_status_history(id, new_status, status_type, notes, created_at)
        `)
        .or(`shipping_phone.eq.${phone},guest_phone.eq.${phone}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as unknown as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('poshplex_customer_phone');
    localStorage.removeItem('poshplex_customer_name');
    navigate('/');
  };

  const canEditOrder = (order: Order) => order.order_status === 'pending';

  const startEditing = () => {
    if (selectedOrder) {
      setEditedItems(selectedOrder.items.map(item => ({ ...item })));
      setIsEditing(true);
    }
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    setEditedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, line_total: newQty * (item.line_total / item.quantity) };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    if (editedItems.length <= 1) {
      toast.error("Order must have at least one item");
      return;
    }
    setEditedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const saveOrderEdits = async () => {
    if (!selectedOrder) return;
    setIsSavingEdit(true);
    try {
      // Update each item's quantity and line_total
      for (const item of editedItems) {
        const originalItem = selectedOrder.items.find(i => i.id === item.id);
        if (originalItem && (originalItem.quantity !== item.quantity)) {
          const unitPrice = originalItem.line_total / originalItem.quantity;
          const newLineTotal = unitPrice * item.quantity;
          const { error } = await supabase
            .from("order_items")
            .update({ quantity: item.quantity, line_total: newLineTotal })
            .eq("id", item.id);
          if (error) throw error;
        }
      }

      // Delete removed items
      const removedIds = selectedOrder.items
        .filter(orig => !editedItems.find(e => e.id === orig.id))
        .map(i => i.id);
      
      for (const id of removedIds) {
        const { error } = await supabase.from("order_items").delete().eq("id", id);
        if (error) throw error;
      }

      // Recalculate order totals
      const newSubtotal = editedItems.reduce((sum, item) => {
        const originalItem = selectedOrder.items.find(i => i.id === item.id);
        const unitPrice = originalItem ? originalItem.line_total / originalItem.quantity : 0;
        return sum + (unitPrice * item.quantity);
      }, 0);
      
      const newTotal = newSubtotal + selectedOrder.shipping_cost - selectedOrder.discount_amount;
      
      const { error: orderError } = await supabase
        .from("orders")
        .update({ subtotal: newSubtotal, total_amount: Math.max(0, newTotal) })
        .eq("id", selectedOrder.id);
      
      if (orderError) throw orderError;

      toast.success("Order updated successfully");
      setIsEditing(false);
      
      // Refresh orders
      if (customerPhone) {
        fetchOrders(customerPhone);
        setSelectedOrder(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const currentStatusIndex = selectedOrder ? getStatusIndex(selectedOrder.order_status) : -1;
  const isCancelledOrFailed = selectedOrder && ['cancelled', 'failed', 'rto'].includes(selectedOrder.order_status);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PoshplexHeader />
        <main className="pt-8 pb-12 relative z-0">
          <div className="max-w-4xl mx-auto px-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-none" />
              ))}
            </div>
          </div>
        </main>
        <PoshplexFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <main className="pt-8 pb-12 relative z-0">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-light text-foreground">
                {selectedOrder ? (
                  <button onClick={() => setSelectedOrder(null)} className="hover:underline">
                    ← My Orders
                  </button>
                ) : "My Orders"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: {customerPhone}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-none">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Order Detail View */}
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="bg-muted/20 p-6 rounded-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-medium text-foreground">{selectedOrder.order_number}</h2>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getOrderStatusBadge(selectedOrder.order_status)}
                    {getPaymentStatusBadge(selectedOrder.payment_status)}
                    {canEditOrder(selectedOrder) && !isEditing && (
                      <Button variant="outline" size="sm" onClick={startEditing} className="rounded-none">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit Order
                      </Button>
                    )}
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
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                              ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                              ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs mt-2 text-center ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-none">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <p className="font-medium text-destructive capitalize">{selectedOrder.order_status.replace(/_/g, ' ')}</p>
                  </div>
                )}

                {selectedOrder.tracking_number && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-none text-sm">
                    <strong>Tracking:</strong> {selectedOrder.tracking_number}
                    {selectedOrder.courier_name && ` (${selectedOrder.courier_name})`}
                  </div>
                )}
              </div>

              {/* Timeline */}
              {selectedOrder.status_history?.length > 0 && (
                <div className="bg-muted/20 p-6 rounded-none">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-base font-light text-foreground">Timeline</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.status_history
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map(h => (
                        <div key={h.id} className="flex gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div>
                            <p className="text-foreground capitalize">{h.new_status.replace(/_/g, ' ')}</p>
                            <p className="text-muted-foreground text-xs">{format(new Date(h.created_at), 'MMM dd h:mm a')}</p>
                            {h.notes && <p className="text-muted-foreground text-xs mt-0.5">{h.notes}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="bg-muted/20 p-6 rounded-none">
                <h3 className="text-base font-light text-foreground mb-4">
                  Items ({(isEditing ? editedItems : selectedOrder.items)?.length || 0})
                  {isEditing && <span className="text-xs text-muted-foreground ml-2">(Editing)</span>}
                </h3>
                <div className="space-y-3">
                  {(isEditing ? editedItems : selectedOrder.items)?.map(item => {
                    const unitPrice = item.line_total / item.quantity;
                    return (
                      <div key={item.id} className="flex gap-4 p-3 bg-background border border-muted-foreground/10 rounded-none">
                        {item.variant_details?.image && (
                          <div className="w-14 h-14 bg-muted rounded-none overflow-hidden flex-shrink-0">
                            <img src={item.variant_details.image} alt={item.product_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm">{item.product_name}</h4>
                          {(item.variant_details?.color || item.variant_details?.size) && (
                            <p className="text-xs text-muted-foreground">{[item.variant_details?.color, item.variant_details?.size].filter(Boolean).join(" / ")}</p>
                          )}
                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, -1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItemQuantity(item.id, 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive ml-2" onClick={() => removeItem(item.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{formatCurrency(isEditing ? unitPrice * item.quantity : item.line_total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isEditing && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-muted-foreground/10">
                    <Button onClick={saveOrderEdits} disabled={isSavingEdit} size="sm" className="rounded-none">
                      {isSavingEdit ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-none" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}

                {!isEditing && (
                  <div className="mt-4 pt-4 border-t border-muted-foreground/10 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(selectedOrder.discount_amount)}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{formatCurrency(selectedOrder.shipping_cost)}</span></div>
                    <div className="flex justify-between font-medium text-base pt-2 border-t border-muted-foreground/10"><span>Total</span><span>{formatCurrency(selectedOrder.total_amount)}</span></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Orders List */
            <>
              {orders.length === 0 ? (
                <div className="bg-muted/20 p-12 rounded-none text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-lg font-light text-foreground mb-2">No Orders Yet</h2>
                  <p className="text-muted-foreground text-sm mb-6">Start shopping to see your orders here.</p>
                  <Button onClick={() => navigate('/')} className="rounded-none">Start Shopping</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-muted/20 p-6 rounded-none border border-muted-foreground/10 hover:border-muted-foreground/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-foreground">{order.order_number}</h3>
                            {getOrderStatusBadge(order.order_status)}
                            {getPaymentStatusBadge(order.payment_status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(order.created_at), 'MMM dd, yyyy h:mm a')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.items?.slice(0, 3).map((item) => (
                            <div key={item.id} className="w-12 h-12 bg-muted rounded-none overflow-hidden flex-shrink-0">
                              {item.variant_details?.image ? (
                                <img src={item.variant_details.image} alt={item.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-medium text-foreground">{formatCurrency(order.total_amount)}</p>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => navigate('/')} className="rounded-none">Continue Shopping</Button>
              </div>
            </>
          )}
        </div>
      </main>

      <PoshplexFooter />
    </div>
  );
};

export default MyOrders;
