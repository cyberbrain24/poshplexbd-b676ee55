import { useEffect, useState, useMemo } from "react";
import DOMPurify from "dompurify";
 import { useForm } from "react-hook-form";
 import { zodResolver } from "@hookform/resolvers/zod";
 import { z } from "zod";
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
 } from "@/components/ui/form";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Switch } from "@/components/ui/switch";
 import { Textarea } from "@/components/ui/textarea";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Label } from "@/components/ui/label";
 
 const emailCampaignSchema = z.object({
   name: z.string().min(1, "Campaign name is required"),
   subject: z.string().min(1, "Subject is required"),
   body_html: z.string().min(1, "Email body is required"),
   body_plain: z.string().optional(),
   template_id: z.string().optional(),
   campaign_type: z.enum(["one-time", "scheduled", "recurring"]),
   is_birthday_campaign: z.boolean(),
   birthday_send_time: z.string().optional(),
   status: z.enum(["draft", "active", "paused", "completed"]),
 });
 
 type EmailCampaignFormData = z.infer<typeof emailCampaignSchema>;
 
 interface EmailCampaign {
   id: string;
   name: string;
   subject: string;
   body_html: string;
   body_plain: string | null;
   template_id: string | null;
   filters: Record<string, unknown>;
   campaign_type: string;
   schedule_config: Record<string, unknown>;
   status: string;
   recipient_count: number;
   is_birthday_campaign: boolean;
   birthday_send_time: string | null;
 }
 
 interface EmailCampaignModalProps {
   open: boolean;
   onClose: () => void;
   editingCampaign: EmailCampaign | null;
 }
 
 const DYNAMIC_VARIABLES = [
   { key: "{{name}}", label: "Customer Name" },
   { key: "{{email}}", label: "Email" },
   { key: "{{phone}}", label: "Phone" },
   { key: "{{gender}}", label: "Gender" },
   { key: "{{division}}", label: "Division" },
   { key: "{{thana}}", label: "Thana" },
   { key: "{{membership_type}}", label: "Membership Type" },
   { key: "{{birthdate}}", label: "Birthdate" },
 ];
 
 const EmailCampaignModal = ({ open, onClose, editingCampaign }: EmailCampaignModalProps) => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [filters, setFilters] = useState<Record<string, string[]>>({
     genders: [],
     divisions: [],
     thanas: [],
     customerTypes: [],
   });
   const [scheduleConfig, setScheduleConfig] = useState<Record<string, unknown>>({});
   const [recipientCount, setRecipientCount] = useState(0);
 
   const form = useForm<EmailCampaignFormData>({
     resolver: zodResolver(emailCampaignSchema),
     defaultValues: {
       name: "",
       subject: "",
       body_html: "",
       body_plain: "",
       template_id: "",
       campaign_type: "one-time",
       is_birthday_campaign: false,
       birthday_send_time: "09:00",
       status: "draft",
     },
   });
 
   const isBirthdayCampaign = form.watch("is_birthday_campaign");
   const campaignType = form.watch("campaign_type");
 
   // Fetch divisions
   const { data: divisions = [] } = useQuery({
     queryKey: ["divisions"],
     queryFn: async () => {
       const { data, error } = await supabase.from("divisions").select("*").eq("is_active", true);
       if (error) throw error;
       return data;
     },
   });
 
   // Fetch thanas
   const { data: thanas = [] } = useQuery({
     queryKey: ["thanas"],
     queryFn: async () => {
       const { data, error } = await supabase.from("thanas").select("*").eq("is_active", true);
       if (error) throw error;
       return data;
     },
   });
 
   // Fetch customer types
   const { data: customerTypes = [] } = useQuery({
     queryKey: ["customer-types"],
     queryFn: async () => {
       const { data, error } = await supabase.from("customer_types").select("*").eq("is_active", true);
       if (error) throw error;
       return data;
     },
   });
 
   // Fetch templates
   const { data: templates = [] } = useQuery({
     queryKey: ["email-templates"],
     queryFn: async () => {
       const { data, error } = await supabase.from("email_templates").select("*").order("name");
       if (error) throw error;
       return data;
     },
   });
 
   // Calculate recipient count
   useEffect(() => {
     const calculateRecipients = async () => {
       let query = supabase
         .from("customers")
         .select("id", { count: "exact" })
         .eq("is_active", true)
         .not("email", "is", null);
 
       if (isBirthdayCampaign) {
         query = query.not("birthdate", "is", null);
       }
 
       if (filters.genders.length > 0) {
         query = query.in("gender", filters.genders);
       }
       if (filters.divisions.length > 0) {
         query = query.in("division_id", filters.divisions);
       }
       if (filters.thanas.length > 0) {
         query = query.in("thana_id", filters.thanas);
       }
       if (filters.customerTypes.length > 0) {
         query = query.in("customer_type_id", filters.customerTypes);
       }
 
       const { count } = await query;
       setRecipientCount(count || 0);
     };
 
     calculateRecipients();
   }, [filters, isBirthdayCampaign]);
 
   useEffect(() => {
     if (editingCampaign) {
       form.reset({
         name: editingCampaign.name,
         subject: editingCampaign.subject,
         body_html: editingCampaign.body_html,
         body_plain: editingCampaign.body_plain || "",
         template_id: editingCampaign.template_id || "",
         campaign_type: editingCampaign.campaign_type as "one-time" | "scheduled" | "recurring",
         is_birthday_campaign: editingCampaign.is_birthday_campaign,
         birthday_send_time: editingCampaign.birthday_send_time || "09:00",
         status: editingCampaign.status as "draft" | "active" | "paused" | "completed",
       });
       setFilters((editingCampaign.filters as Record<string, string[]>) || {
         genders: [],
         divisions: [],
         thanas: [],
         customerTypes: [],
       });
       setScheduleConfig(editingCampaign.schedule_config || {});
     } else {
       form.reset({
         name: "",
         subject: "",
         body_html: "",
         body_plain: "",
         template_id: "",
         campaign_type: "one-time",
         is_birthday_campaign: false,
         birthday_send_time: "09:00",
         status: "draft",
       });
       setFilters({
         genders: [],
         divisions: [],
         thanas: [],
         customerTypes: [],
       });
       setScheduleConfig({});
     }
   }, [editingCampaign, form, open]);
 
   const mutation = useMutation({
     mutationFn: async (data: EmailCampaignFormData) => {
      const payload: Record<string, unknown> = {
         name: data.name,
         subject: data.subject,
         body_html: data.body_html,
         body_plain: data.body_plain || null,
         template_id: data.template_id || null,
        filters: filters as Record<string, unknown>,
         campaign_type: data.campaign_type,
        schedule_config: scheduleConfig as Record<string, unknown>,
         status: data.status,
         recipient_count: recipientCount,
         is_birthday_campaign: data.is_birthday_campaign,
         birthday_send_time: data.is_birthday_campaign ? data.birthday_send_time : null,
       };
 
       if (editingCampaign) {
         const { error } = await supabase
           .from("email_campaigns")
          .update(payload as any)
           .eq("id", editingCampaign.id);
         if (error) throw error;
       } else {
        const { error } = await supabase.from("email_campaigns").insert(payload as any);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
       toast({ title: editingCampaign ? "Campaign updated" : "Campaign created" });
       onClose();
     },
     onError: (error) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     },
   });
 
   const onSubmit = (data: EmailCampaignFormData) => {
     mutation.mutate(data);
   };
 
   const insertVariable = (variable: string) => {
     const currentBody = form.getValues("body_html");
     form.setValue("body_html", currentBody + variable);
   };
 
   const handleTemplateSelect = (templateId: string) => {
     const template = templates.find(t => t.id === templateId);
     if (template) {
       form.setValue("subject", template.subject);
       form.setValue("body_html", template.body_html);
       form.setValue("body_plain", template.body_plain || "");
       form.setValue("template_id", templateId);
     }
   };
 
   const toggleFilter = (category: string, value: string) => {
     setFilters(prev => {
       const current = prev[category] || [];
       if (current.includes(value)) {
         return { ...prev, [category]: current.filter(v => v !== value) };
       } else {
         return { ...prev, [category]: [...current, value] };
       }
     });
   };
 
   const bodyHtml = form.watch("body_html");
   const charCount = bodyHtml.length;
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>
             {editingCampaign ? "Edit Email Campaign" : "Create Email Campaign"}
           </DialogTitle>
         </DialogHeader>
 
         <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <Tabs defaultValue="content" className="w-full">
               <TabsList className="grid w-full grid-cols-4">
                 <TabsTrigger value="content">Content</TabsTrigger>
                 <TabsTrigger value="recipients">Recipients</TabsTrigger>
                 <TabsTrigger value="schedule">Schedule</TabsTrigger>
                 <TabsTrigger value="preview">Preview</TabsTrigger>
               </TabsList>
 
               <TabsContent value="content" className="space-y-4 mt-4">
                 <FormField
                   control={form.control}
                   name="name"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Campaign Name</FormLabel>
                       <FormControl>
                         <Input placeholder="e.g., Summer Sale Newsletter" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label>Load from Template</Label>
                     <Select onValueChange={handleTemplateSelect}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select a template..." />
                       </SelectTrigger>
                       <SelectContent>
                         {templates.map((template) => (
                           <SelectItem key={template.id} value={template.id}>
                             {template.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
 
                   <FormField
                     control={form.control}
                     name="is_birthday_campaign"
                     render={({ field }) => (
                       <FormItem className="flex items-center justify-between rounded-lg border p-3">
                         <div>
                           <FormLabel>🎂 Birthday Campaign</FormLabel>
                           <p className="text-xs text-muted-foreground">
                             Auto-send on customer birthdays
                           </p>
                         </div>
                         <FormControl>
                           <Switch checked={field.value} onCheckedChange={field.onChange} />
                         </FormControl>
                       </FormItem>
                     )}
                   />
                 </div>
 
                 <FormField
                   control={form.control}
                   name="subject"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Email Subject</FormLabel>
                       <FormControl>
                         <Input placeholder="Enter email subject..." {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <div>
                   <Label className="text-sm text-muted-foreground mb-2 block">
                     Dynamic Variables (click to insert):
                   </Label>
                   <div className="flex flex-wrap gap-1 mb-2">
                     {DYNAMIC_VARIABLES.map((v) => (
                       <Badge
                         key={v.key}
                         variant="outline"
                         className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                         onClick={() => insertVariable(v.key)}
                       >
                         {v.key}
                       </Badge>
                     ))}
                   </div>
                 </div>
 
                 <FormField
                   control={form.control}
                   name="body_html"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Email Body (HTML)</FormLabel>
                       <FormControl>
                         <Textarea
                           placeholder="<html>Enter your email content...</html>"
                           className="font-mono text-sm min-h-[200px]"
                           {...field}
                         />
                       </FormControl>
                       <div className="text-xs text-muted-foreground text-right">
                         {charCount} characters
                       </div>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="body_plain"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Plain Text Version (optional)</FormLabel>
                       <FormControl>
                         <Textarea
                           placeholder="Plain text fallback..."
                           className="text-sm min-h-[100px]"
                           {...field}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </TabsContent>
 
               <TabsContent value="recipients" className="space-y-4 mt-4">
                 <div className="bg-muted/50 p-4 rounded-lg">
                   <p className="text-lg font-semibold">
                     Estimated Recipients: <span className="text-primary">{recipientCount}</span>
                   </p>
                   <p className="text-sm text-muted-foreground">
                     Only customers with email addresses will receive this campaign
                   </p>
                 </div>
 
                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <Label className="font-medium mb-2 block">Gender</Label>
                     <div className="space-y-2">
                       {["male", "female", "other"].map((gender) => (
                         <div key={gender} className="flex items-center space-x-2">
                           <Checkbox
                             id={`gender-${gender}`}
                             checked={filters.genders?.includes(gender)}
                             onCheckedChange={() => toggleFilter("genders", gender)}
                           />
                           <label htmlFor={`gender-${gender}`} className="text-sm capitalize">
                             {gender}
                           </label>
                         </div>
                       ))}
                     </div>
                   </div>
 
                   <div>
                     <Label className="font-medium mb-2 block">Customer Type</Label>
                     <div className="space-y-2 max-h-[150px] overflow-y-auto">
                       {customerTypes.map((type) => (
                         <div key={type.id} className="flex items-center space-x-2">
                           <Checkbox
                             id={`type-${type.id}`}
                             checked={filters.customerTypes?.includes(type.id)}
                             onCheckedChange={() => toggleFilter("customerTypes", type.id)}
                           />
                           <label htmlFor={`type-${type.id}`} className="text-sm">
                             {type.name}
                           </label>
                         </div>
                       ))}
                     </div>
                   </div>
 
                   <div>
                     <Label className="font-medium mb-2 block">Division</Label>
                     <div className="space-y-2 max-h-[150px] overflow-y-auto">
                       {divisions.map((div) => (
                         <div key={div.id} className="flex items-center space-x-2">
                           <Checkbox
                             id={`div-${div.id}`}
                             checked={filters.divisions?.includes(div.id)}
                             onCheckedChange={() => toggleFilter("divisions", div.id)}
                           />
                           <label htmlFor={`div-${div.id}`} className="text-sm">
                             {div.name}
                           </label>
                         </div>
                       ))}
                     </div>
                   </div>
 
                   <div>
                     <Label className="font-medium mb-2 block">Thana</Label>
                     <div className="space-y-2 max-h-[150px] overflow-y-auto">
                       {thanas.map((thana) => (
                         <div key={thana.id} className="flex items-center space-x-2">
                           <Checkbox
                             id={`thana-${thana.id}`}
                             checked={filters.thanas?.includes(thana.id)}
                             onCheckedChange={() => toggleFilter("thanas", thana.id)}
                           />
                           <label htmlFor={`thana-${thana.id}`} className="text-sm">
                             {thana.name}
                           </label>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </TabsContent>
 
               <TabsContent value="schedule" className="space-y-4 mt-4">
                 <FormField
                   control={form.control}
                   name="campaign_type"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Campaign Type</FormLabel>
                       <Select
                         onValueChange={field.onChange}
                         value={field.value}
                         disabled={isBirthdayCampaign}
                       >
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="one-time">One-time</SelectItem>
                           <SelectItem value="scheduled">Scheduled</SelectItem>
                           <SelectItem value="recurring">Recurring</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 {isBirthdayCampaign && (
                   <FormField
                     control={form.control}
                     name="birthday_send_time"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Send Time (for birthdays)</FormLabel>
                         <FormControl>
                           <Input type="time" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 )}
 
                 {campaignType === "recurring" && !isBirthdayCampaign && (
                   <div className="space-y-4 p-4 border rounded-lg">
                     <Label>Recurring Schedule</Label>
                     <Select
                       value={(scheduleConfig.frequency as string) || "daily"}
                       onValueChange={(val) => setScheduleConfig(prev => ({ ...prev, frequency: val }))}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Select frequency" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="daily">Every Day</SelectItem>
                         <SelectItem value="weekly">Every Week</SelectItem>
                         <SelectItem value="half-monthly">Every Half Month</SelectItem>
                         <SelectItem value="monthly">Every Month</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 )}
 
                 <FormField
                   control={form.control}
                   name="status"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Status</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="draft">Draft</SelectItem>
                           <SelectItem value="active">Active</SelectItem>
                           <SelectItem value="paused">Paused</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </TabsContent>
 
               <TabsContent value="preview" className="mt-4">
                 <div className="border rounded-lg p-4 bg-white">
                   <div className="mb-4 pb-4 border-b">
                     <p className="text-sm text-muted-foreground">Subject:</p>
                     <p className="font-medium">{form.watch("subject") || "(No subject)"}</p>
                   </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(bodyHtml || "<p>No content yet...</p>", {
                        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'blockquote', 'img', 'span', 'div', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
                        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style', 'width', 'height'],
                        ALLOW_DATA_ATTR: false,
                      })
                    }}
                  />
                 </div>
               </TabsContent>
             </Tabs>
 
             <div className="flex justify-end gap-2 pt-4 border-t">
               <Button type="button" variant="outline" onClick={onClose}>
                 Cancel
               </Button>
               <Button type="submit" disabled={mutation.isPending}>
                 {mutation.isPending ? "Saving..." : editingCampaign ? "Update" : "Create"}
               </Button>
             </div>
           </form>
         </Form>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default EmailCampaignModal;