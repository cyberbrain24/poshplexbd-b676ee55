import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight,
  ShoppingBag,
  LogOut,
  AlertCircle
} from "lucide-react";
import CheckoutHeader from "@/components/header/CheckoutHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const getOrderStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
    case 'confirmed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Confirmed</Badge>;
    case 'processing':
      return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Processing</Badge>;
    case 'shipped':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Shipped</Badge>;
    case 'delivered':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    case 'rto':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">RTO</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case 'pending_verification':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
    case 'unpaid':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">COD</Badge>;
    case 'partial':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Partial</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  line_total: number;
  variant_details: { color?: string; size?: string; image?: string } | null;
}

interface Order {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);

  useEffect(() => {
    // Get customer phone from localStorage (set during checkout)
    const storedPhone = localStorage.getItem('poshplex_customer_phone');
    if (!storedPhone) {
      // No customer session, redirect to home
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
          id,
          order_number,
          order_status,
          payment_status,
          total_amount,
          created_at,
          items:order_items(
            id,
            product_name,
            quantity,
            line_total,
            variant_details
          )
        `)
        .or(`shipping_phone.eq.${phone},guest_phone.eq.${phone}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Cast to Order[] since we know the structure
      const ordersData = (data || []).map(order => ({
        ...order,
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          line_total: item.line_total,
          variant_details: item.variant_details as { color?: string; size?: string; image?: string } | null,
        })),
      })) as Order[];
      setOrders(ordersData);
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

  const handleViewOrder = (order: Order) => {
    navigate(`/order-tracking?orderNumber=${order.order_number}&phone=${customerPhone}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CheckoutHeader />
        <main className="pt-8 pb-12">
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
      <CheckoutHeader />
      
      <main className="pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-light text-foreground">My Orders</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: {customerPhone}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-none">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-muted/20 p-12 rounded-none text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-light text-foreground mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground text-sm mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button onClick={() => navigate('/')} className="rounded-none">
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-muted/20 p-6 rounded-none border border-muted-foreground/10 hover:border-muted-foreground/20 transition-colors cursor-pointer"
                  onClick={() => handleViewOrder(order)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order Info */}
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

                    {/* Order Items Preview */}
                    <div className="flex items-center gap-2">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div 
                          key={item.id} 
                          className="w-12 h-12 bg-muted rounded-none overflow-hidden flex-shrink-0"
                        >
                          {item.variant_details?.image ? (
                            <img 
                              src={item.variant_details.image} 
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <div className="w-12 h-12 bg-muted rounded-none flex items-center justify-center text-xs text-muted-foreground">
                          +{(order.items?.length || 0) - 3}
                        </div>
                      )}
                    </div>

                    {/* Total & Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-foreground">৳{order.total_amount?.toLocaleString()}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue Shopping */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => navigate('/')} className="rounded-none">
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>

      <PoshplexFooter />
    </div>
  );
};

export default MyOrders;
