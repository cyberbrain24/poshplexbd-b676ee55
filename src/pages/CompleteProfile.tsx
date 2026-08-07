import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";

type Division = { id: string; name: string };
type Thana = { id: string; name: string; division_id: string };

const isPhone = (value: string) => /^(\+?880|0)?1[3-9]\d{8}$/.test(value.replace(/\D/g, ""));

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    division_id: "",
    thana_id: "",
    postal_code: "",
  });

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);

  // Load auth user + existing customer (if any) + divisions
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(session.user);

      const meta = session.user.user_metadata || {};
      const email: string = session.user.email && !session.user.email.endsWith("@phone.local") ? session.user.email : "";
      const fullName: string = meta.full_name || meta.name || (email ? email.split("@")[0] : "");

      // Try to load existing customer linked to this auth user
      const { data: account } = await supabase
        .from("customer_accounts")
        .select("customer_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      let customer: any = null;
      if (account?.customer_id) {
        const { data } = await supabase
          .from("customers")
          .select("name, phone, email, address, division_id, thana_id, postal_code")
          .eq("id", account.customer_id)
          .maybeSingle();
        customer = data;
      }

      setForm({
        name: customer?.name && !customer.name.startsWith("Customer") ? customer.name : fullName,
        phone: customer?.phone && !customer.phone.startsWith("user_") ? customer.phone : "",
        email: customer?.email || email,
        address: customer?.address || "",
        division_id: customer?.division_id || "",
        thana_id: customer?.thana_id || "",
        postal_code: customer?.postal_code || "",
      });

      const { data: divs } = await supabase
        .from("divisions").select("id, name").eq("is_active", true).order("name");
      setDivisions(divs || []);

      setLoading(false);
    })();
  }, [navigate]);

  // Load thanas when division changes
  useEffect(() => {
    if (!form.division_id) { setThanas([]); return; }
    supabase.from("thanas")
      .select("id, name, division_id")
      .eq("division_id", form.division_id)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setThanas(data || []));
  }, [form.division_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!form.name.trim()) return toast.error("Please enter your full name");
    if (!isPhone(form.phone)) return toast.error("Enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX)");
    if (!form.address.trim()) return toast.error("Please enter your address");
    if (!form.division_id) return toast.error("Please select your district");
    if (!form.thana_id) return toast.error("Please select your thana");

    setSubmitting(true);
    try {
      // Check if customer_accounts row exists
      const { data: account } = await supabase
        .from("customer_accounts")
        .select("id, customer_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      let customerId = account?.customer_id || null;

      // If no customer yet, try to find one by phone
      if (!customerId) {
        const { data: existingId } = await supabase
          .rpc("find_customer_id_by_phone", { p_phone: form.phone.trim() });
        customerId = (existingId as string | null) ?? null;
      }

      if (customerId) {
        // Update existing
        const { error } = await supabase
          .from("customers")
          .update({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address.trim(),
            division_id: form.division_id,
            thana_id: form.thana_id,
            postal_code: form.postal_code.trim() || null,
          })
          .eq("id", customerId);
        if (error) throw error;
      } else {
        // Create new customer
        const { data: newCustomer, error } = await supabase
          .from("customers")
          .insert({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address.trim(),
            division_id: form.division_id,
            thana_id: form.thana_id,
            postal_code: form.postal_code.trim() || null,
            is_active: true,
          })
          .select("id")
          .single();
        if (error) throw error;
        customerId = newCustomer.id;
      }

      // Upsert customer_accounts link
      if (account) {
        await supabase
          .from("customer_accounts")
          .update({
            customer_id: customerId,
            phone: form.phone.trim(),
            email: form.email.trim() || null,
          })
          .eq("id", account.id);
      } else {
        await supabase
          .from("customer_accounts")
          .insert({
            auth_user_id: user.id,
            customer_id: customerId,
            phone: form.phone.trim(),
            email: form.email.trim() || null,
          });
      }

      toast.success("Profile completed!");
      navigate("/account", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PoshplexHeader />
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
        <PoshplexFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PoshplexHeader />

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight uppercase">Complete Your Profile</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Please fill in the required information to finish setting up your account. All fields marked with * are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea id="address" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>District *</Label>
                <Select value={form.division_id} onValueChange={v => setForm(f => ({ ...f, division_id: v, thana_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thana *</Label>
                <Select value={form.thana_id} onValueChange={v => setForm(f => ({ ...f, thana_id: v }))} disabled={!form.division_id}>
                  <SelectTrigger><SelectValue placeholder={form.division_id ? "Select thana" : "Pick district first"} /></SelectTrigger>
                  <SelectContent>
                    {thanas.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code (optional)</Label>
              <Input id="postal_code" value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} />
            </div>

            <Button type="submit" className="w-full uppercase font-semibold" disabled={submitting}>
              {submitting ? "Saving…" : "Save & Continue"}
            </Button>
          </form>
        </div>
      </div>

      <PoshplexFooter />
    </div>
  );
};

export default CompleteProfile;
