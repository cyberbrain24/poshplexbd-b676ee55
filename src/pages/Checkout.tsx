import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Check, Upload, Banknote, Smartphone, Building2, Truck, ChevronLeft, ShoppingBag } from "lucide-react";
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
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { data: paymentMethods, isLoading: loadingPaymentMethods } = usePaymentMethods(true);
  const { data: divisions } = useDivisions();
  const createOrderMutation = useCreateOrder();

  const [discountCode, setDiscountCode] = useState("");
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  
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
  });

  // Partial payment state
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

  // Shipping
  const [shippingOption, setShippingOption] = useState<"inside" | "outside">("inside");
  const shippingCost = shippingOption === "inside" ? 60 : 120;

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: string; orderId: string } | null>(null);

  const selectedPaymentMethod = paymentMethods?.find(pm => pm.id === selectedPaymentMethodId);

  // Set default payment method
  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethodId]);

  const subtotal = cartTotal;
  const total = subtotal + shippingCost;

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

  const handleCompleteOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await createOrderMutation.mutateAsync({
        checkoutData: {
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
          shippingCost: shippingCost,
          customerNotes: customerDetails.notes || undefined,
        },
        cartItems,
      });

      setCompletedOrder(result);
      setOrderComplete(true);
    } catch (error) {
      console.error("Order error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty cart view
  if (cartItems.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <main className="pt-20 pb-12">
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

  // Order Complete View
  if (orderComplete && completedOrder) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <main className="pt-12 pb-12">
          <div className="max-w-lg mx-auto px-6 text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-light text-foreground mb-2">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mb-2">Thank you for your order.</p>
            <p className="text-lg font-medium text-foreground mb-6">
              Order Number: <span className="text-primary">{completedOrder.orderNumber}</span>
            </p>

            {selectedPaymentMethod?.type !== 'cod' && (
              <div className="bg-amber-50 border border-amber-200 rounded-none p-4 mb-6 text-left">
                <p className="text-amber-800 text-sm">
                  <strong>Payment Verification:</strong> Your payment is pending verification. 
                  We'll confirm your order once we verify your transaction.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/order-tracking?orderNumber=${completedOrder.orderNumber}&phone=${customerDetails.phone}`)}
                className="w-full rounded-none"
              >
                Track Your Order
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="w-full rounded-none"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </main>
        <PoshplexFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CheckoutHeader />
      
      <main className="pt-6 pb-12">
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
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="mt-6 pt-4 border-t border-muted-foreground/20">
                  {!showDiscountInput ? (
                    <button 
                      onClick={() => setShowDiscountInput(true)}
                      className="text-sm text-foreground underline hover:no-underline"
                    >
                      Have a discount code?
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 rounded-none text-sm"
                      />
                      <Button variant="outline" size="sm" className="rounded-none">
                        Apply
                      </Button>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-muted-foreground/20 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">৳{shippingCost}</span>
                  </div>
                  <div className="flex justify-between text-lg font-medium border-t border-muted-foreground/20 pt-2">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">৳{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column - Forms */}
            <div className="lg:col-span-2 lg:order-1 space-y-6">
              
              {/* Customer & Shipping Details */}
              <div className="bg-muted/20 p-6 rounded-none">
                <h2 className="text-lg font-light text-foreground mb-6">Shipping Information</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-light">Full Name *</Label>
                      <Input
                        value={customerDetails.name}
                        onChange={(e) => handleCustomerChange("name", e.target.value)}
                        className="mt-1.5 rounded-none"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-light">Phone Number *</Label>
                      <Input
                        type="tel"
                        value={customerDetails.phone}
                        onChange={(e) => handleCustomerChange("phone", e.target.value)}
                        className="mt-1.5 rounded-none"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-light">Email (Optional)</Label>
                      <Input
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => handleCustomerChange("email", e.target.value)}
                        className="mt-1.5 rounded-none"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-light">Gender</Label>
                      <Select
                        value={customerDetails.gender}
                        onValueChange={(value) => handleCustomerChange("gender", value)}
                      >
                        <SelectTrigger className="mt-1.5 rounded-none">
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

                  <div>
                    <Label className="text-sm font-light">Address *</Label>
                    <Input
                      value={customerDetails.address}
                      onChange={(e) => handleCustomerChange("address", e.target.value)}
                      className="mt-1.5 rounded-none"
                      placeholder="House no, Road no, Area"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-light">District</Label>
                      <Select
                        value={customerDetails.divisionId}
                        onValueChange={(value) => handleCustomerChange("divisionId", value)}
                      >
                        <SelectTrigger className="mt-1.5 rounded-none">
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
                      <Label className="text-sm font-light">Thana/Upazila</Label>
                      <Select
                        value={customerDetails.thanaId}
                        onValueChange={(value) => handleCustomerChange("thanaId", value)}
                        disabled={!customerDetails.divisionId}
                      >
                        <SelectTrigger className="mt-1.5 rounded-none">
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

                  <div>
                    <Label className="text-sm font-light">Postal Code</Label>
                    <Input
                      value={customerDetails.postalCode}
                      onChange={(e) => handleCustomerChange("postalCode", e.target.value)}
                      className="mt-1.5 rounded-none"
                      placeholder="1234"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-light">Order Notes (Optional)</Label>
                    <Textarea
                      value={customerDetails.notes}
                      onChange={(e) => handleCustomerChange("notes", e.target.value)}
                      className="mt-1.5 rounded-none"
                      placeholder="Special instructions for delivery..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Options */}
              <div className="bg-muted/20 p-6 rounded-none">
                <h2 className="text-lg font-light text-foreground mb-4">Shipping Method</h2>
                
                <RadioGroup 
                  value={shippingOption} 
                  onValueChange={(v) => setShippingOption(v as "inside" | "outside")}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between p-4 border border-muted-foreground/20 rounded-none">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="inside" id="inside" />
                      <Label htmlFor="inside" className="font-light cursor-pointer flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Inside Dhaka
                      </Label>
                    </div>
                    <span className="text-sm text-muted-foreground">৳60 • 1-2 days</span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-muted-foreground/20 rounded-none">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="outside" id="outside" />
                      <Label htmlFor="outside" className="font-light cursor-pointer flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Outside Dhaka
                      </Label>
                    </div>
                    <span className="text-sm text-muted-foreground">৳120 • 3-5 days</span>
                  </div>
                </RadioGroup>
              </div>

              {/* Payment Section */}
              <div className="bg-muted/20 p-6 rounded-none">
                <h2 className="text-lg font-light text-foreground mb-4">Payment Method</h2>
                
                {loadingPaymentMethods ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted animate-pulse rounded-none" />
                    ))}
                  </div>
                ) : (
                  <RadioGroup 
                    value={selectedPaymentMethodId} 
                    onValueChange={setSelectedPaymentMethodId}
                    className="space-y-3"
                  >
                    {paymentMethods?.map((method) => (
                      <div 
                        key={method.id} 
                        className={`p-4 border rounded-none transition-colors ${
                          selectedPaymentMethodId === method.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted-foreground/20'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="font-light cursor-pointer flex items-center gap-2 flex-1">
                            {getPaymentIcon(method.type)}
                            <span>{method.name}</span>
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Payment Instructions & Details */}
                {selectedPaymentMethod && selectedPaymentMethod.type !== 'cod' && (
                  <div className="mt-6 space-y-4">
                    {selectedPaymentMethod.instructions && (
                      <div className="bg-accent/50 border border-accent rounded-none p-4">
                        <p className="text-sm text-foreground whitespace-pre-line">
                          {selectedPaymentMethod.instructions}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-light">Transaction ID *</Label>
                        <Input
                          value={paymentInfo.transactionId}
                          onChange={(e) => handlePaymentInfoChange("transactionId", e.target.value)}
                          className="mt-1.5 rounded-none"
                          placeholder="Enter transaction ID"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-light">Sender Number *</Label>
                        <Input
                          value={paymentInfo.senderNumber}
                          onChange={(e) => handlePaymentInfoChange("senderNumber", e.target.value)}
                          className="mt-1.5 rounded-none"
                          placeholder="Number you sent from"
                        />
                      </div>
                    </div>

                    {/* Partial Payment Option */}
                    <div className="space-y-3 pt-2">
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
                          I want to make a partial payment now
                        </Label>
                      </div>
                      
                      {usePartialPayment && (
                        <div className="pl-6">
                          <Label className="text-sm font-light">Payment Amount</Label>
                          <div className="flex items-center gap-2 mt-1.5">
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
                          <p className="text-xs text-muted-foreground mt-1">
                            Remaining balance (৳{(total - (Number(partialPaymentAmount) || 0)).toLocaleString()}) can be paid later
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Total & Button */}
                <div className="mt-6 pt-6 border-t border-muted-foreground/20">
                  <div className="bg-muted/10 p-4 rounded-none border border-muted-foreground/20 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>৳{shippingCost}</span>
                    </div>
                    <div className="flex justify-between text-lg font-medium border-t border-muted-foreground/20 pt-2">
                      <span>Total</span>
                      <span>৳{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteOrder}
                    disabled={isProcessing || cartItems.length === 0}
                    className="w-full rounded-none h-12 text-base"
                  >
                    {isProcessing ? "Processing..." : `Place Order • ৳${total.toLocaleString()}`}
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
