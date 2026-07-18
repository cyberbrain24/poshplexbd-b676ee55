import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Check, Upload, Banknote, Smartphone, Building2, Truck, ChevronLeft, ShoppingBag, Eye, EyeOff } from "lucide-react";
import CheckoutHeader from "../components/header/CheckoutHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { usePaymentMethods, PaymentMethodType } from "@/hooks/useOrders";
import { useCreateOrder } from "@/hooks/useCheckout";
import { useDivisions, useThanas } from "@/hooks/useLocationData";
import { getShippingForLocation, ShippingConfig, SHIPPING_OUTSIDE_DHAKA } from "@/config/shippingConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { trackInitiateCheckout, trackPurchase, setAdvancedMatchingUser } from "@/services/facebook-pixel.service";

const DEFAULT_PASSWORD = "poshplex";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const { data: paymentMethods, isLoading: loadingPaymentMethods } = usePaymentMethods(true);
  const { data: divisions } = useDivisions();
  const createOrderMutation = useCreateOrder();



  
  // Customer & Shipping Details
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    divisionId: "",
    thanaId: "",
    postalCode: "",
    notes: "",
    password: DEFAULT_PASSWORD,
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(true); // Visible by default

  // Partial payment state - works for ALL payment methods including COD
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>("");
  const [usePartialPayment, setUsePartialPayment] = useState(false);

  const { data: thanas } = useThanas(customerDetails.divisionId);

  // Payment State
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>("");
  const [paymentInfo, setPaymentInfo] = useState({
    transactionId: "",
    senderNumber: "",
    paymentProofUrl: "",
  });

  // Auto-determine shipping based on selected thana
  const selectedDivision = useMemo(() => 
    divisions?.find(d => d.id === customerDetails.divisionId),
    [divisions, customerDetails.divisionId]
  );

  const selectedThana = useMemo(() => 
    thanas?.find(t => t.id === customerDetails.thanaId),
    [thanas, customerDetails.thanaId]
  );

  // Get shipping config based on thana's shipping_cost or fallback to division-based logic
  const shippingConfig: ShippingConfig = useMemo(() => {
    if (selectedThana && selectedThana.shipping_cost !== undefined) {
      const cost = Number(selectedThana.shipping_cost);
      const isDhaka = cost <= 60;
      return {
        method: isDhaka ? 'inside_dhaka' : 'outside_dhaka',
        cost,
        estimatedDays: isDhaka ? '1-2' : '3-5',
        label: isDhaka ? 'Inside Dhaka' : 'Outside Dhaka',
      };
    }
    if (!selectedDivision && !selectedThana) {
      return SHIPPING_OUTSIDE_DHAKA;
    }
    return getShippingForLocation(selectedDivision?.name, selectedThana?.name);
  }, [selectedDivision, selectedThana]);

  const shippingCost = shippingConfig.cost;


  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  // Auto-fill customer details if logged in
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setIsLoadingCustomer(false);
          return;
        }

        // First, get the customer_account to find customer_id
        const { data: customerAccount, error: accountError } = await supabase
          .from('customer_accounts')
          .select('customer_id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (accountError || !customerAccount?.customer_id) {
          setIsLoadingCustomer(false);
          return;
        }

        // Then fetch the full customer details
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerAccount.customer_id)
          .maybeSingle();

        if (customerError || !customer) {
          setIsLoadingCustomer(false);
          return;
        }

        // Auto-fill the form with customer data
        setCustomerDetails(prev => ({
          ...prev,
          name: customer.name || prev.name,
          email: customer.email || prev.email,
          phone: customer.phone || prev.phone,
          gender: customer.gender || prev.gender,
          address: customer.address || prev.address,
          divisionId: customer.division_id || prev.divisionId,
          thanaId: customer.thana_id || prev.thanaId,
          postalCode: customer.postal_code || prev.postalCode,
        }));

      } catch (error) {
        console.warn('Error loading customer data:', error);
      } finally {
        setIsLoadingCustomer(false);
      }
    };

    loadCustomerData();
  }, []);

  // Keep Meta Advanced Matching in sync with the checkout form so CAPI events
  // (InitiateCheckout, Purchase, etc.) receive hashed em/ph/fn/ln even for guests.
  // Debounced to avoid spamming fbq init on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const name = (customerDetails.name || "").trim();
      const phone = (customerDetails.phone || "").replace(/\D/g, "");
      const email = (customerDetails.email || "").trim();
      if (!phone && !email) return;
      const [fn, ...rest] = name.split(/\s+/).filter(Boolean);
      setAdvancedMatchingUser({
        ph: phone || undefined,
        em: email || undefined,
        fn: fn || undefined,
        ln: rest.join(" ") || undefined,
        country: "bd",
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [customerDetails.name, customerDetails.phone, customerDetails.email]);

  // Fire InitiateCheckout pixel event — wait for customer auto-fill so Advanced
  // Matching identifiers (phone/email) are attached for logged-in customers.
  useEffect(() => {
    if (isLoadingCustomer) return;
    if (cartItems.length === 0) return;
    trackInitiateCheckout({
      contentIds: cartItems.map(i => i.productId || i.id),
      value: cartTotal,
      numItems: cartItems.reduce((s, i) => s + i.quantity, 0),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingCustomer]);

  const selectedPaymentMethod = paymentMethods?.find(pm => pm.id === selectedPaymentMethodId);

  // Set default payment method
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethodId]);

  const subtotal = cartTotal;
  const total = subtotal + shippingCost;

  // Calculate amounts for display
  const partialAmount = usePartialPayment ? (Number(partialPaymentAmount) || 0) : 0;
  const remainingAmount = total - partialAmount;
  const displayTotal = usePartialPayment && partialAmount > 0 ? partialAmount : total;


  const getPaymentIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'cod':
        return <Banknote className="h-5 w-5" />;
      case 'mobile_banking':
        return <Smartphone className="h-5 w-5" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />;
      default:
        return <Banknote className="h-5 w-5" />;
    }
  };

  const handleCustomerChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    // Reset thana when division changes
    if (field === 'divisionId') {
      setCustomerDetails(prev => ({ ...prev, thanaId: '' }));
    }
  };

  const handlePaymentInfoChange = (field: string, value: string) => {
    setPaymentInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!customerDetails.name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!customerDetails.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!customerDetails.address.trim()) {
      toast.error("Please enter your address");
      return false;
    }
    if (!customerDetails.gender) {
      toast.error("Please select your gender");
      return false;
    }
    if (!customerDetails.divisionId) {
      toast.error("Please select your district");
      return false;
    }
    if (!customerDetails.thanaId) {
      toast.error("Please select your thana");
      return false;
    }
    if (!selectedPaymentMethodId) {
      toast.error("Please select a payment method");
      return false;
    }
    // For manual payments, require transaction details
    if (selectedPaymentMethod && selectedPaymentMethod.type !== 'cod') {
      if (!paymentInfo.transactionId.trim()) {
        toast.error("Please enter your transaction ID");
        return false;
      }
      if (!paymentInfo.senderNumber.trim()) {
        toast.error("Please enter the sender number");
        return false;
      }
    }
    return true;
  };

  // Create customer account via edge function and auto-login
  const createCustomerAccount = async (customerId: string, phone: string, email?: string, name?: string, _password?: string) => {
    try {
      // Server always uses DEFAULT_PASSWORD; never send caller-controlled passwords
      // to the public account-creation endpoint.
      const { error } = await supabase.functions.invoke('create-customer-account', {
        body: { customerId, phone, email, name }
      });
      if (error) {
        console.warn('Error creating customer account:', error);
        return;
      }

      // Auto-login the customer after account creation
      const phoneEmail = `${phone}@phone.local`;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: phoneEmail,
        password: DEFAULT_PASSWORD,
      });

      if (signInError) {
        console.warn('Auto-login failed:', signInError);
      }
    } catch (err) {
      console.warn('Customer account creation failed:', err);
    }
  };

  // Find or create customer by phone via SECURITY DEFINER RPC.
  // Works for guests too — bypasses the "auth.uid() IS NOT NULL" insert RLS
  // that previously caused guest checkouts to silently skip customer creation.
  const findOrCreateCustomer = async (): Promise<string | null> => {
    const phone = customerDetails.phone.trim();

    try {
      const { data: customerId, error: rpcError } = await supabase.rpc(
        'upsert_checkout_customer',
        {
          p_name: customerDetails.name,
          p_phone: phone,
          p_email: customerDetails.email || null,
          p_gender: customerDetails.gender || 'other',
          p_address: customerDetails.address || null,
          p_division_id: customerDetails.divisionId || null,
          p_thana_id: customerDetails.thanaId || null,
        }
      );

      if (rpcError || !customerId) {
        console.error('Error upserting customer:', rpcError);
        return null;
      }

      // Ensure customer auth account exists + auto-login (unchanged)
      await createCustomerAccount(
        customerId as string,
        phone,
        customerDetails.email,
        customerDetails.name,
        customerDetails.password,
      );

      return customerId as string;
    } catch (error) {
      console.error('Error in findOrCreateCustomer:', error);
      return null;
    }
  };

  const handleCompleteOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Find or create customer (silently - don't block order if it fails)
      let customerId: string | null = null;
      try {
        customerId = await findOrCreateCustomer();
      } catch (customerError) {
        console.warn('Customer sync failed, continuing with guest order:', customerError);
      }

      // Step 2: Calculate paid amount for partial payments
      const orderPaidAmount = usePartialPayment && partialAmount > 0 ? partialAmount : 0;

      // Step 3: Create order with paid_amount
      const result = await createOrderMutation.mutateAsync({
        checkoutData: {
          customerId: customerId || undefined,
          guestEmail: customerDetails.email || undefined,
          guestPhone: customerDetails.phone,
          shippingName: customerDetails.name,
          shippingPhone: customerDetails.phone,
          shippingEmail: customerDetails.email || undefined,
          shippingAddress: customerDetails.address,
          shippingDivisionId: customerDetails.divisionId || undefined,
          shippingThanaId: customerDetails.thanaId || undefined,
          shippingPostalCode: customerDetails.postalCode || undefined,
          paymentMethodId: selectedPaymentMethodId,
          paymentMethodType: selectedPaymentMethod!.type as PaymentMethodType,
          transactionId: paymentInfo.transactionId || undefined,
          senderNumber: paymentInfo.senderNumber || undefined,
          paymentProofUrl: paymentInfo.paymentProofUrl || undefined,
          subtotal: subtotal,
          discountAmount: promoDiscount,
          shippingCost: shippingCost,
          paidAmount: orderPaidAmount,
          promoCodeId: appliedPromo?.id || undefined,
          promoCode: appliedPromo?.code || undefined,
          promoDiscount: promoDiscount || undefined,
          customerNotes: customerDetails.notes || undefined,
        },
        cartItems,
      });

      // Step 3: Store customer session for "auto-login"
      localStorage.setItem('poshplex_customer_phone', customerDetails.phone);
      localStorage.setItem('poshplex_customer_name', customerDetails.name);

      // Forward customer identifiers into Advanced Matching just before Purchase
      // so Meta receives hashed ph/em/fn/ln even for guest checkouts.
      const [fn, ...rest] = (customerDetails.name || "").trim().split(/\s+/).filter(Boolean);
      setAdvancedMatchingUser({
        ph: (customerDetails.phone || "").replace(/\D/g, "") || undefined,
        em: customerDetails.email || undefined,
        fn: fn || undefined,
        ln: rest.join(" ") || undefined,
        country: "bd",
      });

      // Fire Purchase pixel event (before cart is cleared by mutation onSuccess)
      trackPurchase({
        contentIds: cartItems.map(i => i.productId || i.id),
        value: total,
        numItems: cartItems.reduce((s, i) => s + i.quantity, 0),
        orderId: result.orderNumber,
      });

      // Direct redirect to orders page
      // Note: clearCart() and success toast are handled by useCreateOrder's onSuccess
      navigate('/my-orders');
      
    } catch (error) {
      console.error("Order error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty cart view
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <main className="pt-20 pb-12 relative z-0">
          <div className="max-w-md mx-auto px-6 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-2xl font-light text-foreground mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to your cart to proceed with checkout.</p>
            <Button onClick={() => navigate("/")} className="rounded-none">
              Continue Shopping
            </Button>
          </div>
        </main>
        <PoshplexFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />
      
      <main className="pt-6 pb-12 relative z-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Order Summary - Right Side */}
            <div className="lg:col-span-1 lg:order-2">
              <div className="bg-muted/20 p-6 rounded-none sticky top-6">
                <h2 className="text-lg font-light text-foreground mb-6">Order Summary</h2>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id + (item.variantId || '')} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-none overflow-hidden flex-shrink-0">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-light text-foreground text-sm truncate">{item.name}</h3>
                        {(item.color || item.size) && (
                          <p className="text-xs text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                          if (item.quantity <= 1) {
                                removeFromCart(item.id, item.variantId);
                              } else {
                                updateQuantity(item.id, item.variantId, item.quantity - 1);
                              }
                            }}
                            className="h-6 w-6 p-0 rounded-none"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
                            className="h-6 w-6 p-0 rounded-none"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-foreground font-medium text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Section */}
                <div className="mt-6 pt-4 border-t border-muted-foreground/20">
                  <div className="flex gap-2">
                    <Input
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="Write Promo Code"
                      className="flex-1 rounded-none text-sm font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-none whitespace-nowrap"
                      onClick={handleApplyPromo}
                      disabled={!discountCode.trim() || isApplyingPromo}
                    >
                      {isApplyingPromo ? "Applying..." : "Apply Promo"}
                    </Button>
                  </div>
                  {appliedPromo && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 p-2 border border-green-200 dark:border-green-800 rounded-none text-sm">
                        <span className="text-green-700 dark:text-green-400">
                          {appliedPromo.code}: {appliedPromo.freeDelivery ? 'Free Delivery!' : 
                            `-${appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : formatCurrency(appliedPromo.discount_value)}`}
                        </span>
                        <button onClick={() => { setAppliedPromo(null); setPromoDiscount(0); setDiscountCode(""); }} className="text-red-500 text-xs hover:underline">Remove</button>
                      </div>
                      {appliedPromo.membershipReward && (
                        <div className="text-xs text-purple-600 dark:text-purple-400 p-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-none">
                          🎖 Membership will be awarded after {appliedPromo.membershipReward.trigger === 'paid' ? 'payment confirmation' : 'delivery'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-muted-foreground/20 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Promo Discount</span>
                      <span>-{formatCurrency(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Shipping ({shippingConfig.label})
                      {appliedPromo?.freeDelivery && <span className="text-green-600 ml-1">(Free!)</span>}
                    </span>
                    <span className={`text-foreground ${appliedPromo?.freeDelivery ? 'line-through text-muted-foreground' : ''}`}>
                      {formatCurrency(shippingConfig.cost)}
                    </span>
                  </div>
                  {appliedPromo?.freeDelivery && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Free Delivery Discount</span>
                      <span>-{formatCurrency(shippingConfig.cost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-medium border-t border-muted-foreground/20 pt-2">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatCurrency(total)}</span>
                  </div>
                  {usePartialPayment && partialAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-primary font-medium">
                        <span>Paying Now</span>
                        <span>{formatCurrency(partialAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Due Later</span>
                        <span>{formatCurrency(remainingAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Left Column - Forms */}
            <div className="lg:col-span-2 lg:order-1 space-y-4">
              
              {/* Section 1: Profile Information */}
              <div className="bg-muted/20 p-4 rounded-none">
                <h2 className="text-base font-light text-foreground mb-3">Profile Information</h2>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-light">Full Name *</Label>
                      <Input
                        value={customerDetails.name}
                        onChange={(e) => handleCustomerChange("name", e.target.value)}
                        className="mt-1 rounded-none h-9 text-sm"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-light">Phone Number *</Label>
                      <Input
                        type="tel"
                        value={customerDetails.phone}
                        onChange={(e) => handleCustomerChange("phone", e.target.value)}
                        className="mt-1 rounded-none h-9 text-sm"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-light">Email (Optional)</Label>
                      <Input
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => handleCustomerChange("email", e.target.value)}
                        className="mt-1 rounded-none h-9 text-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-light">Gender *</Label>
                      <Select
                        value={customerDetails.gender}
                        onValueChange={(value) => handleCustomerChange("gender", value)}
                      >
                        <SelectTrigger className="mt-1 rounded-none h-9 text-sm">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Password Field with default value */}
                  <div>
                    <Label className="text-xs font-light">Password (for your account)</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={customerDetails.password}
                        onChange={(e) => handleCustomerChange("password", e.target.value)}
                        className="rounded-none pr-10 h-9 text-sm"
                        placeholder="Create a password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: poshplex (you can change it or leave as is)
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div className="bg-muted/20 p-4 rounded-none">
                <h2 className="text-base font-light text-foreground mb-3">Address</h2>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-light">Address *</Label>
                    <Input
                      value={customerDetails.address}
                      onChange={(e) => handleCustomerChange("address", e.target.value)}
                      className="mt-1 rounded-none h-9 text-sm"
                      placeholder="House no, Road no, Area"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-light">District *</Label>
                      <Select
                        value={customerDetails.divisionId}
                        onValueChange={(value) => handleCustomerChange("divisionId", value)}
                      >
                        <SelectTrigger className="mt-1 rounded-none h-9 text-sm">
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions?.map((division) => (
                            <SelectItem key={division.id} value={division.id}>
                              {division.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-light">Thana/Upazila *</Label>
                      <Select
                        value={customerDetails.thanaId}
                        onValueChange={(value) => handleCustomerChange("thanaId", value)}
                        disabled={!customerDetails.divisionId}
                      >
                        <SelectTrigger className="mt-1 rounded-none h-9 text-sm">
                          <SelectValue placeholder="Select thana" />
                        </SelectTrigger>
                        <SelectContent>
                          {thanas?.map((thana) => (
                            <SelectItem key={thana.id} value={thana.id}>
                              {thana.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Auto-determined shipping display */}
                  {(customerDetails.divisionId || customerDetails.thanaId) && (
                    <div className="flex items-center gap-3 p-3 bg-accent/30 border border-accent rounded-none">
                      <Truck className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {shippingConfig.label} Delivery
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(shippingConfig.cost)} • {shippingConfig.estimatedDays} business days
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-light">Postal Code</Label>
                    <Input
                      value={customerDetails.postalCode}
                      onChange={(e) => handleCustomerChange("postalCode", e.target.value)}
                      className="mt-1 rounded-none h-9 text-sm"
                      placeholder="1234"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-light">Order Notes (Optional)</Label>
                    <Textarea
                      value={customerDetails.notes}
                      onChange={(e) => handleCustomerChange("notes", e.target.value)}
                      className="mt-1 rounded-none text-sm"
                      placeholder="Special instructions for delivery..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-muted/20 p-4 rounded-none">
                <h2 className="text-base font-light text-foreground mb-3">Payment Method</h2>
                
                {loadingPaymentMethods ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-none" />
                    ))}
                  </div>
                ) : (
                  <RadioGroup 
                    value={selectedPaymentMethodId} 
                    onValueChange={(val) => {
                      setSelectedPaymentMethodId(val);
                      // Reset partial payment when switching to COD
                      const method = paymentMethods?.find(m => m.id === val);
                      if (method?.type === 'cod') {
                        setUsePartialPayment(false);
                        setPartialPaymentAmount("");
                      }
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-2"
                  >
                    {paymentMethods?.map((method) => (
                      <div 
                        key={method.id} 
                        className={`p-3 border rounded-none transition-colors cursor-pointer ${
                          selectedPaymentMethodId === method.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/20'
                        }`}
                        onClick={() => {
                          setSelectedPaymentMethodId(method.id);
                          if (method.type === 'cod') {
                            setUsePartialPayment(false);
                            setPartialPaymentAmount("");
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="font-light cursor-pointer flex items-center gap-1.5 flex-1 text-sm">
                            {getPaymentIcon(method.type)}
                            <span className="truncate">{method.name}</span>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Payment Instructions & Details for non-COD */}
                {selectedPaymentMethod && selectedPaymentMethod.type !== 'cod' && (
                  <div className="mt-6 space-y-4">
                    {(selectedPaymentMethod.instructions || (selectedPaymentMethod.account_details && Object.keys(selectedPaymentMethod.account_details).length > 0)) && (
                      <div className="bg-accent/50 border border-accent rounded-none p-4 space-y-2">
                        {selectedPaymentMethod.instructions && (
                          <p className="text-sm text-foreground whitespace-pre-line">
                            {selectedPaymentMethod.instructions}
                          </p>
                        )}
                        {selectedPaymentMethod.account_details && Object.keys(selectedPaymentMethod.account_details).length > 0 && (
                          <div className="space-y-1 pt-1">
                            {Object.entries(selectedPaymentMethod.account_details).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2 text-sm">
                                <span className="font-medium capitalize text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                                <span className="font-semibold text-foreground">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-light">Transaction ID *</Label>
                        <Input
                          value={paymentInfo.transactionId}
                          onChange={(e) => handlePaymentInfoChange("transactionId", e.target.value)}
                          className="mt-1 rounded-none h-9 text-sm"
                          placeholder="Enter transaction ID"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-light">Sender Number *</Label>
                        <Input
                          value={paymentInfo.senderNumber}
                          onChange={(e) => handlePaymentInfoChange("senderNumber", e.target.value)}
                          className="mt-1 rounded-none h-9 text-sm"
                          placeholder="Number you sent from"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Partial Payment Option - Available for non-COD payment methods */}
                {selectedPaymentMethod && selectedPaymentMethod.type !== 'cod' && (
                  <div className="mt-6 space-y-3 pt-4 border-t border-muted-foreground/20">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="partialPayment"
                        checked={usePartialPayment}
                        onCheckedChange={(checked) => {
                          setUsePartialPayment(checked as boolean);
                          if (!checked) setPartialPaymentAmount("");
                        }}
                      />
                      <Label htmlFor="partialPayment" className="text-sm font-light cursor-pointer">
                        I want to pay partial amount
                      </Label>
                    </div>
                    
                    {usePartialPayment && (
                      <div className="pl-6 space-y-2">
                        <Label className="text-sm font-light">Payment Amount</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">৳</span>
                          <Input
                            type="number"
                            value={partialPaymentAmount}
                            onChange={(e) => setPartialPaymentAmount(e.target.value)}
                            className="rounded-none max-w-[200px]"
                            placeholder={`Max: ${total}`}
                            min={1}
                            max={total}
                          />
                        </div>
                        <div className="bg-accent/30 p-3 rounded-none text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Paying Now:</span>
                            <span className="font-medium text-primary">{formatCurrency(partialAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining Due:</span>
                            <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Total & Button */}
                <div className="mt-6 pt-6 border-t border-muted-foreground/20">
                  <div className="bg-muted/10 p-4 rounded-none border border-muted-foreground/20 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping ({shippingConfig.label})</span>
                      <span>{formatCurrency(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-medium border-t border-muted-foreground/20 pt-2">
                      <span>Order Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    {usePartialPayment && partialAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-primary font-medium pt-2 border-t border-muted-foreground/10">
                          <span>Paying Now</span>
                          <span>{formatCurrency(partialAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Due Later</span>
                          <span>{formatCurrency(remainingAmount)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={handleCompleteOrder}
                    disabled={isProcessing || cartItems.length === 0}
                    className="w-full rounded-none h-12 text-base"
                  >
                    {isProcessing 
                      ? "Processing..." 
                      : usePartialPayment && partialAmount > 0
                        ? `Place Order • Pay ${formatCurrency(displayTotal)}`
                        : `Place Order • ${formatCurrency(total)}`
                    }
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By placing this order, you agree to our{" "}
                    <Link to="/terms" className="underline">Terms of Service</Link> and{" "}
                    <Link to="/privacy" className="underline">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PoshplexFooter />
    </div>
  );
};

export default Checkout;
