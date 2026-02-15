import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Eye, EyeOff, Camera, Pencil, Crown, Info, Menu, MapPin, Package, MessageSquare, Key, LogOut, ChevronRight } from "lucide-react";
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
    name: "",
    email: "",
    phone: "",
    address: "",
    gender: "",
    division_id: "",
    thana_id: "",
    postal_code: "",
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

  // ===== Shared section components =====

  const ProfileHero = () => (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center ring-2 ring-border">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
          )}
        </div>
        <label className="absolute -bottom-1 -right-1 h-7 w-7 md:h-8 md:w-8 rounded-full bg-foreground text-background flex items-center justify-center cursor-pointer hover:bg-foreground/80 transition-colors">
          <Camera className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={isUploadingImage} />
        </label>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-xl md:text-lg leading-tight normal-case truncate">{displayName}</p>
        <p className="text-sm text-muted-foreground normal-case">{displayPhone}</p>
        <p className="text-sm text-muted-foreground normal-case">{displayEmail}</p>
        {isUploadingImage && <p className="text-xs text-muted-foreground normal-case">Uploading...</p>}
      </div>
    </div>
  );

  const ProfileEditForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Name *</Label>
          <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1 rounded-[10px]" />
        </div>
        <div>
          <Label className="text-sm">Phone *</Label>
          <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 rounded-[10px]" />
        </div>
        <div>
          <Label className="text-sm">Email</Label>
          <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1 rounded-[10px]" />
        </div>
        <div>
          <Label className="text-sm">Gender *</Label>
          <Select value={editForm.gender} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
            <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-sm">Address</Label>
          <Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="mt-1 rounded-[10px]" />
        </div>
        <div>
          <Label className="text-sm">District</Label>
          <Select value={editForm.division_id} onValueChange={v => setEditForm(f => ({ ...f, division_id: v, thana_id: "" }))}>
            <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder="Select district" /></SelectTrigger>
            <SelectContent>
              {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Thana/Upazila</Label>
          <Select value={editForm.thana_id} onValueChange={v => setEditForm(f => ({ ...f, thana_id: v }))} disabled={!editForm.division_id}>
            <SelectTrigger className="mt-1 rounded-[10px]"><SelectValue placeholder={editForm.division_id ? "Select thana" : "Select district first"} /></SelectTrigger>
            <SelectContent>
              {thanas.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Postal Code</Label>
          <Input value={editForm.postal_code} onChange={e => setEditForm(f => ({ ...f, postal_code: e.target.value }))} className="mt-1 rounded-[10px]" placeholder="e.g. 1205" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSaveProfile} disabled={isUpdating} size="sm" className="rounded-[10px]">
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)} className="rounded-[10px]">Cancel</Button>
      </div>
    </div>
  );

  const ProfileReadOnly = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
      <div>
        <p className="text-xs text-muted-foreground tracking-wider normal-case">Name</p>
        <p className="font-medium normal-case">{displayName}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground tracking-wider normal-case">Phone</p>
        <p className="font-medium normal-case">{displayPhone}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground tracking-wider normal-case">Email</p>
        <p className="font-medium normal-case">{displayEmail}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground tracking-wider normal-case">Gender</p>
        <p className="font-medium capitalize normal-case">{accountData?.customer?.gender || "Not set"}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-xs text-muted-foreground tracking-wider normal-case">Address</p>
        <p className="font-medium normal-case">{accountData?.customer?.address || "Not set"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground tracking-wider normal-case">District</p>
        <p className="font-medium normal-case">{accountData?.customer?.division?.name || "Not set"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground tracking-wider normal-case">Thana</p>
        <p className="font-medium normal-case">{accountData?.customer?.thana?.name || "Not set"}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground tracking-wider normal-case">Postal Code</p>
        <p className="font-medium normal-case">{accountData?.customer?.postal_code || "Not set"}</p>
      </div>
    </div>
  );

  const ProfileSection = () => (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 normal-case">
          <User className="h-4 w-4 md:h-5 md:w-5" />
          Profile
        </h2>
        {!isEditingProfile && (
          <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="rounded-[10px] text-xs h-8">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        )}
      </div>
      {isEditingProfile ? <ProfileEditForm /> : <ProfileReadOnly />}
    </section>
  );

  const AddressesSection = () => (
    <section className="animate-fade-in">
      <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-4 normal-case">
        <MapPin className="h-4 w-4 md:h-5 md:w-5" />
        Saved Addresses
      </h2>
      {accountData?.customer_id && (
        <div className="[&_.rounded-lg]:rounded-[14px]">
          <AddressManager customerId={accountData.customer_id} />
        </div>
      )}
    </section>
  );

  const OrdersSection = () => (
    <section className="animate-fade-in">
      <DashboardOrdersWidget customerId={accountData?.customer_id || null} />
    </section>
  );

  const MembershipSection = () => (
    <section className="animate-fade-in">
      <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-4 normal-case">
        <Crown className="h-4 w-4 md:h-5 md:w-5" />
        Membership
      </h2>
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 md:h-14 md:w-14 rounded-[14px] bg-muted flex items-center justify-center">
          <Crown className="h-6 w-6 md:h-7 md:w-7 text-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-base md:text-lg normal-case">{membershipType}</p>
            {membershipDescription && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-sm rounded-[14px]">
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
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="bg-muted/40 rounded-[14px] p-4">
          <p className="text-xs text-muted-foreground mb-1 normal-case">Total Spent</p>
          <p className="text-lg md:text-xl font-bold normal-case">{formatCurrency(customerStats.total_spent)}</p>
        </div>
        <div className="bg-muted/40 rounded-[14px] p-4">
          <p className="text-xs text-muted-foreground mb-1 normal-case">Total Orders</p>
          <p className="text-lg md:text-xl font-bold normal-case">{customerStats.order_count}</p>
        </div>
      </div>
    </section>
  );

  const ReviewsSection = () => (
    <section className="animate-fade-in">
      <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-4 normal-case">
        <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
        My Reviews
      </h2>
      <MyReviews customerId={accountData?.customer_id || null} />
    </section>
  );

  const SecuritySection = () => (
    <section className="animate-fade-in">
      <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-4 normal-case">
        <Key className="h-4 w-4 md:h-5 md:w-5" />
        Security
      </h2>
      {!isChangingPassword ? (
        <Button variant="outline" onClick={() => setIsChangingPassword(true)} className="rounded-[10px]">
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
                className="rounded-[10px]"
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
              className="rounded-[10px]"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isUpdating} className="rounded-[10px]">
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
            <Button type="button" variant="outline" className="rounded-[10px]" onClick={() => { setIsChangingPassword(false); setNewPassword(""); setConfirmPassword(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );

  // ===== MOBILE: Single scroll, all sections =====
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PoshplexHeader />

        <div className="flex-1 px-4 pt-6 pb-20">
          {/* Profile Hero */}
          <div className="mb-7 animate-fade-in">
            <ProfileHero />
          </div>

          {/* Stats Row */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "50ms" }}>
            <DashboardSummaryCards
              totalOrders={customerStats.order_count}
              totalSpent={customerStats.total_spent}
              membershipType={membershipType}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-8" />

          {/* All sections stacked */}
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-[14px] shadow-sm p-4">
              <ProfileSection />
            </div>

            <div className="bg-card border border-border rounded-[14px] shadow-sm p-4">
              <AddressesSection />
            </div>

            <div className="[&>section>div]:rounded-[14px]">
              <OrdersSection />
            </div>

            <div className="bg-card border border-border rounded-[14px] shadow-sm p-4">
              <MembershipSection />
            </div>

            <div className="bg-card border border-border rounded-[14px] shadow-sm p-4">
              <ReviewsSection />
            </div>

            <div className="bg-card border border-border rounded-[14px] shadow-sm p-4">
              <SecuritySection />
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-destructive border border-destructive/20 rounded-[14px] hover:bg-destructive/5 transition-colors active:scale-[0.98] normal-case"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <PoshplexFooter />
      </div>
    );
  }

  // ===== DESKTOP: Sidebar + content =====
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <PoshplexHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight normal-case">My Dashboard</h1>
        </div>

        {/* Summary Cards */}
        <div className="mb-6">
          <DashboardSummaryCards
            totalOrders={customerStats.order_count}
            totalSpent={customerStats.total_spent}
            membershipType={membershipType}
          />
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl shadow-sm sticky top-24 py-4">
              {sidebarContent}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            {activeSection === "profile" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                {/* Avatar row */}
                <div className="mb-6">
                  <ProfileHero />
                </div>
                <ProfileSection />
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <AddressesSection />
              </div>
            )}

            {activeSection === "orders" && <OrdersSection />}

            {activeSection === "membership" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <MembershipSection />
              </div>
            )}

            {activeSection === "reviews" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <ReviewsSection />
              </div>
            )}

            {activeSection === "security" && (
              <div className="bg-card border border-border rounded-xl shadow-sm p-5 md:p-6">
                <SecuritySection />
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
