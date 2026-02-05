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
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, MessageCircle } from "lucide-react";

interface IceBreaker {
  id: string;
  button_text: string;
  auto_reply_text: string | null;
  auto_reply_image_url: string | null;
  auto_reply_link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface InstagramIceBreakersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InstagramIceBreakersModal = ({ open, onOpenChange }: InstagramIceBreakersModalProps) => {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<IceBreaker | null>(null);
  const [formData, setFormData] = useState({
    button_text: "",
    auto_reply_text: "",
    auto_reply_image_url: "",
    auto_reply_link_url: "",
    is_active: true,
  });

  const { data: iceBreakers = [], isLoading } = useQuery({
    queryKey: ["instagram-ice-breakers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_ice_breakers")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as IceBreaker[];
    },
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("instagram_ice_breakers")
          .update({
            button_text: data.button_text,
            auto_reply_text: data.auto_reply_text || null,
            auto_reply_image_url: data.auto_reply_image_url || null,
            auto_reply_link_url: data.auto_reply_link_url || null,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("instagram_ice_breakers").insert({
          button_text: data.button_text,
          auto_reply_text: data.auto_reply_text || null,
          auto_reply_image_url: data.auto_reply_image_url || null,
          auto_reply_link_url: data.auto_reply_link_url || null,
          is_active: data.is_active,
          sort_order: iceBreakers.length,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-ice-breakers"] });
      toast.success(editingItem ? "Ice Breaker updated" : "Ice Breaker added");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to save Ice Breaker");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_ice_breakers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-ice-breakers"] });
      toast.success("Ice Breaker deleted");
    },
  });

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      button_text: "",
      auto_reply_text: "",
      auto_reply_image_url: "",
      auto_reply_link_url: "",
      is_active: true,
    });
  };

  const handleEdit = (item: IceBreaker) => {
    setEditingItem(item);
    setFormData({
      button_text: item.button_text,
      auto_reply_text: item.auto_reply_text || "",
      auto_reply_image_url: item.auto_reply_image_url || "",
      auto_reply_link_url: item.auto_reply_link_url || "",
      is_active: item.is_active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, id: editingItem?.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Ice Breakers</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-4">
            <h4 className="font-medium">Current Ice Breakers (Max 4)</h4>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : iceBreakers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No ice breakers configured</p>
            ) : (
              <div className="space-y-2">
                {iceBreakers.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      editingItem?.id === item.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleEdit(item)}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <MessageCircle className="h-4 w-4" />
                      <span className="font-medium flex-1">{item.button_text}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-10 truncate">
                      {item.auto_reply_text || "No auto-reply configured"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <h5 className="font-medium mb-3">DM Menu Preview</h5>
              <div className="bg-background rounded-lg p-4 max-w-xs space-y-2">
                {iceBreakers.filter(b => b.is_active).slice(0, 4).map((item) => (
                  <Button key={item.id} variant="outline" size="sm" className="w-full justify-start">
                    {item.button_text}
                  </Button>
                ))}
                {iceBreakers.filter(b => b.is_active).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">No buttons configured</p>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <h4 className="font-medium mb-4">
              {editingItem ? "Edit Ice Breaker" : "Add Ice Breaker"}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                  placeholder='e.g., "Where is my order?"'
                  required
                />
              </div>

              <div>
                <Label>Auto-Reply Text</Label>
                <Textarea
                  value={formData.auto_reply_text}
                  onChange={(e) => setFormData({ ...formData, auto_reply_text: e.target.value })}
                  placeholder="Please send your Order ID and our team will check!"
                  rows={3}
                />
              </div>

              <div>
                <Label>Auto-Reply Image URL (optional)</Label>
                <Input
                  value={formData.auto_reply_image_url}
                  onChange={(e) => setFormData({ ...formData, auto_reply_image_url: e.target.value })}
                  placeholder="https://example.com/size-chart.png"
                />
              </div>

              <div>
                <Label>Auto-Reply Link URL (optional)</Label>
                <Input
                  value={formData.auto_reply_link_url}
                  onChange={(e) => setFormData({ ...formData, auto_reply_link_url: e.target.value })}
                  placeholder="https://poshplex.com/new-arrivals"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                {editingItem && (
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={saveMutation.isPending || (!editingItem && iceBreakers.length >= 4)}
                  className="flex-1"
                >
                  {saveMutation.isPending ? "Saving..." : editingItem ? "Update" : "Add"}
                </Button>
              </div>
              {!editingItem && iceBreakers.length >= 4 && (
                <p className="text-sm text-destructive">Maximum 4 ice breakers allowed</p>
              )}
            </form>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramIceBreakersModal;
