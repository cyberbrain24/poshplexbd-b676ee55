import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, Search, Trash2, Loader2, X, ShoppingCart, User, Package, Tag as TagIcon, CreditCard, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDivisions, useThanas } from "@/hooks/useLocationData";
import { usePaymentMethods, PaymentMethodType } from "@/hooks/useOrders";
import { useCreateOrder } from "@/hooks/useCheckout";
import { useProductSearch } from "@/hooks/useProductSearch";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";

interface SelectedItem {
  id: string; // unique row id
  productId: string;
  variantId: string | null;
  name: string;
  image: string | null;
  sku: string | null;
  color: string | null;
  size: string | null;
  price: number;
  quantity: number;
}

interface VariantPick {
  product: any;
  variant: any | null;
}

const AdminAddOrder = () => {
  const navigate = useNavigate();
  const { data: divisions } = useDivisions();
  const { data: paymentMethods } = usePaymentMethods(true);
  const createOrderMutation = useCreateOrder();

  // Customer state
  const [customer, setCustomer] = useState({
    id: "" as string | null | "",
    name: "",
    phone: "",
    email: "",
    address: "",
    divisionId: "",
    thanaId: "",
    postalCode: "",
    notes: "",
  });
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);

  const { data: thanas } = useThanas(customer.divisionId);

  // Items
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: searchResults, isLoading: searching } = useProductSearch(search);
  const [variantPick, setVariantPick] = useState<VariantPick | null>(null);

  // Load images/variants for picked product (with full variant detail)
  const [productDetail, setProductDetail] = useState<any | null>(null);
  useEffect(() => {
    const fetchDetail = async () => {
      if (!variantPick) { setProductDetail(null); return; }
      const { data } = await supabase
        .from("products")
        .select(`
          id, name, base_price, sku,
          images:product_images(id, image_url, is_main, sort_order),
          variants:product_variants(id, sku, selling_price, stock_quantity, is_active, image_url, color:colors(name), size:sizes(label))
        `)
        .eq("id", variantPick.product.id)
        .single();
      setProductDetail(data);
    };
    fetchDetail();
  }, [variantPick?.product?.id]);

  // Discount & Promo
  const [manualDiscount, setManualDiscount] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; code: string; discount: number; freeDelivery: boolean } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Payment
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");

  const selectedPaymentMethod = paymentMethods?.find(p => p.id === paymentMethodId);
  useEffect(() => {
    if (paymentMethods && !paymentMethodId) {
      const cod = paymentMethods.find(p => p.type === 'cod');
      setPaymentMethodId(cod?.id || paymentMethods[0]?.id || "");
    }
  }, [paymentMethods, paymentMethodId]);

  // Totals
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const manualDiscountValue = Math.max(0, Number(manualDiscount) || 0);
  const promoDiscountValue = appliedPromo?.discount || 0;
  const totalDiscount = manualDiscountValue + promoDiscountValue;

  const selectedThana = useMemo(() => thanas?.find(t => t.id === customer.thanaId), [thanas, customer.thanaId]);
  const baseShipping = selectedThana?.shipping_cost !== undefined ? Number(selectedThana.shipping_cost) : 0;
  const shippingCost = appliedPromo?.freeDelivery ? 0 : baseShipping;

  const total = Math.max(0, subtotal - totalDiscount + shippingCost);

  // ----- Customer phone lookup -----
  const handlePhoneBlur = async () => {
    const phone = customer.phone.trim();
    if (!phone || phone.length < 6) return;
    setPhoneLookupLoading(true);
    try {
      const { data } = await supabase
        .from("customers")
        .select("id, name, phone, email, address, division_id, thana_id")
        .eq("phone", phone)
        .maybeSingle();
      if (data) {
        setCustomer(c => ({
          ...c,
          id: data.id,
          name: data.name || c.name,
          email: data.email || c.email,
          address: data.address || c.address,
          divisionId: data.division_id || c.divisionId,
          thanaId: data.thana_id || c.thanaId,
        }));
        toast.success("Existing customer loaded");
      } else {
        setCustomer(c => ({ ...c, id: "" }));
      }
    } finally {
      setPhoneLookupLoading(false);
    }
  };

  // ----- Add product / variant -----
  const productImage = (p: any): string | null => {
    if (!p?.images?.length) return null;
    const main = p.images.find((i: any) => i.is_main);
    return (main || p.images[0])?.image_url || null;
  };

  const addItem = (variantOpt: any | null) => {
    if (!productDetail) return;
    const price = variantOpt?.selling_price ?? productDetail.base_price;
    const newItem: SelectedItem = {
      id: `${productDetail.id}-${variantOpt?.id || "base"}-${Date.now()}`,
      productId: productDetail.id,
      variantId: variantOpt?.id || null,
      name: productDetail.name,
      image: variantOpt?.image_url || productImage(productDetail),
      sku: variantOpt?.sku || productDetail.sku || null,
      color: variantOpt?.color?.name || null,
      size: variantOpt?.size?.label || null,
      price,
      quantity: 1,
    };
    setItems(prev => [...prev, newItem]);
    setVariantPick(null);
    setPickerOpen(false);
    setSearch("");
    toast.success("Product added");
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  // ----- Promo -----
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setApplyingPromo(true);
    try {
      const { validatePromoCode } = await import("@/lib/promo");
      const result = await validatePromoCode(promoCodeInput, subtotal, baseShipping, customer.phone || undefined);
      if (!result.valid || !result.promo) {
        toast.error(result.error || "Invalid promo code");
        return;
      }
      setAppliedPromo({
        id: result.promo.id,
        code: result.promo.code,
        discount: result.discount,
        freeDelivery: result.freeDelivery,
      });
      toast.success(result.freeDelivery ? "Free delivery applied" : `Saved ${formatCurrency(result.discount)}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to apply promo");
    } finally {
      setApplyingPromo(false);
    }
  };

  // ----- Place order -----
  const validate = () => {
    if (!customer.name.trim()) return toast.error("Customer name required"), false;
    if (!customer.phone.trim()) return toast.error("Customer phone required"), false;
    if (!customer.address.trim()) return toast.error("Address required"), false;
    if (!customer.divisionId) return toast.error("Select district"), false;
    if (!customer.thanaId) return toast.error("Select thana"), false;
    if (items.length === 0) return toast.error("Add at least one product"), false;
    if (!paymentMethodId) return toast.error("Select payment method"), false;
    return true;
  };

  const findOrCreateCustomer = async (): Promise<string | null> => {
    const { data, error } = await supabase.rpc("upsert_checkout_customer", {
      p_name: customer.name,
      p_phone: customer.phone,
      p_email: customer.email || null,
      p_gender: "other",
      p_address: customer.address || null,
      p_division_id: customer.divisionId || null,
      p_thana_id: customer.thanaId || null,
    });
    if (error) {
      console.error(error);
      return null;
    }
    return data as string;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    try {
      const customerId = await findOrCreateCustomer();

      // Build cart items in the shape useCreateOrder expects
      const cartItems = items.map(i => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId || undefined,
        name: i.name,
        sku: i.sku || undefined,
        color: i.color || undefined,
        size: i.size || undefined,
        image: i.image || undefined,
        price: i.price,
        quantity: i.quantity,
      })) as any;

      const result = await createOrderMutation.mutateAsync({
        checkoutData: {
          customerId: customerId || undefined,
          guestPhone: customer.phone,
          guestEmail: customer.email || undefined,
          shippingName: customer.name,
          shippingPhone: customer.phone,
          shippingEmail: customer.email || undefined,
          shippingAddress: customer.address,
          shippingDivisionId: customer.divisionId,
          shippingThanaId: customer.thanaId,
          shippingPostalCode: customer.postalCode || undefined,
          paymentMethodId,
          paymentMethodType: (selectedPaymentMethod?.type || 'cod') as PaymentMethodType,
          transactionId: transactionId || undefined,
          senderNumber: senderNumber || undefined,
          subtotal,
          discountAmount: totalDiscount,
          shippingCost,
          paidAmount: Number(paidAmount) || 0,
          promoCodeId: appliedPromo?.id,
          promoCode: appliedPromo?.code,
          promoDiscount: promoDiscountValue || undefined,
          customerNotes: customer.notes || undefined,
        },
        cartItems,
      });

      // Tag the order with creator info (groundwork for RBAC)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && result.orderId) {
          await supabase
            .from("orders")
            .update({ created_by_user_id: user.id, created_by_source: 'admin' } as any)
            .eq("id", result.orderId);
        }
      } catch (e) {
        console.warn("Failed to tag order creator", e);
      }

      navigate("/admin/orders");
    } catch (e) {
      // toast handled by mutation
    }
  };

  const isProcessing = createOrderMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto pb-32 px-3 sm:px-6 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Add Order</h1>
          <p className="text-sm text-muted-foreground">Place an order on behalf of a customer</p>
        </div>
      </div>

      {/* Customer */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><User className="h-4 w-4" /> Customer</div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Phone *</Label>
            <div className="relative">
              <Input
                value={customer.phone}
                onChange={(e) => setCustomer(c => ({ ...c, phone: e.target.value, id: "" }))}
                onBlur={handlePhoneBlur}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
              />
              {phoneLookupLoading && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
            </div>
            {customer.id && <p className="text-xs text-green-600 mt-1">Existing customer</p>}
          </div>
          <div>
            <Label className="text-xs">Name *</Label>
            <Input value={customer.name} onChange={(e) => setCustomer(c => ({ ...c, name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={customer.email} onChange={(e) => setCustomer(c => ({ ...c, email: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-2 font-semibold pt-2 border-t"><MapPin className="h-4 w-4" /> Shipping Address</div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Address *</Label>
            <Textarea rows={2} value={customer.address} onChange={(e) => setCustomer(c => ({ ...c, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">District *</Label>
              <Select value={customer.divisionId} onValueChange={(v) => setCustomer(c => ({ ...c, divisionId: v, thanaId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {divisions?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Thana *</Label>
              <Select value={customer.thanaId} onValueChange={(v) => setCustomer(c => ({ ...c, thanaId: v }))} disabled={!customer.divisionId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {thanas?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Postal Code</Label>
            <Input value={customer.postalCode} onChange={(e) => setCustomer(c => ({ ...c, postalCode: e.target.value }))} />
          </div>
        </div>
      </Card>

      {/* Products */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4" /> Products ({items.length})</div>
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded">
            No products added yet
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex gap-3 p-2 border rounded">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                    <button onClick={() => removeItem(item.id)} className="text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[item.color, item.size].filter(Boolean).join(" • ") || item.sku}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Discount & Promo */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><TagIcon className="h-4 w-4" /> Discount & Promo</div>
        <div>
          <Label className="text-xs">Manual Discount (৳)</Label>
          <Input type="number" min={0} value={manualDiscount} onChange={(e) => setManualDiscount(e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label className="text-xs">Promo Code</Label>
          {appliedPromo ? (
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 border rounded">
              <div className="text-sm">
                <span className="font-semibold">{appliedPromo.code}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {appliedPromo.freeDelivery ? "Free delivery" : `-${formatCurrency(appliedPromo.discount)}`}
                </span>
              </div>
              <button onClick={() => { setAppliedPromo(null); setPromoCodeInput(""); }} className="text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} placeholder="Enter code" />
              <Button onClick={handleApplyPromo} disabled={applyingPromo || !promoCodeInput.trim()}>
                {applyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Payment */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4" /> Payment</div>
        <div>
          <Label className="text-xs">Method *</Label>
          <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {paymentMethods?.map(pm => (
                <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedPaymentMethod?.type !== 'cod' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Transaction ID</Label>
              <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sender Number</Label>
              <Input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} />
            </div>
          </div>
        )}
        <div>
          <Label className="text-xs">Paid Amount (optional)</Label>
          <Input type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0 = unpaid" />
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-4 space-y-2">
        <Label className="text-xs">Order Notes</Label>
        <Textarea rows={2} value={customer.notes} onChange={(e) => setCustomer(c => ({ ...c, notes: e.target.value }))} placeholder="Any special instructions" />
      </Card>

      {/* Summary */}
      <Card className="p-4 space-y-2">
        <div className="font-semibold mb-2">Summary</div>
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        {manualDiscountValue > 0 && <Row label="Manual Discount" value={`-${formatCurrency(manualDiscountValue)}`} />}
        {promoDiscountValue > 0 && <Row label={`Promo (${appliedPromo?.code})`} value={`-${formatCurrency(promoDiscountValue)}`} />}
        <Row label="Shipping" value={formatCurrency(shippingCost)} />
        <div className="h-px bg-border my-1" />
        <Row label="Total" value={formatCurrency(total)} bold />
      </Card>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t p-3 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{formatCurrency(total)}</p>
          </div>
          <Button size="lg" onClick={handlePlaceOrder} disabled={isProcessing} className="flex-1">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            Place Order
          </Button>
        </div>
      </div>

      {/* Product picker sheet */}
      <Sheet open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (!o) { setVariantPick(null); setSearch(""); } }}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{variantPick ? "Choose Variant" : "Add Product"}</SheetTitle>
          </SheetHeader>

          {!variantPick ? (
            <>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {searching && <p className="text-center text-sm text-muted-foreground py-8">Searching...</p>}
                {!searching && search.length < 2 && <p className="text-center text-sm text-muted-foreground py-8">Type 2+ letters</p>}
                {!searching && search.length >= 2 && searchResults?.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">No products found</p>
                )}
                <div className="space-y-1">
                  {searchResults?.map((p: any) => {
                    const img = productImage(p);
                    return (
                      <button
                        key={p.id}
                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted text-left"
                        onClick={() => setVariantPick({ product: p, variant: null })}
                      >
                        {img ? (
                          <img src={img} alt={p.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(p.base_price)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <Button variant="ghost" size="sm" onClick={() => setVariantPick(null)} className="mb-3">← Back</Button>
              {!productDetail ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : (
                <>
                  <div className="flex gap-3 mb-4">
                    {productImage(productDetail) ? (
                      <img src={productImage(productDetail)!} alt={productDetail.name} className="w-20 h-20 object-cover rounded" />
                    ) : null}
                    <div>
                      <p className="font-semibold">{productDetail.name}</p>
                      <p className="text-sm text-muted-foreground">Base: {formatCurrency(productDetail.base_price)}</p>
                    </div>
                  </div>

                  {productDetail.variants && productDetail.variants.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Select variant:</p>
                      {productDetail.variants.filter((v: any) => v.is_active).map((v: any) => (
                        <button
                          key={v.id}
                          onClick={() => addItem(v)}
                          className="w-full flex items-center gap-3 p-3 border rounded hover:bg-muted text-left"
                        >
                          {v.image_url ? (
                            <img src={v.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                          ) : null}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {[v.color?.name, v.size?.label].filter(Boolean).join(" / ") || v.sku}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {v.sku} • Stock: {v.stock_quantity ?? 0}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">{formatCurrency(v.selling_price ?? productDetail.base_price)}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Button onClick={() => addItem(null)} className="w-full">Add to order</Button>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex items-center justify-between text-sm ${bold ? "font-bold text-base" : ""}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default AdminAddOrder;
