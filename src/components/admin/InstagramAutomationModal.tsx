import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, Plus, Smartphone } from "lucide-react";

interface InstagramAutomationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAutomation: any;
}

const InstagramAutomationModal = ({ open, onOpenChange, editingAutomation }: InstagramAutomationModalProps) => {
  const queryClient = useQueryClient();
  const [keywordInput, setKeywordInput] = useState("");
  const [replyInput, setReplyInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    automation_type: "comment_to_dm",
    post_filter: "all",
    post_urls: [] as string[],
    trigger_keywords: [] as string[],
    public_reply_variations: [] as string[],
    dm_message: "",
    dm_button_text: "",
    dm_button_url: "",
    delay_minutes: 0,
    cooldown_hours: 24,
    is_active: true,
  });

  useEffect(() => {
    if (editingAutomation) {
      setFormData({
        name: editingAutomation.name,
        automation_type: editingAutomation.automation_type,
        post_filter: editingAutomation.post_filter || "all",
        post_urls: editingAutomation.post_urls || [],
        trigger_keywords: editingAutomation.trigger_keywords || [],
        public_reply_variations: editingAutomation.public_reply_variations || [],
        dm_message: editingAutomation.dm_message || "",
        dm_button_text: editingAutomation.dm_button_text || "",
        dm_button_url: editingAutomation.dm_button_url || "",
        delay_minutes: editingAutomation.delay_minutes || 0,
        cooldown_hours: editingAutomation.cooldown_hours || 24,
        is_active: editingAutomation.is_active,
      });
    } else {
      setFormData({
        name: "",
        automation_type: "comment_to_dm",
        post_filter: "all",
        post_urls: [],
        trigger_keywords: [],
        public_reply_variations: [],
        dm_message: "",
        dm_button_text: "",
        dm_button_url: "",
        delay_minutes: 0,
        cooldown_hours: 24,
        is_active: true,
      });
    }
  }, [editingAutomation, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingAutomation) {
        const { error } = await supabase
          .from("instagram_automations")
          .update(data)
          .eq("id", editingAutomation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("instagram_automations").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-automations"] });
      toast.success(editingAutomation ? "Automation updated" : "Automation created");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save automation");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.trigger_keywords.includes(keywordInput.trim())) {
      setFormData({ ...formData, trigger_keywords: [...formData.trigger_keywords, keywordInput.trim()] });
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData({ ...formData, trigger_keywords: formData.trigger_keywords.filter(k => k !== kw) });
  };

  const addReply = () => {
    if (replyInput.trim() && !formData.public_reply_variations.includes(replyInput.trim())) {
      setFormData({ ...formData, public_reply_variations: [...formData.public_reply_variations, replyInput.trim()] });
      setReplyInput("");
    }
  };

  const removeReply = (reply: string) => {
    setFormData({ ...formData, public_reply_variations: formData.public_reply_variations.filter(r => r !== reply) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAutomation ? "Edit Automation" : "Create Automation"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Automation Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Winter Collection Launch"
                required
              />
            </div>

            <div>
              <Label>Automation Type</Label>
              <Select
                value={formData.automation_type}
                onValueChange={(value) => setFormData({ ...formData, automation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment_to_dm">Comment → DM</SelectItem>
                  <SelectItem value="story_mention">Story Mention (@tag)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Post Filter</Label>
              <Select
                value={formData.post_filter}
                onValueChange={(value) => setFormData({ ...formData, post_filter: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="specific">Specific Posts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.automation_type === "comment_to_dm" && (
              <>
                <div className="col-span-2">
                  <Label>Trigger Keywords</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="e.g., Price, Link, Buy"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" variant="outline" onClick={addKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.trigger_keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {kw}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(kw)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>Public Reply Variations (randomized)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder='e.g., "Sent you the details! Check your DMs ✨"'
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReply())}
                    />
                    <Button type="button" variant="outline" onClick={addReply}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.public_reply_variations.map((reply, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                        <span className="flex-1">{reply}</span>
                        <X className="h-4 w-4 cursor-pointer" onClick={() => removeReply(reply)} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {formData.automation_type === "story_mention" && (
              <>
                <div>
                  <Label>Delay (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.delay_minutes}
                    onChange={(e) => setFormData({ ...formData, delay_minutes: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">15-30 min delay recommended (simulates human behavior)</p>
                </div>

                <div>
                  <Label>Cooldown (hours)</Label>
                  <Input
                    type="number"
                    value={formData.cooldown_hours}
                    onChange={(e) => setFormData({ ...formData, cooldown_hours: parseInt(e.target.value) || 24 })}
                    min={1}
                    max={168}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Don't message same user within this period</p>
                </div>
              </>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Private DM Content</h4>
            <div>
              <Label>DM Message</Label>
              <Textarea
                value={formData.dm_message}
                onChange={(e) => setFormData({ ...formData, dm_message: e.target.value })}
                placeholder="Hey! Here is the link to the Poshplex collection you liked:"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={formData.dm_button_text}
                  onChange={(e) => setFormData({ ...formData, dm_button_text: e.target.value })}
                  placeholder="Shop Now"
                />
              </div>
              <div>
                <Label>Button URL</Label>
                <Input
                  value={formData.dm_button_url}
                  onChange={(e) => setFormData({ ...formData, dm_button_url: e.target.value })}
                  placeholder="https://poshplex.com/collection"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4" />
              <span className="font-medium">DM Preview</span>
            </div>
            <div className="bg-background rounded-lg p-4 max-w-xs mx-auto shadow">
              <p className="text-sm mb-3">{formData.dm_message || "Your message will appear here..."}</p>
              {formData.dm_button_text && (
                <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  {formData.dm_button_text}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : editingAutomation ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramAutomationModal;
