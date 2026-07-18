import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useCreateShipment, useTrackShipment, STEADFAST_STATUS_MAP } from "@/hooks/useSteadfast";

import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
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
  Image as ImageIcon,
  User,
  Loader2,
  Send,
  Map,
  Pencil,
  BadgeCheck,
  Plus,
  Banknote,
  Trash2
} from "lucide-react";
import OrderItemEditModal from "./OrderItemEditModal";
import OrderItemAddModal from "./OrderItemAddModal";

import ImageLightbox from "@/components/ui/image-lightbox";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

interface OrderDetailModalProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

import { ORDER_STATUS_LABELS, ALLOWED_ORDER_STATUSES } from "@/constants";

const statusOptions: OrderStatus[] = ALLOWED_ORDER_STATUSES;

const paymentOptions: PaymentStatus[] = [
  'unpaid', 'pending_verification', 'paid', 'partially_paid',
  'partially_refunded', 'refunded', 'failed'
];

const itemStatusOptions: ItemFulfillmentStatus[] = [
  'pending', 'reserved', 'shipped', 'delivered', 
  'out_of_stock', 'returned', 'cancelled'
];

const OrderDetailModal = ({ orderId, open, onClose }: OrderDetailModalProps) => {
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useOrder(orderId);
  const { data: history } = useOrderHistory(orderId);
  const updateOrderStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const updateItemFulfillment = useUpdateItemFulfillment();
  const createShipment = useCreateShipment();

  const { data: trackingData, isLoading: trackingLoading, refetch: refetchTracking, isFetching: trackingFetching } = useTrackShipment(
    order?.tracking_number || undefined
  );
  
  const [statusNote, setStatusNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus | "">("");
  const [editingItem, setEditingItem] = useState<{
    id: string;
    product_id: string | null;
    variant_id: string | null;
    product_name: string;
    variant_sku: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  } | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);


  // Fetch promo codes for lookup
  const { data: promoCodes } = useQuery({
    queryKey: ["promo-codes-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch product images for order items
  const productIds = order?.items?.map(i => i.product_id).filter((id): id is string => !!id) || [];
  const { data: productImages } = useQuery({
    queryKey: ["order-item-images", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("product_images")
        .select("product_id, image_url, color_id, is_main, sort_order")
        .in("product_id", productIds)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: productIds.length > 0,
  });

  // Fetch variant details (color, size, material names) for order items
  const variantIds = order?.items?.map(i => i.variant_id).filter((id): id is string => !!id) || [];
  const { data: variantDetails } = useQuery({
    queryKey: ["order-item-variants", variantIds],
    queryFn: async () => {
      if (variantIds.length === 0) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, color_id, color:colors(id, name, hex_code), size:sizes(label), material:materials(name)")
        .in("id", variantIds);
      if (error) throw error;
      return data;
    },
    enabled: variantIds.length > 0,
  });

  const getItemImage = (item: { product_id: string | null; variant_id: string | null }) => {
    if (!productImages || !item.product_id) return null;
    const images = productImages.filter(img => img.product_id === item.product_id);
    
    // If variant has a color, prefer color-specific image
    if (item.variant_id && variantDetails) {
      const variant = variantDetails.find(v => v.id === item.variant_id) as any;
      if (variant?.color_id) {
        const colorImage = images.find(img => img.color_id === variant.color_id);
        if (colorImage) return colorImage.image_url;
      }
    }
    
    const mainImg = images.find(img => img.is_main);
    return mainImg?.image_url || images[0]?.image_url || null;
  };

  const getVariantInfo = (variantId: string | null) => {
    if (!variantId || !variantDetails) return null;
    const variant = variantDetails.find(v => v.id === variantId) as any;
    if (!variant) return null;
    const parts: string[] = [];
    if (variant.color?.name) parts.push(variant.color.name);
    if (variant.size?.label) parts.push(variant.size.label);
    if (variant.material?.name) parts.push(variant.material.name);
    return { parts, hexCode: variant.color?.hex_code };
  };

  // Calculate paid amount from order or default to 0
  const paidAmount = (order as any)?.paid_amount ?? 0;
  const remainingBalance = (order?.total_amount ?? 0) - paidAmount;




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

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("id", itemId);
      if (deleteError) throw deleteError;

      // Recalculate order totals
      const { data: allItems, error: itemsError } = await supabase
        .from("order_items")
        .select("line_total")
        .eq("order_id", orderId);
      if (itemsError) throw itemsError;

      const newSubtotal = allItems.reduce((sum, i) => sum + Number(i.line_total), 0);
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("shipping_cost, discount_amount, tax_amount")
        .eq("id", orderId)
        .single();
      if (orderError) throw orderError;

      const newTotal = newSubtotal - Number(orderData.discount_amount) + Number(orderData.shipping_cost) + Number(orderData.tax_amount);
      const { error: updateError } = await supabase
        .from("orders")
        .update({ subtotal: newSubtotal, total_amount: newTotal })
        .eq("id", orderId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Item removed from order");
    },
    onError: (error: Error) => toast.error("Failed to remove item: " + error.message),
  });

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Order {order.order_number}</span>
              {order.risk_level !== 'low' && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {order.risk_level} risk
                </Badge>
              )}
            </div>
            {!order.tracking_number && (
              <Button
                size="sm"
                onClick={() => createShipment.mutate(order.id)}
                disabled={createShipment.isPending}
              >
                {createShipment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send to Steadfast
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="border border-border p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" /> Customer Details
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{order.customer?.name || order.shipping_name}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" /> {order.customer?.phone || order.shipping_phone}
                </p>
                {(order.customer?.email || order.shipping_email) && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" /> {order.customer?.email || order.shipping_email}
                  </p>
                )}
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground mb-1">Shipping Address:</p>
                <p className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5" /> {order.shipping_address}
                </p>
                {(order.shipping_division || order.shipping_thana) && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Map className="h-3 w-3" />
                    {[order.shipping_thana?.name, order.shipping_division?.name].filter(Boolean).join(", ")}
                  </p>
                )}
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
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {(order.discount_amount > 0 || order.promo_code) && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount{order.promo_code ? ` (${order.promo_code})` : ''}:</span>
                    <div className="flex items-center gap-1">
                      <span>-{formatCurrency(order.discount_amount)}</span>
                      {order.promo_code && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive"
                          onClick={async () => {
                            if (!confirm("Remove promo code from this order?")) return;
                            const newTotal = order.subtotal + order.shipping_cost + order.tax_amount;
                            await supabase.from("orders").update({
                              promo_code: null,
                              promo_code_id: null,
                              promo_discount: 0,
                              discount_amount: 0,
                              total_amount: newTotal,
                            }).eq("id", orderId);
                            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
                            toast.success("Promo code removed");
                          }}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              {/* Promo Code Management */}
              {!order.promo_code && (
                <div className="pt-2 border-t">
                  <span className="text-xs font-medium text-muted-foreground">Apply Promo Code</span>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Enter code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={!promoInput || applyingPromo}
                      onClick={async () => {
                        setApplyingPromo(true);
                        try {
                          const promo = promoCodes?.find(p => p.code.toUpperCase() === promoInput);
                          if (!promo) {
                            toast.error("Invalid promo code");
                            return;
                          }
                          let discount = 0;
                          if (promo.discount_type === "percentage") {
                            discount = (order.subtotal * promo.discount_value) / 100;
                            if (promo.max_discount_amount) discount = Math.min(discount, promo.max_discount_amount);
                          } else {
                            discount = promo.discount_value;
                          }
                          const newTotal = order.subtotal - discount + order.shipping_cost + order.tax_amount;
                          await supabase.from("orders").update({
                            promo_code: promo.code,
                            promo_code_id: promo.id,
                            promo_discount: discount,
                            discount_amount: discount,
                            total_amount: Math.max(0, newTotal),
                          }).eq("id", orderId);
                          // Record usage
                          await supabase.from("promo_code_usages").insert({
                            promo_code_id: promo.id,
                            customer_id: order.customer_id,
                            order_id: orderId,
                            discount_amount: discount,
                          });
                          queryClient.invalidateQueries({ queryKey: ["order", orderId] });
                          setPromoInput("");
                          toast.success(`Promo "${promo.code}" applied — ${formatCurrency(discount)} off`);
                        } catch (err: any) {
                          toast.error("Failed to apply promo: " + err.message);
                        } finally {
                          setApplyingPromo(false);
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Summary - Manual Payment Recording */}
            <div className="border border-border p-4 space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Payment Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Remaining:</span>
                  <span className={remainingBalance > 0 ? "text-destructive" : "text-green-600"}>
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>


            {/* Risk Flags */}
            {order.risk_flags && order.risk_flags.length > 0 && (
              <div className="border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <h3 className="font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Risk Flags
                </h3>
                <ul className="text-sm text-destructive/80 space-y-1">
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
                          {ORDER_STATUS_LABELS[s]}
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
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Order Items ({order.items?.length || 0})</h3>
                <Button size="sm" variant="outline" onClick={() => setShowAddItemModal(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Product
                </Button>
              </div>
              <div className="space-y-3">
                {order.items?.map((item) => {
                  const imageUrl = getItemImage(item);
                  const variantInfo = getVariantInfo(item.variant_id);
                  return (
                    <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded">
                      {/* Product Image */}
                      {imageUrl ? (
                        <button
                          onClick={() => setLightboxImage(imageUrl)}
                          className="w-14 h-14 rounded overflow-hidden flex-shrink-0 border border-border hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <img src={imageUrl} alt={item.product_name} className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        {variantInfo && variantInfo.parts.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {variantInfo.hexCode && (
                              <span
                                className="w-3 h-3 rounded-full border border-border inline-block"
                                style={{ backgroundColor: variantInfo.hexCode }}
                              />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {variantInfo.parts.join(' / ')}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          SKU: {item.variant_sku || 'N/A'} • Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {formatCurrency(item.line_total)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingItem({
                            id: item.id,
                            product_id: (item as any).product_id ?? null,
                            variant_id: (item as any).variant_id ?? null,
                            product_name: item.product_name,
                            variant_sku: item.variant_sku,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            line_total: item.line_total,
                          })}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            if (confirm("Remove this item from the order?")) {
                              removeItemMutation.mutate(item.id);
                            }
                          }}
                          disabled={removeItemMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
                  );
                })}
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
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded space-y-3">
            <h4 className="font-medium flex items-center justify-between text-blue-800">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" /> Steadfast Tracking
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => refetchTracking()}
                  disabled={trackingFetching}
                >
                  {trackingFetching ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
                <Badge className={colorClasses[statusInfo.color] || "bg-gray-100"} variant="outline">
                  {trackingLoading || trackingFetching ? <Loader2 className="h-3 w-3 animate-spin" /> : statusInfo.label}
                </Badge>
              </div>
            </h4>
            {trackingData?.deleted && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ This parcel was not found in Steadfast. It may have been deleted. Use "Reset Shipping" to re-ship.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-600">Courier:</span> {order.courier_name || "Steadfast"}
              </div>
              <div>
                <span className="text-blue-600">Tracking #:</span> 
                <span className="font-mono ml-1">{order.tracking_number}</span>
              </div>
              {order.payment_method_type === "cod" && (
                <>
                  <div>
                    <span className="text-blue-600">COD Amount:</span> ৳{order.total_amount.toLocaleString()}
                  </div>
                  {trackingData?.cod_amount !== undefined && !trackingData?.deleted && (
                    <div>
                      <span className="text-blue-600">Collected:</span> ৳{trackingData.cod_amount.toLocaleString()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}




        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        {/* Order Item Edit Modal */}
        <OrderItemEditModal
          item={editingItem}
          orderId={orderId}
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
        />




        {/* Order Item Add Modal */}
        <OrderItemAddModal
          orderId={orderId}
          open={showAddItemModal}
          onClose={() => setShowAddItemModal(false)}
        />

        {/* Image Lightbox */}
        <ImageLightbox
          images={lightboxImage ? [lightboxImage] : []}
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
