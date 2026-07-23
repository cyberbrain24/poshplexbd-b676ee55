import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Minus, Search, Trash2, Loader2, X, ShoppingCart, User, Package, Tag as TagIcon, CreditCard, MapPin, ChevronLeft } from "lucide-react";
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
import VariantSelector from "@/components/product/VariantSelector";

interface SelectedItem {
  id: string;
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

  // Category browse state in picker
  const [parentCatId, setParentCatId] = useState<string | null>(null);
  const [subCatId, setSubCatId] = useState<string | null>(null);

  const { data: parentCategories } = useQuery({
    queryKey: ["addorder-parent-cats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id, is_active, sort_order")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: subCategories } = useQuery({
    queryKey: ["addorder-sub-cats", parentCatId],
    queryFn: async () => {
      if (!parentCatId) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id, is_active, sort_order")
        .eq("parent_id", parentCatId)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!parentCatId,
  });

  const activeCatId = subCatId || parentCatId;
  const browsing = !search || search.length < 2;

  const { data: categoryProducts, isLoading: loadingCatProducts } = useQuery({
    queryKey: ["addorder-cat-products", activeCatId],
    queryFn: async () => {
      if (!activeCatId) {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, base_price, sku, images:product_images(image_url, is_main, sort_order)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(40);
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("product_categories")
        .select("product:products!inner(id, name, base_price, sku, is_active, created_at, images:product_images(image_url, is_main, sort_order))")
        .eq("category_id", activeCatId)
        .limit(60);
      if (error) throw error;
      return (data || [])
        .map((row: any) => row.product)
        .filter((p: any) => p && p.is_active)
        .sort((a: any, b: any) => (b.created_at || "").localeCompare(a.created_at || ""));
    },
    enabled: pickerOpen && browsing,
  });

  // Load images/variants for picked product
  const [productDetail, setProductDetail] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  useEffect(() => {
    const fetchDetail = async () => {
      if (!variantPick) { setProductDetail(null); setSelectedVariant(null); return; }
      setSelectedVariant(null);
      const { data } = await supabase
        .from("products")
        .select(`
          id, name, base_price, sku,
          images:product_images(id, image_url, is_main, sort_order),
          variants:product_variants(id, sku, selling_price, stock_quantity, is_active, image_url, color:colors(id, name, hex_code), size:sizes(id, label, sort_order))
        `)
        .eq("id", variantPick.product.id)
        .single();
      setProductDetail(data);
    };
    fetchDetail();
  }, [variantPick?.product?.id]);

  // Discount
  const [manualDiscount, setManualDiscount] = useState("");


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
  const totalDiscount = manualDiscountValue;

  const selectedThana = useMemo(() => thanas?.find(t => t.id === customer.thanaId), [thanas, customer.thanaId]);
  const baseShipping = selectedThana?.shipping_cost !== undefined ? Number(selectedThana.shipping_cost) : 0;
  const shippingCost = baseShipping;
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

  // ----- Picker helpers -----
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
          customerNotes: customer.notes || undefined,

        },
        cartItems,
      });

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

  // Products to display in picker
  const pickerProducts = browsing ? (categoryProducts || []) : (searchResults || []);
  const pickerLoading = browsing ? loadingCatProducts : searching;

