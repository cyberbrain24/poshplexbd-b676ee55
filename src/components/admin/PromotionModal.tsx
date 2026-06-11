import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const PLACEMENT_OPTIONS = [
  { value: "home_top", label: "Home — Top" },
  { value: "home_middle", label: "Home — Middle" },
  { value: "home_bottom", label: "Home — Bottom" },
  { value: "category_top", label: "Category Pages — Top" },
  { value: "product_top", label: "Product Page — Top" },
  { value: "product_bottom", label: "Product Page — Bottom" },
  { value: "footer", label: "Footer" },
  { value: "floating", label: "Floating Bubble (sitewide)" },
  { value: "announcement", label: "Announcement Bar" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: any | null;
}

const empty = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  display_style: "banner",
  action_type: "popup",
  action_value: "",
  promo_code_id: "",
  placements: [] as string[],
  priority: 0,
  is_active: true,
  dismissible: true,
  starts_at: "",
  ends_at: "",
  cta_label: "",
  bg_color: "",
  text_color: "",
};

const PromotionModal = ({ open, onOpenChange, promotion }: Props) => {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  const { data: promoCodes = [] } = useQuery({
    queryKey: ["promo-codes-min"],
    queryFn: async () => {
      const { data } = await supabase.from("promo_codes").select("id, code").eq("is_active", true).order("code");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (promotion) {
      setForm({
        title: promotion.title ?? "",
        subtitle: promotion.subtitle ?? "",
        description: promotion.description ?? "",
        image_url: promotion.image_url ?? "",
        display_style: promotion.display_style ?? "banner",
        action_type: promotion.action_type ?? "popup",
        action_value: promotion.action_value ?? "",
        promo_code_id: promotion.promo_code_id ?? "",
        placements: promotion.placements ?? [],
        priority: promotion.priority ?? 0,
        is_active: promotion.is_active ?? true,
        dismissible: promotion.dismissible ?? true,
        starts_at: promotion.starts_at ? promotion.starts_at.slice(0, 16) : "",
        ends_at: promotion.ends_at ? promotion.ends_at.slice(0, 16) : "",
        cta_label: promotion.cta_label ?? "",
        bg_color: promotion.bg_color ?? "",
        text_color: promotion.text_color ?? "",
      });
    } else {
      setForm(empty);
    }
  }, [promotion, open]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `promotions/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const togglePlacement = (val: string) => {
    setForm((f) => ({
      ...f,
      placements: f.placements.includes(val) ? f.placements.filter((p) => p !== val) : [...f.placements, val],
    }));
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required");
      if (form.placements.length === 0) throw new Error("Select at least one placement");

      const payload: any = {
        title: form.title.trim(),
        subtitle: form.subtitle || null,
        description: form.description || null,
        image_url: form.image_url || null,
        display_style: form.display_style,
        action_type: form.action_type,
        action_value: form.action_value || null,
        promo_code_id: form.promo_code_id || null,
        placements: form.placements,
        priority: Number(form.priority) || 0,
        is_active: form.is_active,
        dismissible: form.dismissible,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        cta_label: form.cta_label || null,
        bg_color: form.bg_color || null,
        text_color: form.text_color || null,
      };

      if (promotion?.id) {
        const { error } = await supabase.from("promotions" as any).update(payload).eq("id", promotion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promotions" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(promotion ? "Promotion updated" : "Promotion created");
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      qc.invalidateQueries({ queryKey: ["promotions"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{promotion ? "Edit Promotion" : "New Promotion"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="50% OFF Summer Sale" />
            </div>
            <div className="col-span-2">
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Limited time only" />
            </div>
            <div className="col-span-2">
              <Label>Description (shown in popup)</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="col-span-2">
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                <input
                  type="file"
                  accept="image/*"
                  id="promo-image"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                />
                <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById("promo-image")?.click()}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-24 object-cover rounded" />}
            </div>

            <div>
              <Label>Display Style</Label>
              <Select value={form.display_style} onValueChange={(v) => setForm({ ...form, display_style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="inline-text">Inline Text</SelectItem>
                  <SelectItem value="floating-bubble">Floating Bubble</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>

            <div>
              <Label>Click Action</Label>
              <Select value={form.action_type} onValueChange={(v) => setForm({ ...form, action_type: v, action_value: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="popup">Open Popup</SelectItem>
                  <SelectItem value="product">Link to Product</SelectItem>
                  <SelectItem value="category">Link to Category</SelectItem>
                  <SelectItem value="url">External URL</SelectItem>
                  <SelectItem value="none">No Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {form.action_type === "product" && "Product Slug/ID"}
                {form.action_type === "category" && "Category Slug"}
                {form.action_type === "url" && "URL"}
                {(form.action_type === "popup" || form.action_type === "none") && "Action Value (optional)"}
              </Label>
              <Input value={form.action_value} onChange={(e) => setForm({ ...form, action_value: e.target.value })} />
            </div>

            <div className="col-span-2">
              <Label>Linked Promo Code (optional)</Label>
              <Select value={form.promo_code_id || "none"} onValueChange={(v) => setForm({ ...form, promo_code_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {promoCodes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>CTA Button Label</Label>
              <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="Shop Now" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>BG Color</Label>
                <Input type="color" value={form.bg_color || "#000000"} onChange={(e) => setForm({ ...form, bg_color: e.target.value })} />
              </div>
              <div>
                <Label>Text Color</Label>
                <Input type="color" value={form.text_color || "#ffffff"} onChange={(e) => setForm({ ...form, text_color: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Starts At</Label>
              <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <Label>Ends At</Label>
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>

            <div className="col-span-2">
              <Label>Placements *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-3">
                {PLACEMENT_OPTIONS.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.placements.includes(p.value)} onCheckedChange={() => togglePlacement(p.value)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.dismissible} onCheckedChange={(v) => setForm({ ...form, dismissible: v })} /><Label>Dismissible</Label></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionModal;
