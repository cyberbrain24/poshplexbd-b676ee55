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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle, XCircle, RefreshCw, Copy, Eye, EyeOff } from "lucide-react";

interface PermissionsStatus {
  instagram_manage_messages?: boolean;
  instagram_manage_comments?: boolean;
  pages_manage_metadata?: boolean;
}

interface InstagramApi {
  id: string;
  provider_name: string;
  facebook_app_id: string;
  facebook_app_secret: string;
  access_token: string;
  page_id: string | null;
  page_name: string | null;
  instagram_account_id: string | null;
  instagram_username: string | null;
  webhook_url: string | null;
  webhook_verify_token: string | null;
  permissions_status: PermissionsStatus | null;
  token_expires_at: string | null;
  is_active: boolean;
  status: string;
}

interface InstagramApiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingApi: InstagramApi | null;
}

const InstagramApiModal = ({ open, onOpenChange, editingApi }: InstagramApiModalProps) => {
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: "",
    facebook_app_id: "",
    facebook_app_secret: "",
    access_token: "",
    page_id: "",
    page_name: "",
    instagram_account_id: "",
    instagram_username: "",
    webhook_verify_token: "",
    is_active: false,
  });

  const webhookUrl = `https://plzzfghvkitdqjepdmge.supabase.co/functions/v1/instagram-webhook`;

  useEffect(() => {
    if (editingApi) {
      setFormData({
        provider_name: editingApi.provider_name,
        facebook_app_id: editingApi.facebook_app_id,
        facebook_app_secret: editingApi.facebook_app_secret,
        access_token: editingApi.access_token,
        page_id: editingApi.page_id || "",
        page_name: editingApi.page_name || "",
        instagram_account_id: editingApi.instagram_account_id || "",
        instagram_username: editingApi.instagram_username || "",
        webhook_verify_token: editingApi.webhook_verify_token || "",
        is_active: editingApi.is_active,
      });
    } else {
      setFormData({
        provider_name: "",
        facebook_app_id: "",
        facebook_app_secret: "",
        access_token: "",
        page_id: "",
        page_name: "",
        instagram_account_id: "",
        instagram_username: "",
        webhook_verify_token: crypto.randomUUID().slice(0, 16),
        is_active: false,
      });
    }
  }, [editingApi, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        webhook_url: webhookUrl,
        permissions_status: {
          instagram_manage_messages: false,
          instagram_manage_comments: false,
          pages_manage_metadata: false,
        },
        status: "disconnected",
      };

      if (editingApi) {
        const { error } = await supabase
          .from("instagram_apis")
          .update(payload)
          .eq("id", editingApi.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("instagram_apis").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-apis"] });
      toast.success(editingApi ? "Instagram API updated" : "Instagram API added");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to save Instagram API");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getPermissionBadge = (granted: boolean) => {
    return granted ? (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs">Granted</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-500">
        <XCircle className="h-4 w-4" />
        <span className="text-xs">Not Granted</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingApi ? "Edit Instagram API" : "Add Instagram API"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Provider Name</Label>
              <Input
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                placeholder="e.g., Poshplex Instagram"
                required
              />
            </div>

            <div>
              <Label>Facebook App ID</Label>
              <Input
                value={formData.facebook_app_id}
                onChange={(e) => setFormData({ ...formData, facebook_app_id: e.target.value })}
                placeholder="App ID from Meta Developer Console"
                required
              />
            </div>

            <div>
              <Label>Facebook App Secret</Label>
              <div className="relative">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={formData.facebook_app_secret}
                  onChange={(e) => setFormData({ ...formData, facebook_app_secret: e.target.value })}
                  placeholder="App Secret"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="col-span-2">
              <Label>Access Token (Long-lived)</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={formData.access_token}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  placeholder="Long-lived access token"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label>Page ID</Label>
              <Input
                value={formData.page_id}
                onChange={(e) => setFormData({ ...formData, page_id: e.target.value })}
                placeholder="Facebook Page ID"
              />
            </div>

            <div>
              <Label>Page Name</Label>
              <Input
                value={formData.page_name}
                onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
                placeholder="Facebook Page Name"
              />
            </div>

            <div>
              <Label>Instagram Account ID</Label>
              <Input
                value={formData.instagram_account_id}
                onChange={(e) => setFormData({ ...formData, instagram_account_id: e.target.value })}
                placeholder="Instagram Business Account ID"
              />
            </div>

            <div>
              <Label>Instagram Username</Label>
              <Input
                value={formData.instagram_username}
                onChange={(e) => setFormData({ ...formData, instagram_username: e.target.value })}
                placeholder="@poshplex"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <h4 className="font-medium">Webhook Configuration</h4>
            <div>
              <Label>Webhook URL (Copy to Meta Developer Console)</Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="bg-background" />
                <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Verify Token</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.webhook_verify_token}
                  onChange={(e) => setFormData({ ...formData, webhook_verify_token: e.target.value })}
                  placeholder="Custom verify token"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(formData.webhook_verify_token)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {editingApi && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Permissions Status</h4>
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">instagram_manage_messages</span>
                  {getPermissionBadge(editingApi.permissions_status?.instagram_manage_messages || false)}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">instagram_manage_comments</span>
                  {getPermissionBadge(editingApi.permissions_status?.instagram_manage_comments || false)}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">pages_manage_metadata</span>
                  {getPermissionBadge(editingApi.permissions_status?.pages_manage_metadata || false)}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Set as Active API</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : editingApi ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramApiModal;
