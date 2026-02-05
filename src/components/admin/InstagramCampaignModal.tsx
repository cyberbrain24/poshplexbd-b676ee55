import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, X, Smartphone, Users, AlertTriangle } from "lucide-react";

interface InstagramCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCampaign: any;
}

const InstagramCampaignModal = ({ open, onOpenChange, editingCampaign }: InstagramCampaignModalProps) => {
  const queryClient = useQueryClient();
  const [recipientCount, setRecipientCount] = useState(0);
  const [quickReplyInput, setQuickReplyInput] = useState({ text: "", payload: "" });

  const [formData, setFormData] = useState({
    name: "",
    message_body: "",
    image_url: "",
    quick_replies: [] as { text: string; payload: string }[],
    filters: {
      genders: [] as string[],
      division_ids: [] as string[],
      customer_type_ids: [] as string[],
    },
    active_window_only: true,
    status: "draft",
    scheduled_at: "",
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("divisions").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: customerTypes = [] } = useQuery({
    queryKey: ["customer-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_types").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["instagram-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instagram_conversations").select("*");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (editingCampaign) {
      const filters = editingCampaign.filters || {};
      setFormData({
        name: editingCampaign.name,
        message_body: editingCampaign.message_body,
        image_url: editingCampaign.image_url || "",
        quick_replies: editingCampaign.quick_replies || [],
        filters: {
          genders: filters.genders || [],
          division_ids: filters.division_ids || [],
          customer_type_ids: filters.customer_type_ids || [],
        },
        active_window_only: editingCampaign.active_window_only ?? true,
        status: editingCampaign.status,
        scheduled_at: editingCampaign.scheduled_at || "",
      });
    } else {
      setFormData({
        name: "",
        message_body: "",
        image_url: "",
        quick_replies: [],
        filters: {
          genders: [],
          division_ids: [],
          customer_type_ids: [],
        },
        active_window_only: true,
        status: "draft",
        scheduled_at: "",
      });
    }
  }, [editingCampaign, open]);

  // Calculate recipient count
  useEffect(() => {
    const calculateRecipients = async () => {
      // For Instagram, we count conversations (users who have messaged us)
      let filtered = conversations;
      
      if (formData.active_window_only) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        filtered = filtered.filter((c: any) => c.last_interaction_at && c.last_interaction_at >= twentyFourHoursAgo);
      }
      
      setRecipientCount(filtered.length);
    };
    calculateRecipients();
  }, [formData.filters, formData.active_window_only, conversations]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        message_body: data.message_body,
        image_url: data.image_url || null,
        quick_replies: data.quick_replies,
        filters: data.filters,
        active_window_only: data.active_window_only,
        status: data.status,
        scheduled_at: data.scheduled_at || null,
        recipient_count: recipientCount,
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from("instagram_campaigns")
          .update(payload)
          .eq("id", editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("instagram_campaigns").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-campaigns"] });
      toast.success(editingCampaign ? "Campaign updated" : "Campaign created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save campaign");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addQuickReply = () => {
    if (quickReplyInput.text.trim() && formData.quick_replies.length < 3) {
      setFormData({
        ...formData,
        quick_replies: [...formData.quick_replies, { ...quickReplyInput }],
      });
      setQuickReplyInput({ text: "", payload: "" });
    }
  };

  const removeQuickReply = (index: number) => {
    setFormData({
      ...formData,
      quick_replies: formData.quick_replies.filter((_, i) => i !== index),
    });
  };

  const toggleArrayFilter = (key: "genders" | "division_ids" | "customer_type_ids", value: string) => {
    const current = formData.filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData({
      ...formData,
      filters: { ...formData.filters, [key]: updated },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? "Edit Campaign" : "Create Instagram Campaign"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Flash Sale Alert"
                  required
                />
              </div>

              <div>
                <Label>Message Body</Label>
                <Textarea
                  value={formData.message_body}
                  onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
                  placeholder="Hey! 🔥 Flash Sale is LIVE for the next 2 hours only..."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.message_body.length} characters
                </p>
              </div>

              <div>
                <Label>Image URL (optional)</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/promo-image.jpg"
                />
              </div>

              <div>
                <Label>Quick Replies (max 3)</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={quickReplyInput.text}
                    onChange={(e) => setQuickReplyInput({ ...quickReplyInput, text: e.target.value })}
                    placeholder="Button text"
                    className="flex-1"
                  />
                  <Input
                    value={quickReplyInput.payload}
                    onChange={(e) => setQuickReplyInput({ ...quickReplyInput, payload: e.target.value })}
                    placeholder="URL or payload"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addQuickReply} disabled={formData.quick_replies.length >= 3}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.quick_replies.map((qr, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1 text-sm">{qr.text}</span>
                      <span className="text-xs text-muted-foreground">{qr.payload}</span>
                      <X className="h-4 w-4 cursor-pointer" onClick={() => removeQuickReply(i)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <Label>24-Hour Window Rule</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active_window_only}
                    onCheckedChange={(checked) => setFormData({ ...formData, active_window_only: checked })}
                  />
                  <span className="text-sm">
                    {formData.active_window_only
                      ? "Only send to users who messaged in last 24h (Safe Mode)"
                      : "⚠️ Disabled - Risk of account restriction"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instagram only allows marketing DMs to users who interacted within 24 hours.
                </p>
              </div>

              <div>
                <Label>Schedule (optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
            </div>

            {/* Right Column - Preview & Filters */}
            <div className="space-y-4">
              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="h-4 w-4" />
                  <span className="font-medium">DM Preview</span>
                </div>
                <div className="bg-background rounded-lg p-4 max-w-xs mx-auto shadow space-y-3">
                  {formData.image_url && (
                    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <img src={formData.image_url} alt="Preview" className="rounded-lg max-h-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <p className="text-sm">{formData.message_body || "Your message will appear here..."}</p>
                  {formData.quick_replies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.quick_replies.map((qr, i) => (
                        <Button key={i} size="sm" variant="outline" className="text-xs">
                          {qr.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipient Count */}
              <div className="border rounded-lg p-4 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-2xl font-bold">{recipientCount}</span>
                  <span className="text-muted-foreground">recipients</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.active_window_only
                    ? "Users who messaged in last 24 hours"
                    : "All conversation contacts"}
                </p>
              </div>

              {/* Filters */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Customer Filters (Linked Accounts)</h4>
                
                <div>
                  <Label className="text-sm">Gender</Label>
                  <div className="flex gap-2 mt-1">
                    {["Male", "Female", "Other"].map((g) => (
                      <div key={g} className="flex items-center gap-1">
                        <Checkbox
                          checked={formData.filters.genders.includes(g)}
                          onCheckedChange={() => toggleArrayFilter("genders", g)}
                        />
                        <span className="text-sm">{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Division</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {divisions.map((d: any) => (
                      <Badge
                        key={d.id}
                        variant={formData.filters.division_ids.includes(d.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter("division_ids", d.id)}
                      >
                        {d.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Membership Type</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customerTypes.map((ct: any) => (
                      <Badge
                        key={ct.id}
                        variant={formData.filters.customer_type_ids.includes(ct.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter("customer_type_ids", ct.id)}
                      >
                        {ct.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : editingCampaign ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramCampaignModal;
