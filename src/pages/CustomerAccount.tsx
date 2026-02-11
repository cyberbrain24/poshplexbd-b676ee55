import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Package, LogOut, Key, Eye, EyeOff, Crown, MessageSquare, Camera, Pencil, ShoppingBag, Hash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import MyReviews from "@/components/account/MyReviews";
import { formatCurrency } from "@/lib/currency";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface CustomerAccountData {
  id: string;
  phone: string | null;
  email: string | null;
  customer_id: string | null;
  customer?: {
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    gender: string;
    profile_image_url: string | null;
    division_id: string | null;
    thana_id: string | null;
    customer_type_id: string | null;
    customer_type?: {
      name: string;
    } | null;
  } | null;
}

interface CustomerStats {
  total_spent: number;
  order_count: number;
}

const CustomerAccount = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [accountData, setAccountData] = useState<CustomerAccountData | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({ total_spent: 0, order_count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "" });
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
        .select("id, phone, email, customer_id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (error) throw error;

      if (data?.customer_id) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("name, phone, email, address, gender, profile_image_url, division_id, thana_id, customer_type_id")
          .eq("id", data.customer_id)
          .maybeSingle();

        let customerType = null;
        if (customerData?.customer_type_id) {
          const { data: typeData } = await supabase
            .from("customer_types")
            .select("name")
            .eq("id", customerData.customer_type_id)
            .maybeSingle();
          customerType = typeData;
        }

        setAccountData({
          ...data,
          customer: customerData ? { ...customerData, customer_type: customerType } : null,
        });

        if (customerData) {
          setEditForm({
            name: customerData.name || "",
            email: customerData.email || "",
            phone: customerData.phone || "",
            address: customerData.address || "",
          });
        }

        // Fetch customer stats (total spend + order count)
        const { data: orders } = await supabase
          .from("orders")
          .select("total_amount, order_status")
          .eq("customer_id", data.customer_id)
          .not("order_status", "in", '("cancelled","failed","returned")');

        if (orders) {
          setCustomerStats({
            total_spent: orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
            order_count: orders.length,
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
    if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setIsChangingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 300KB limit
    if (file.size > 300 * 1024) {
      toast.error("Image must be less than 300 KB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (!accountData?.customer_id) return;

    setIsUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${accountData.customer_id}/profile.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + "?t=" + Date.now();

      const { error: updateError } = await supabase
        .from("customers")
        .update({ profile_image_url: publicUrl })
        .eq("id", accountData.customer_id);

      if (updateError) throw updateError;

      setAccountData(prev => prev ? {
        ...prev,
        customer: prev.customer ? { ...prev.customer, profile_image_url: publicUrl } : prev.customer,
      } : prev);

      toast.success("Profile image updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!accountData?.customer_id) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone,
          address: editForm.address || null,
        })
        .eq("id", accountData.customer_id);

      if (error) throw error;

      // Also update customer_accounts
      await supabase
        .from("customer_accounts")
        .update({ phone: editForm.phone, email: editForm.email || null })
        .eq("customer_id", accountData.customer_id);

      setAccountData(prev => prev ? {
        ...prev,
        phone: editForm.phone,
        email: editForm.email,
        customer: prev.customer ? {
          ...prev.customer,
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone,
          address: editForm.address || null,
        } : prev.customer,
      } : prev);

      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = editForm.name || user?.user_metadata?.name || accountData?.customer?.name || "Customer";
  const displayPhone = accountData?.phone || user?.phone || "Not set";
  const displayEmail = accountData?.email || (user?.email?.includes("@phone.local") ? "Not set" : user?.email) || "Not set";
  const membershipType = accountData?.customer?.customer_type?.name || "Standard";
  const profileImageUrl = accountData?.customer?.profile_image_url;

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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                {!isEditingProfile && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(true)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Image */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90">
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
                <div>
                  <p className="font-medium">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{displayPhone}</p>
                  {isUploadingImage && <p className="text-xs text-muted-foreground">Uploading...</p>}
                  <p className="text-xs text-muted-foreground">Max 300 KB</p>
                </div>
              </div>

              {isEditingProfile ? (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Name</Label>
                      <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">Phone</Label>
                      <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">Address</Label>
                      <Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={isUpdating} size="sm">
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
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
                  <div>
                    <Label className="text-muted-foreground text-sm">Address</Label>
                    <p className="font-medium">{accountData?.customer?.address || "Not set"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Card with Stats */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{membershipType}</p>
                  <p className="text-sm text-muted-foreground">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="font-semibold">{formatCurrency(customerStats.total_spent)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Orders</p>
                    <p className="font-semibold">{customerStats.order_count}</p>
                  </div>
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

          {/* My Reviews */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                My Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MyReviews customerId={accountData?.customer_id || null} />
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <Button variant="outline" onClick={() => setIsChangingPassword(true)} className="w-full sm:w-auto">
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
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowNewPassword(!showNewPassword)}>
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required minLength={6} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isUpdating}>{isUpdating ? "Updating..." : "Update Password"}</Button>
                    <Button type="button" variant="outline" onClick={() => { setIsChangingPassword(false); setNewPassword(""); setConfirmPassword(""); }}>Cancel</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Logout */}
          <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
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
