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

  // Fetch thanas when division changes in edit form
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

        const fullAccountData = {
          ...data,
          customer: customerData ? { ...customerData, membership_assigned_at: customerData.membership_assigned_at ?? null, customer_type: customerType, division, thana } : null,
        };

        setAccountData(fullAccountData);

        // Pre-populate edit form
        if (customerData) {
          setEditForm({
            name: customerData.name || "",
            email: customerData.email || "",
            phone: customerData.phone || data.phone || "",
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
        // Pre-populate phone/email from account if no customer linked
        if (data) {
          setEditForm(f => ({
            ...f,
            phone: data.phone || "",
            email: data.email || "",
          }));
        }
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

      // Re-authenticate with the new password to maintain the session
      const email = user?.email;
      if (email) {
        await supabase.auth.signInWithPassword({ email, password: newPassword });
      }

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
    if (!editForm.name.trim()) { toast.error("Name is required"); return; }
    if (!editForm.phone.trim()) { toast.error("Phone is required"); return; }

    setIsUpdating(true);
    try {
      let customerId = accountData?.customer_id;

      // If no customer record is linked, find by phone or create one
      if (!customerId) {
        const phone = editForm.phone.trim();

        // Try to find existing customer by phone
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", phone)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create a new customer record
          const { data: newCustomer, error: createError } = await supabase
            .from("customers")
            .insert({
              name: editForm.name.trim(),
              phone: phone,
              email: editForm.email.trim() || null,
              gender: (editForm.gender as 'male' | 'female' | 'other') || "other",
              is_active: true,
            })
            .select("id")
            .single();
          if (createError) throw createError;
          customerId = newCustomer.id;
        }

        // Link the customer to this account
        if (user?.id && customerId) {
          await supabase
            .from("customer_accounts")
            .update({ customer_id: customerId, phone: phone, email: editForm.email.trim() || null })
            .eq("auth_user_id", user.id);

          setAccountData(prev => prev ? { ...prev, customer_id: customerId } : prev);
        }
      }

      if (!customerId) {
        toast.error("Failed to resolve customer record. Please try again.");
        return;
      }

      const { error } = await supabase
        .from("customers")
        .update({
          name: editForm.name.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim(),
          address: editForm.address.trim() || null,
          gender: editForm.gender || "other",
          birthdate: editForm.birthdate || null,
          division_id: editForm.division_id || null,
          thana_id: editForm.thana_id || null,
          postal_code: editForm.postal_code.trim() || null,
        })
        .eq("id", customerId);

      if (error) {
        console.error("Customer update error:", error);
        throw error;
      }

      // Sync customer_accounts phone/email (trigger handles this too, but be explicit)
      if (user?.id) {
        const { error: acctError } = await supabase
          .from("customer_accounts")
          .update({ phone: editForm.phone.trim(), email: editForm.email.trim() || null })
          .eq("auth_user_id", user.id);
        if (acctError) console.warn("customer_accounts update warning:", acctError);
      }

      // Update local state with division/thana names
      const selectedDiv = divisions.find(d => d.id === editForm.division_id);
      const selectedThana = thanas.find(t => t.id === editForm.thana_id);

      const updatedCustomer = {
        ...(accountData?.customer || {}),
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim(),
        address: editForm.address.trim() || null,
        gender: editForm.gender || "other",
        birthdate: editForm.birthdate || null,
        division_id: editForm.division_id || null,
        thana_id: editForm.thana_id || null,
        postal_code: editForm.postal_code.trim() || null,
        profile_image_url: accountData?.customer?.profile_image_url || null,
        customer_type_id: accountData?.customer?.customer_type_id || null,
        membership_assigned_at: accountData?.customer?.membership_assigned_at || null,
        customer_type: accountData?.customer?.customer_type || null,
        division: selectedDiv ? { id: selectedDiv.id, name: selectedDiv.name } : (editForm.division_id ? accountData?.customer?.division ?? null : null),
        thana: selectedThana ? { id: selectedThana.id, name: selectedThana.name } : (editForm.thana_id ? accountData?.customer?.thana ?? null : null),
      };

      setAccountData(prev => prev ? {
        ...prev,
        customer_id: customerId,
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || null,
        customer: updatedCustomer,
      } : prev);

      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
      // Re-fetch full data from DB to ensure display is in sync
      if (user?.id) {
        fetchAccountData(user.id);
      }
    } catch (error: any) {
      console.error("Profile save error:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditProfile = () => {
    // Re-sync form with latest accountData before opening
    const c = accountData?.customer;
    const divisionId = c?.division_id || "";
    setEditForm({
      name: c?.name || "",
      email: c?.email || accountData?.email || "",
      phone: c?.phone || accountData?.phone || "",
      address: c?.address || "",
      gender: c?.gender || "other",
      division_id: divisionId,
      thana_id: c?.thana_id || "",
      postal_code: c?.postal_code || "",
      birthdate: c?.birthdate || "",
    });
    // Pre-load thanas for existing division so the dropdown is populated immediately
    if (divisionId) {
      supabase.from("thanas").select("id, name, division_id")
        .eq("division_id", divisionId).eq("is_active", true).order("name")
        .then(({ data }) => setThanas(data || []));
    }
    setIsEditingProfile(true);
  };

  const displayName = accountData?.customer?.name || user?.user_metadata?.name || "Customer";
  const displayPhone = accountData?.customer?.phone || accountData?.phone || user?.phone || "Not set";
  const displayEmail = accountData?.customer?.email || accountData?.email || (user?.email?.includes("@phone.local") ? "Not set" : user?.email) || "Not set";
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
                  <Button variant="ghost" size="sm" onClick={openEditProfile}>
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
                      <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="Your full name" />
                    </div>
                    <div>
                      <Label className="text-sm">Phone *</Label>
                      <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="01XXXXXXXXX" />
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="mt-1" placeholder="your@email.com" />
                    </div>
                    <div>
                      <Label className="text-sm">Gender</Label>
                      <Select value={editForm.gender} onValueChange={v => setEditForm(f => ({ ...f, gender: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full mt-1 justify-start text-left font-normal", !editForm.birthdate && "text-muted-foreground")}
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
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-sm font-medium mb-2">Address</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="sm:col-span-2">
                        <Label className="text-sm">Address</Label>
                        <Input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} className="mt-1" placeholder="Your full address" />
                      </div>
                      <div>
                        <Label className="text-sm">District</Label>
                        <Select value={editForm.division_id} onValueChange={v => setEditForm(f => ({ ...f, division_id: v, thana_id: "" }))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
                          <SelectContent>
                            {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Thana/Upazila</Label>
                        <Select
                          value={editForm.thana_id}
                          onValueChange={v => setEditForm(f => ({ ...f, thana_id: v }))}
                          disabled={!editForm.division_id}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={editForm.division_id ? "Select thana" : "Select district first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {thanas.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Postal Code</Label>
                        <Input
                          value={editForm.postal_code}
                          onChange={e => setEditForm(f => ({ ...f, postal_code: e.target.value }))}
                          className="mt-1"
                          placeholder="e.g. 1205"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSaveProfile} disabled={isUpdating} size="sm">
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Profile Info Display */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                      <p className="font-medium capitalize">{accountData?.customer?.gender || "Not Set"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Date of Birth</Label>
                      <p className="font-medium">
                        {accountData?.customer?.birthdate ? format(new Date(accountData.customer.birthdate), "PPP") : "Not set"}
                      </p>
                    </div>
                  </div>

                  {/* Address Display */}
                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Address</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="col-span-2">
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
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Card */}
          <Card className={accountData?.customer?.customer_type ? "border-primary/30 bg-primary/5" : ""}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Crown className={cn("h-4 w-4", accountData?.customer?.customer_type ? "text-primary" : "text-muted-foreground")} />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  accountData?.customer?.customer_type ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className={cn("font-semibold", accountData?.customer?.customer_type && "text-primary")}>{membershipType}</p>
                  {membershipDescription && <p className="text-sm text-muted-foreground">{membershipDescription}</p>}
                  {accountData?.customer?.membership_assigned_at && (
                    <p className="text-xs text-muted-foreground">
                      Member since {format(new Date(accountData.customer.membership_assigned_at), "MMMM yyyy")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-semibold">{customerStats.order_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="font-semibold">{formatCurrency(customerStats.total_spent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order History Link */}
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/my-orders")}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">My Orders</span>
                </div>
                <span className="text-muted-foreground text-sm">→</span>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          {accountData?.customer_id && <MyReviews customerId={accountData.customer_id} />}

          {/* Change Password */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Security
                </CardTitle>
                {!isChangingPassword && (
                  <Button variant="ghost" size="sm" onClick={() => setIsChangingPassword(true)}>
                    Change Password
                  </Button>
                )}
              </div>
            </CardHeader>
            {isChangingPassword && (
              <CardContent className="px-4 pb-4">
                <form onSubmit={handleChangePassword} className="space-y-2">
                  <div>
                    <Label className="text-sm">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowNewPassword(s => !s)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" disabled={isUpdating} size="sm">
                      {isUpdating ? "Updating..." : "Update Password"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Logout */}
          <Button variant="outline" className="w-full" onClick={handleLogout}>
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