  return (
    <div className="max-w-2xl mx-auto pb-32 px-3 sm:px-6 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Add Order</h1>
        <p className="text-sm text-muted-foreground">Place an order on behalf of a customer</p>
      </div>

      {/* Customer */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><User className="h-4 w-4" /> Customer</div>
        <div className="space-y-2">
          <div>
            <Label className="text-xs">Phone *</Label>
            <div className="relative">
              <Input
                className="h-11"
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
            <Input className="h-11" value={customer.name} onChange={(e) => setCustomer(c => ({ ...c, name: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input className="h-11" type="email" value={customer.email} onChange={(e) => setCustomer(c => ({ ...c, email: e.target.value }))} />
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
                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {divisions?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Thana *</Label>
              <Select value={customer.thanaId} onValueChange={(v) => setCustomer(c => ({ ...c, thanaId: v }))} disabled={!customer.divisionId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {thanas?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Postal Code</Label>
            <Input className="h-11" value={customer.postalCode} onChange={(e) => setCustomer(c => ({ ...c, postalCode: e.target.value }))} />
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
                      <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Discount */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><TagIcon className="h-4 w-4" /> Discount</div>

        <div>
          <Label className="text-xs">Manual Discount (৳)</Label>
          <Input className="h-11" type="number" min={0} value={manualDiscount} onChange={(e) => setManualDiscount(e.target.value)} placeholder="0" />
        </div>


      </Card>

      {/* Payment */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4" /> Payment</div>
        <div>
          <Label className="text-xs">Method *</Label>
          <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger>
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
              <Input className="h-11" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Sender Number</Label>
              <Input className="h-11" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} />
            </div>
          </div>
        )}
        <div>
          <Label className="text-xs">Paid Amount (optional)</Label>
          <Input className="h-11" type="number" min={0} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0 = unpaid" />
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


        <Row label="Shipping" value={formatCurrency(shippingCost)} />
        <div className="h-px bg-border my-1" />
        <Row label="Total" value={formatCurrency(total)} bold />
      </Card>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t p-3 z-40 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
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
      <Sheet open={pickerOpen} onOpenChange={(o) => { setPickerOpen(o); if (!o) { setVariantPick(null); setSearch(""); setParentCatId(null); setSubCatId(null); } }}>
        <SheetContent
          side="bottom"
          className="h-[100dvh] sm:h-[90vh] flex flex-col p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >

          <SheetHeader className="p-3 border-b shrink-0">
            <SheetTitle className="text-base">{variantPick ? "Choose Variant" : "Add Product"}</SheetTitle>
          </SheetHeader>

          {!variantPick ? (
            <>
              {/* Sticky search + categories */}
              <div className="border-b shrink-0 bg-background">
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or SKU..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                {/* Parent categories chips */}
                <div className="px-3 pb-2 flex gap-2 overflow-x-auto snap-x scrollbar-none" style={{ scrollbarWidth: "none" }}>
                  <CatChip
                    label="All"
                    active={!parentCatId}
                    onClick={() => { setParentCatId(null); setSubCatId(null); }}
                  />
                  {parentCategories?.map((c: any) => (
                    <CatChip
                      key={c.id}
                      label={c.name}
                      active={parentCatId === c.id}
                      onClick={() => { setParentCatId(c.id); setSubCatId(null); }}
                    />
                  ))}
                </div>
                {/* Sub-categories chips */}
                {parentCatId && subCategories && subCategories.length > 0 && (
                  <div className="px-3 pb-2 flex gap-2 overflow-x-auto border-t pt-2" style={{ scrollbarWidth: "none" }}>
                    <CatChip
                      label="All"
                      active={!subCatId}
                      small
                      onClick={() => setSubCatId(null)}
                    />
                    {subCategories.map((c: any) => (
                      <CatChip
                        key={c.id}
                        label={c.name}
                        active={subCatId === c.id}
                        small
                        onClick={() => setSubCatId(c.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product grid */}
              <div className="flex-1 overflow-y-auto p-3">
                {pickerLoading && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!pickerLoading && pickerProducts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-10">
                    {browsing ? "No products in this category" : "No products found"}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pickerProducts.map((p: any) => {
                    const img = productImage(p);
                    return (
                      <button
                        key={p.id}
                        className="text-left group"
                        onClick={() => setVariantPick({ product: p, variant: null })}
                      >
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-1.5">
                          {img ? (
                            <img src={img} alt={p.name} loading="lazy" className="w-full h-full object-cover group-active:scale-95 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium line-clamp-2 leading-tight">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(p.base_price)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4">
                <Button variant="ghost" size="sm" onClick={() => setVariantPick(null)} className="mb-3 -ml-2">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {!productDetail ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-3 mb-5">
                      {(selectedVariant?.image_url || productImage(productDetail)) ? (
                        <img
                          src={selectedVariant?.image_url || productImage(productDetail)!}
                          alt={productDetail.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold line-clamp-2">{productDetail.name}</p>
                        <p className="text-base font-bold mt-0.5">
                          {formatCurrency(selectedVariant?.selling_price ?? productDetail.base_price)}
                        </p>
                        {selectedVariant && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            SKU: {selectedVariant.sku} • Stock: {selectedVariant.stock_quantity ?? 0}
                          </p>
                        )}
                      </div>
                    </div>

                    {productDetail.variants && productDetail.variants.length > 0 ? (
                      <VariantSelector
                        variants={productDetail.variants as any}
                        onVariantChange={(v) => setSelectedVariant(v)}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        This product has no variants.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Sticky add button */}
              <div className="border-t p-3 bg-background pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
                {productDetail?.variants && productDetail.variants.length > 0 ? (
                  <Button
                    className="w-full h-12 text-base"
                    disabled={!selectedVariant}
                    onClick={() => selectedVariant && addItem(selectedVariant)}
                  >
                    {selectedVariant ? "Add to Order" : "Select a variant"}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 text-base"
                    disabled={!productDetail}
                    onClick={() => addItem(null)}
                  >
                    Add to Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const CatChip = ({ label, active, onClick, small }: { label: string; active: boolean; onClick: () => void; small?: boolean }) => (
  <button
    onClick={onClick}
    className={`shrink-0 snap-start whitespace-nowrap rounded-full border transition-colors ${
      small ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm"
    } ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
  >
    {label}
  </button>
);

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex items-center justify-between text-sm ${bold ? "font-bold text-base" : ""}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default AdminAddOrder;
