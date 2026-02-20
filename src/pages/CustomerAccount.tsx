import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Package, LogOut, Key, Eye, EyeOff, Crown, MessageSquare, Camera, Pencil, ShoppingBag, Hash, Info, CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
    birthdate: string | null;
    profile_image_url: string | null;
    division_id: string | null;
    thana_id: string | null;
    postal_code: string | null;
    customer_type_id: string | null;
    membership_assigned_at: string | null;
    customer_type?: {
      name: string;
      description: string | null;
    } | null;
    division?: { id: string; name: string } | null;
    thana?: { id: string; name: string } | null;
  } | null;
}

interface CustomerStats {
  total_spent: number;
  order_count: number;
}

interface Division {
  id: string;
  name: string;
}

interface Thana {
  id: string;
  name: string;
  division_id: string;
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
  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", address: "",
    gender: "", division_id: "", thana_id: "", postal_code: "", birthdate: "",
  });
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
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

    // Fetch divisions
    supabase.from("divisions").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => setDivisions(data || []));

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch thanas when division changes
  useEffect(() => {
    if (editForm.division_id) {
      supabase.from("thanas").select("id, name, division_id")
        .eq("division_id", editForm.division_id).eq("is_active", true).order("name")
        .then(({ data }) => setThanas(data || []));
    } else {
      setThanas([]);
    }
  }, [editForm.division_id]);

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
          .select("name, phone, email, address, gender, birthdate, profile_image_url, division_id, thana_id, postal_code, customer_type_id, membership_assigned_at")
          .eq("id", data.customer_id)
          .maybeSingle();

        let customerType = null;
        let division = null;
        let thana = null;

        if (customerData?.customer_type_id) {
          const { data: typeData } = await supabase
            .from("customer_types")
            .select("name, description")
            .eq("id", customerData.customer_type_id)
            .maybeSingle();
          customerType = typeData;
        }

        if (customerData?.division_id) {
          const { data: divData } = await supabase
            .from("divisions").select("id, name").eq("id", customerData.division_id).maybeSingle();
          division = divData;
        }

        if (customerData?.thana_id) {
          const { data: thanaData } = await supabase
            .from("thanas").select("id, name").eq("id", customerData.thana_id).maybeSingle();
          thana = thanaData;
        }

        setAccountData({
          ...data,
          customer: customerData ? { ...customerData, membership_assigned_at: customerData.membership_assigned_at ?? null, customer_type: customerType, division, thana } : null,
        });

        if (customerData) {
          setEditForm({
            name: customerData.name || "",
            email: customerData.email || "",
            phone: customerData.phone || "",
            address: customerData.address || "",
            gender: customerData.gender || "",
            division_id: customerData.division_id || "",
            thana_id: customerData.thana_id || "",
            postal_code: customerData.postal_code || "",
            birthdate: customerData.birthdate || "",
          });
        }

        // Fetch customer stats
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
    if (file.size > 300 * 1024) { toast.error("Image must be less than 300 KB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (!accountData?.customer_id) return;

    setIsUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${accountData.customer_id}/profile.${ext}`;
      const { error: uploadError } = await supabase.storage.from("profile-images").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      const { error: updateError } = await supabase.from("customers").update({ profile_image_url: publicUrl }).eq("id", accountData.customer_id);
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
    if (!editForm.name.trim()) { toast.error("Name is required"); return; }
    if (!editForm.phone.trim()) { toast.error("Phone is required"); return; }
    if (!editForm.gender) { toast.error("Gender is required"); return; }
    if (!editForm.address?.trim()) { toast.error("Address is required"); return; }
    if (!editForm.division_id) { toast.error("District is required"); return; }
    if (!editForm.thana_id) { toast.error("Thana/Upazila is required"); return; }
    if (!editForm.postal_code?.trim()) { toast.error("Postal code is required"); return; }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone,
          address: editForm.address || null,
          gender: editForm.gender,
          birthdate: editForm.birthdate || null,
          division_id: editForm.division_id || null,
          thana_id: editForm.thana_id || null,
          postal_code: editForm.postal_code || null,
        })
        .eq("id", accountData.customer_id);

      if (error) throw error;

      await supabase
        .from("customer_accounts")
        .update({ phone: editForm.phone, email: editForm.email || null })
        .eq("customer_id", accountData.customer_id);

      // Update local state with division/thana names
      const selectedDiv = divisions.find(d => d.id === editForm.division_id);
      const selectedThana = thanas.find(t => t.id === editForm.thana_id);

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
          gender: editForm.gender,
          birthdate: editForm.birthdate || null,
          division_id: editForm.division_id || null,
          thana_id: editForm.thana_id || null,
          postal_code: editForm.postal_code || null,
          division: selectedDiv ? { id: selectedDiv.id, name: selectedDiv.name } : null,
          thana: selectedThana ? { id: selectedThana.id, name: selectedThana.name } : null,
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
  const membershipDescription = accountData?.customer?.customer_type?.description || null;
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

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <h1 className="text-xl font-medium tracking-tight mb-4">My Account</h1>

        <div className="space-y-3">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Information
                </CardTitle>
                {!isEditingProfile && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    const c = accountData?.customer;
                    setEditForm({
                      name: c?.name || "",
                      email: c?.email || accountData?.email || "",
                      phone: c?.phone || accountData?.phone || "",
                      address: c?.address || "",
                      gender: c?.gender || "",
                      division_id: c?.division_id || "",
                      thana_id: c?.thana_id || "",
                      postal_code: c?.postal_code || "",
                      birthdate: c?.birthdate || "",
                    });
                    setIsEditingProfile(true);
                  }}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {/* Profile Image */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90">
                    <Camera className="h-3.5 w-3.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={isUploadingImage} />
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
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm">Name *</Label>
                      <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">Phone *</Label>
                      <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">Gender *</Label>
                      <Select value={editForm.gender} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm">Address *</Label>
                      <Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm">District *</Label>
                      <Select value={editForm.division_id} onValueChange={v => setEditForm(f => ({ ...f, division_id: v, thana_id: "" }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
                        <SelectContent>
                          {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Thana/Upazila *</Label>
                      <Select value={editForm.thana_id} onValueChange={v => setEditForm(f => ({ ...f, thana_id: v }))} disabled={!editForm.division_id}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder={editForm.division_id ? "Select thana" : "Select district first"} /></SelectTrigger>
                        <SelectContent>
                          {thanas.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Postal Code *</Label>
                      <Input value={editForm.postal_code} onChange={e => setEditForm(f => ({ ...f, postal_code: e.target.value }))} className="mt-1" placeholder="e.g. 1205" />
                    </div>
                    <div>
                      <Label className="text-sm">Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full mt-1 justify-start text-left font-normal",
                              !editForm.birthdate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editForm.birthdate ? format(new Date(editForm.birthdate), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editForm.birthdate ? new Date(editForm.birthdate) : undefined}
                            onSelect={(date) => setEditForm(f => ({ ...f, birthdate: date ? format(date, "yyyy-MM-dd") : "" }))}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <Label className="text-muted-foreground text-sm">Gender</Label>
                    <p className="font-medium capitalize">{accountData?.customer?.gender || "Not set"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-muted-foreground text-sm">Address</Label>
                    <p className="font-medium">{accountData?.customer?.address || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">District</Label>
                    <p className="font-medium">{accountData?.customer?.division?.name || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Thana/Upazila</Label>
                    <p className="font-medium">{accountData?.customer?.thana?.name || "Not set"}</p>
                  </div>
                   <div>
                    <Label className="text-muted-foreground text-sm">Postal Code</Label>
                    <p className="font-medium">{accountData?.customer?.postal_code || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Date of Birth</Label>
                    <p className="font-medium">{accountData?.customer?.birthdate ? format(new Date(accountData.customer.birthdate), "PPP") : "Not set"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Card with Stats */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{membershipType}</p>
                    {membershipDescription && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 text-sm">
                          <p className="font-medium mb-1">{membershipType}</p>
                          <p className="text-muted-foreground">{membershipDescription}</p>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  {accountData?.customer?.membership_assigned_at && (
                    <p className="text-sm text-muted-foreground">Member since {new Date(accountData.customer.membership_assigned_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
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
            <CardContent className="py-3 px-4">
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
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                My Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <MyReviews customerId={accountData?.customer_id || null} />
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
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
