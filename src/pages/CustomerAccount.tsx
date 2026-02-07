import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Package, LogOut, Key, Eye, EyeOff, Crown } from "lucide-react";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface CustomerAccountData {
  id: string;
  phone: string | null;
  email: string | null;
  customer_id: string | null;
  customer?: {
    name: string;
    customer_type_id: string | null;
    customer_type?: {
      name: string;
    } | null;
  } | null;
}

const CustomerAccount = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [accountData, setAccountData] = useState<CustomerAccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session?.user) {
        navigate("/login", { replace: true });
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/login", { replace: true });
      } else {
        setUser(session.user);
        fetchAccountData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAccountData = async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_accounts")
        .select(`
          id,
          phone,
          email,
          customer_id
        `)
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (error) throw error;

      if (data?.customer_id) {
        // Fetch customer details with customer type
        const { data: customerData } = await supabase
          .from("customers")
          .select(`
            name,
            customer_type_id
          `)
          .eq("id", data.customer_id)
          .maybeSingle();

        if (customerData?.customer_type_id) {
          const { data: typeData } = await supabase
            .from("customer_types")
            .select("name")
            .eq("id", customerData.customer_type_id)
            .maybeSingle();

          setAccountData({
            ...data,
            customer: {
              ...customerData,
              customer_type: typeData
            }
          });
        } else {
          setAccountData({
            ...data,
            customer: customerData
          });
        }
      } else {
        setAccountData(data);
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = user?.user_metadata?.name || accountData?.customer?.name || "Customer";
  const displayPhone = accountData?.phone || user?.phone || "Not set";
  const displayEmail = accountData?.email || (user?.email?.includes("@phone.local") ? "Not set" : user?.email) || "Not set";
  const membershipType = accountData?.customer?.customer_type?.name || "Standard";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PoshplexHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
        <PoshplexFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PoshplexHeader />

      <div className="flex-1 px-6 py-12 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-medium tracking-tight mb-8">My Account</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Name</Label>
                  <p className="font-medium">{displayName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Phone</Label>
                  <p className="font-medium">{displayPhone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium">{displayEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{membershipType}</p>
                  <p className="text-sm text-muted-foreground">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History Link */}
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/my-orders")}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <span className="font-medium">Order History</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button 
                  variant="outline" 
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full sm:w-auto"
                >
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Update Password"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Logout */}
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <PoshplexFooter />
    </div>
  );
};

export default CustomerAccount;
