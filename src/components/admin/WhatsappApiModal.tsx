import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

const formSchema = z.object({
  provider_type: z.string().min(1, "Provider type is required"),
  provider_name: z.string().min(1, "Provider name is required"),
  business_account_id: z.string().optional(),
  phone_number_id: z.string().optional(),
  access_token: z.string().min(1, "Access token is required"),
  phone_number: z.string().optional(),
  api_base_url: z.string().optional(),
  webhook_verify_token: z.string().optional(),
  is_active: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface WhatsappApiModalProps {
  open: boolean;
  onClose: () => void;
  editingApi?: any;
}

const WhatsappApiModal = ({ open, onClose, editingApi }: WhatsappApiModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_type: "meta",
      provider_name: "",
      business_account_id: "",
      phone_number_id: "",
      access_token: "",
      phone_number: "",
      api_base_url: "https://graph.facebook.com/v18.0",
      webhook_verify_token: "",
      is_active: false,
    },
  });

  const providerType = form.watch("provider_type");

  useEffect(() => {
    if (editingApi) {
      form.reset({
        provider_type: editingApi.provider_type || "meta",
        provider_name: editingApi.provider_name || "",
        business_account_id: editingApi.business_account_id || "",
        phone_number_id: editingApi.phone_number_id || "",
        access_token: editingApi.access_token || "",
        phone_number: editingApi.phone_number || "",
        api_base_url: editingApi.api_base_url || "https://graph.facebook.com/v18.0",
        webhook_verify_token: editingApi.webhook_verify_token || "",
        is_active: editingApi.is_active || false,
      });
    } else {
      form.reset({
        provider_type: "meta",
        provider_name: "",
        business_account_id: "",
        phone_number_id: "",
        access_token: "",
        phone_number: "",
        api_base_url: "https://graph.facebook.com/v18.0",
        webhook_verify_token: "",
        is_active: false,
      });
    }
  }, [editingApi, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        provider_type: data.provider_type,
        provider_name: data.provider_name,
        business_account_id: data.business_account_id || null,
        phone_number_id: data.phone_number_id || null,
        access_token: data.access_token,
        phone_number: data.phone_number || null,
        api_base_url: data.api_base_url || null,
        webhook_verify_token: data.webhook_verify_token || null,
        is_active: data.is_active,
        webhook_url: `${window.location.origin}/api/whatsapp/webhook`,
        status: "disconnected" as const,
      };

      if (editingApi) {
        const { error } = await supabase
          .from("whatsapp_apis")
          .update(payload)
          .eq("id", editingApi.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("whatsapp_apis").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-apis"] });
      toast({ title: editingApi ? "API updated successfully" : "API created successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error saving API", description: error.message, variant: "destructive" });
    },
  });

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: "Webhook URL copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingApi ? "Edit WhatsApp API" : "Add WhatsApp API"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="provider_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="meta">Meta Cloud API (Recommended)</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="custom">Custom Provider</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My WhatsApp Business" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {providerType === "meta" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="business_account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Account ID</FormLabel>
                        <FormControl>
                          <Input placeholder="WhatsApp Business Account ID" {...field} />
                        </FormControl>
                        <FormDescription>Find in Meta Business Suite</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone_number_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone Number ID from Meta" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+8801XXXXXXXXX" {...field} />
                  </FormControl>
                  <FormDescription>E.164 format with country code</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token / API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your access token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {providerType !== "meta" && (
              <FormField
                control={form.control}
                name="api_base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Base URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.provider.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-2">
              <FormLabel>Webhook URL</FormLabel>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="bg-muted" />
                <Button type="button" variant="outline" size="icon" onClick={copyWebhookUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Configure this URL in Meta Business Manager for receiving messages and status updates
              </p>
            </div>

            <FormField
              control={form.control}
              name="webhook_verify_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Verify Token</FormLabel>
                  <FormControl>
                    <Input placeholder="Your custom verify token" {...field} />
                  </FormControl>
                  <FormDescription>Used for webhook verification handshake</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Set as Active</FormLabel>
                    <FormDescription>
                      Only one API can be active. All campaigns use the active API.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editingApi ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsappApiModal;
