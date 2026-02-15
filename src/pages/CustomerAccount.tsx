import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Eye, EyeOff, Camera, Pencil, Crown, Info, Menu, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import MyReviews from "@/components/account/MyReviews";
import AddressManager from "@/components/account/AddressManager";
import DashboardSidebar, { type DashboardSection } from "@/components/account/DashboardSidebar";
import DashboardSummaryCards from "@/components/account/DashboardSummaryCards";
import DashboardOrdersWidget from "@/components/account/DashboardOrdersWidget";
import { useCustomerAddresses } from "@/hooks/useCustomerAddresses";
import { formatCurrency } from "@/lib/currency";
import { useIsMobile } from "@/hooks/use-mobile";
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
    postal_code: string | null;
    customer_type_id: string | null;
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

interface Division { id: string; name: string }
interface Thana { id: string; name: string; division_id: string }

const CustomerAccount = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [accountData, setAccountData] = useState<CustomerAccountData | null>(null);
  const [customerStats, setCustomerStats] = useState({ total_spent: 0, order_count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", address: "",
    gender: "", division_id: "", thana_id: "", postal_code: "",
  });
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: addresses = [] } = useCustomerAddresses(accountData?.customer_id || null);

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

    supabase.from("divisions").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => setDivisions(data || []));

    return () => subscription.unsubscribe();
  }, [navigate]);

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
          .select("name, phone, email, address, gender, profile_image_url, division_id, thana_id, postal_code, customer_type_id")
          .eq("id", data.customer_id)
          .maybeSingle();

        let customerType = null;
        let division = null;
        let thana = null;

        if (customerData?.customer_type_id) {
          const { data: typeData } = await supabase
            .from("customer_types").select("name, description").eq("id", customerData.customer_type_id).maybeSingle();
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
          customer: customerData ? { ...customerData, customer_type: customerType, division, thana } : null,
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
          });
        }

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

  const handleSectionChange = (section: DashboardSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

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

  const sidebarContent = (
    <DashboardSidebar
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      onLogout={handleLogout}
      displayName={displayName}
      profileImageUrl={profileImageUrl}
      membershipType={membershipType}
    />
  );

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <PoshplexHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight normal-case">My Dashboard</h1>
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Summary Cards */}
        <div className="mb-6">
          <DashboardSummaryCards
            totalOrders={customerStats.order_count}
            totalSpent={customerStats.total_spent}
            membershipType={membershipType}
            addressCount={addresses.length}
          />
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-56 flex-shrink-0">
              <div className="bg-card border border-border rounded-xl shadow-sm sticky top-24 py-4">
                {sidebarContent}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Profile Section */}
            {activeSection === "profile" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold flex items-center gap-2 normal-case">
                    <User className="h-5 w-5" />
                    Profile Information
                  </h2>
                  {!isEditingProfile && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="rounded-lg">
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>

                {/* Avatar row */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center ring-2 ring-border">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center cursor-pointer hover:bg-foreground/80 transition-colors">
                      <Camera className="h-4 w-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={isUploadingImage} />
                    </label>
                  </div>
                  <div>
                    <p className="font-bold text-lg normal-case">{displayName}</p>
                    <p className="text-sm text-muted-foreground normal-case">{displayPhone}</p>
                    <p className="text-sm text-muted-foreground normal-case">{displayEmail}</p>
                    {isUploadingImage && <p className="text-xs text-muted-foreground normal-case">Uploading...</p>}
                  </div>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Name *</Label>
                        <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1 rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-sm">Phone *</Label>
                        <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-sm">Email</Label>
                        <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1 rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-sm">Gender *</Label>
                        <Select value={editForm.gender} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
                          <SelectTrigger className="mt-1 rounded-lg"><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-sm">Address</Label>
                        <Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="mt-1 rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-sm">District</Label>
                        <Select value={editForm.division_id} onValueChange={v => setEditForm(f => ({ ...f, division_id: v, thana_id: "" }))}>
                          <SelectTrigger className="mt-1 rounded-lg"><SelectValue placeholder="Select district" /></SelectTrigger>
                          <SelectContent>
                            {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Thana/Upazila</Label>
                        <Select value={editForm.thana_id} onValueChange={v => setEditForm(f => ({ ...f, thana_id: v }))} disabled={!editForm.division_id}>
                          <SelectTrigger className="mt-1 rounded-lg"><SelectValue placeholder={editForm.division_id ? "Select thana" : "Select district first"} /></SelectTrigger>
                          <SelectContent>
                            {thanas.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Postal Code</Label>
                        <Input value={editForm.postal_code} onChange={e => setEditForm(f => ({ ...f, postal_code: e.target.value }))} className="mt-1 rounded-lg" placeholder="e.g. 1205" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveProfile} disabled={isUpdating} size="sm" className="rounded-lg">
                        {isUpdating ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)} className="rounded-lg">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">Name</p>
                      <p className="font-medium normal-case">{displayName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">Phone</p>
                      <p className="font-medium normal-case">{displayPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">Email</p>
                      <p className="font-medium normal-case">{displayEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">Gender</p>
                      <p className="font-medium capitalize normal-case">{accountData?.customer?.gender || "Not set"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">Address</p>
                      <p className="font-medium normal-case">{accountData?.customer?.address || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">District</p>
                      <p className="font-medium normal-case">{accountData?.customer?.division?.name || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">Thana</p>
                      <p className="font-medium normal-case">{accountData?.customer?.thana?.name || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider normal-case">Postal Code</p>
                      <p className="font-medium normal-case">{accountData?.customer?.postal_code || "Not set"}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Section */}
            {activeSection === "addresses" && accountData?.customer_id && (
              <div className="[&_.rounded-lg]:rounded-xl">
                <AddressManager customerId={accountData.customer_id} />
              </div>
            )}

            {/* Orders Section */}
            {activeSection === "orders" && (
              <DashboardOrdersWidget customerId={accountData?.customer_id || null} />
            )}

            {/* Membership Section */}
            {activeSection === "membership" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-5 normal-case">
                  <Crown className="h-5 w-5" />
                  Membership
                </h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                    <Crown className="h-7 w-7 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg normal-case">{membershipType}</p>
                      {membershipDescription && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 text-sm rounded-xl">
                            <p className="font-medium mb-1 normal-case">{membershipType}</p>
                            <p className="text-muted-foreground normal-case">{membershipDescription}</p>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground normal-case">
                      Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="bg-muted/40 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1 normal-case">Total Spent</p>
                    <p className="text-xl font-bold normal-case">{formatCurrency(customerStats.total_spent)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1 normal-case">Total Orders</p>
                    <p className="text-xl font-bold normal-case">{customerStats.order_count}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {activeSection === "reviews" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <h2 className="text-lg font-semibold mb-4 normal-case">My Reviews</h2>
                <MyReviews customerId={accountData?.customer_id || null} />
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <h2 className="text-lg font-semibold mb-5 normal-case">Security</h2>
                {!isChangingPassword ? (
                  <Button variant="outline" onClick={() => setIsChangingPassword(true)} className="rounded-lg">
                    Change Password
                  </Button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
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
                          className="rounded-lg"
                        />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowNewPassword(!showNewPassword)}>
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
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isUpdating} className="rounded-lg">
                        {isUpdating ? "Updating..." : "Update Password"}
                      </Button>
                      <Button type="button" variant="outline" className="rounded-lg" onClick={() => { setIsChangingPassword(false); setNewPassword(""); setConfirmPassword(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <PoshplexFooter />
    </div>
  );
};

export default CustomerAccount;
