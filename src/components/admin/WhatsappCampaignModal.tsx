import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Image, Smartphone, Send } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  template_id: z.string().optional(),
  media_url: z.string().optional(),
  campaign_type: z.string().default("one-time"),
  automation_type: z.string().optional(),
  fallback_to_sms: z.boolean().default(false),
  exclude_recently_contacted: z.boolean().default(true),
  schedule_date: z.string().optional(),
  schedule_time: z.string().optional(),
  recurring_type: z.string().optional(),
  recurring_day: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface WhatsappCampaignModalProps {
  open: boolean;
  onClose: () => void;
  editingCampaign?: any;
}

const WhatsappCampaignModal = ({ open, onClose, editingCampaign }: WhatsappCampaignModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilters, setSelectedFilters] = useState<{
    genders: string[];
    customerTypes: string[];
    divisions: string[];
    thanas: string[];
    segment: string;
  }>({
    genders: [],
    customerTypes: [],
    divisions: [],
    thanas: [],
    segment: "",
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      template_id: "",
      media_url: "",
      campaign_type: "one-time",
      automation_type: "",
      fallback_to_sms: false,
      exclude_recently_contacted: true,
      schedule_date: "",
      schedule_time: "",
      recurring_type: "",
      recurring_day: "",
    },
  });

  const campaignType = form.watch("campaign_type");
  const selectedTemplateId = form.watch("template_id");

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .eq("status", "approved")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch filter options
  const { data: customerTypes } = useQuery({
    queryKey: ["customer-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_types").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: divisions } = useQuery({
    queryKey: ["divisions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("divisions").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: thanas } = useQuery({
    queryKey: ["thanas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("thanas").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Calculate recipient count
  const { data: recipientCount } = useQuery({
    queryKey: ["whatsapp-recipient-count", selectedFilters],
    queryFn: async () => {
      let query = supabase.from("customers").select("id", { count: "exact" }).eq("is_active", true);

      if (selectedFilters.genders.length > 0) {
        query = query.in("gender", selectedFilters.genders);
      }
      if (selectedFilters.customerTypes.length > 0) {
        query = query.in("customer_type_id", selectedFilters.customerTypes);
      }
      if (selectedFilters.divisions.length > 0) {
        query = query.in("division_id", selectedFilters.divisions);
      }
      if (selectedFilters.thanas.length > 0) {
        query = query.in("thana_id", selectedFilters.thanas);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  useEffect(() => {
    if (editingCampaign) {
      form.reset({
        name: editingCampaign.name || "",
        template_id: editingCampaign.template_id || "",
        media_url: editingCampaign.media_url || "",
        campaign_type: editingCampaign.campaign_type || "one-time",
        automation_type: editingCampaign.automation_type || "",
        fallback_to_sms: editingCampaign.fallback_to_sms || false,
        exclude_recently_contacted: editingCampaign.exclude_recently_contacted ?? true,
      });
      if (editingCampaign.filters) {
        setSelectedFilters({
          genders: editingCampaign.filters.genders || [],
          customerTypes: editingCampaign.filters.customerTypes || [],
          divisions: editingCampaign.filters.divisions || [],
          thanas: editingCampaign.filters.thanas || [],
          segment: editingCampaign.filters.segment || "",
        });
      }
    } else {
      form.reset();
      setSelectedFilters({
        genders: [],
        customerTypes: [],
        divisions: [],
        thanas: [],
        segment: "",
      });
    }
  }, [editingCampaign, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        template_id: data.template_id || null,
        media_url: data.media_url || null,
        campaign_type: data.campaign_type,
        automation_type: data.automation_type || null,
        fallback_to_sms: data.fallback_to_sms,
        exclude_recently_contacted: data.exclude_recently_contacted,
        filters: selectedFilters,
        recipient_count: recipientCount || 0,
        schedule_config: {
          schedule_date: data.schedule_date,
          schedule_time: data.schedule_time,
          recurring_type: data.recurring_type,
          recurring_day: data.recurring_day,
        },
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from("whatsapp_campaigns")
          .update(payload)
          .eq("id", editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("whatsapp_campaigns").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      toast({ title: editingCampaign ? "Campaign updated" : "Campaign created" });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Error saving campaign", description: error.message, variant: "destructive" });
    },
  });

  const toggleFilter = (type: keyof typeof selectedFilters, value: string) => {
    if (type === "segment") {
      setSelectedFilters((prev) => ({ ...prev, segment: value }));
      return;
    }
    setSelectedFilters((prev) => {
      const current = prev[type] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCampaign ? "Edit Campaign" : "Create WhatsApp Campaign"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            <Tabs defaultValue="setup" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Winter Collection Launch" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="template_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an approved template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates?.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <span>{template.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {template.template_type}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTemplate?.header_type === "image" && (
                  <FormField
                    control={form.control}
                    name="media_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Image className="h-4 w-4 inline mr-2" />
                          Media URL (Image/Video)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Upload to product gallery or paste image URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="campaign_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one-time">One-time Send</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="automated">Automated Flow</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {campaignType === "automated" && (
                  <FormField
                    control={form.control}
                    name="automation_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Automation Trigger</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select trigger" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="welcome">Welcome Series (New Registration)</SelectItem>
                            <SelectItem value="order_placed">Order Placed</SelectItem>
                            <SelectItem value="order_shipped">Order Shipped</SelectItem>
                            <SelectItem value="cart_abandoned">Cart Abandoned (2 hrs)</SelectItem>
                            <SelectItem value="birthday">Birthday Special</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="fallback_to_sms"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Fallback to SMS if WhatsApp fails</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exclude_recently_contacted"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Exclude recently contacted</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="audience" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">{recipientCount || 0}</span>
                  <span className="text-muted-foreground">recipients selected</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Gender</h4>
                    <div className="flex gap-2">
                      {["male", "female", "other"].map((gender) => (
                        <Badge
                          key={gender}
                          variant={selectedFilters.genders.includes(gender) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleFilter("genders", gender)}
                        >
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Membership Type</h4>
                    <div className="flex flex-wrap gap-2">
                      {customerTypes?.map((type) => (
                        <Badge
                          key={type.id}
                          variant={selectedFilters.customerTypes.includes(type.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleFilter("customerTypes", type.id)}
                        >
                          {type.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Division</h4>
                    <div className="flex flex-wrap gap-2">
                      {divisions?.map((div) => (
                        <Badge
                          key={div.id}
                          variant={selectedFilters.divisions.includes(div.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleFilter("divisions", div.id)}
                        >
                          {div.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Smart Segments</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "high_value", label: "High Value (Spend > 10k)" },
                        { value: "churn_risk", label: "Churn Risk (6+ months inactive)" },
                        { value: "never_purchased", label: "Never Purchased" },
                      ].map((seg) => (
                        <Badge
                          key={seg.value}
                          variant={selectedFilters.segment === seg.value ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleFilter("segment", seg.value)}
                        >
                          {seg.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-4">
                {campaignType === "scheduled" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="schedule_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="schedule_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="recurring_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurring</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="No repeat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No repeat</SelectItem>
                              <SelectItem value="daily">Every day</SelectItem>
                              <SelectItem value="weekly">Every week</SelectItem>
                              <SelectItem value="half_monthly">Every half month</SelectItem>
                              <SelectItem value="monthly">Every month</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {campaignType === "one-time" && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>One-time campaigns are sent immediately after saving</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="flex justify-center">
                  <div className="w-80 bg-gray-100 rounded-3xl p-4 shadow-lg">
                    <div className="bg-white rounded-2xl p-3 min-h-[400px]">
                      <div className="flex items-center gap-2 border-b pb-2 mb-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Smartphone className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-sm">WhatsApp Preview</span>
                      </div>

                      {selectedTemplate ? (
                        <div className="space-y-2">
                          {selectedTemplate.header_type === "image" && (
                            <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center">
                              <Image className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="bg-green-100 rounded-lg p-3 text-sm">
                            {selectedTemplate.body_text}
                          </div>
                          {selectedTemplate.buttons && (selectedTemplate.buttons as any[]).length > 0 && (
                            <div className="space-y-1">
                              {(selectedTemplate.buttons as any[]).map((btn: any, i: number) => (
                                <button
                                  key={i}
                                  className="w-full py-2 text-center text-blue-600 border rounded-lg text-sm"
                                >
                                  {btn.text}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                          Select a template to preview
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : editingCampaign
                  ? "Update Campaign"
                  : "Create Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsappCampaignModal;
