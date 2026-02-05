 import { useEffect, useState } from "react";
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
   FormDescription,
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
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Calendar } from "@/components/ui/calendar";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { CalendarIcon, Info } from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 
 const campaignSchema = z.object({
   name: z.string().min(1, "Campaign name is required"),
   message: z.string().min(1, "Message is required"),
   campaign_type: z.enum(["one-time", "scheduled", "automated"]),
   status: z.enum(["draft", "active", "paused", "completed"]),
   birthday_send_time: z.string().optional(),
 });
 
 type CampaignFormData = z.infer<typeof campaignSchema>;
 
 interface SmsCampaign {
   id: string;
   name: string;
   message: string;
   campaign_type: string;
   status: string;
   filters: Record<string, unknown>;
   schedule_config: Record<string, unknown>;
   is_birthday_campaign: boolean;
   birthday_send_time: string | null;
   recipient_count: number;
 }
 
 interface SmsCampaignModalProps {
   open: boolean;
   onClose: () => void;
   editingCampaign: SmsCampaign | null;
   isBirthdayMode: boolean;
 }
 
 const DYNAMIC_VARIABLES = [
   { key: "{{name}}", label: "Customer Name" },
   { key: "{{phone}}", label: "Phone Number" },
   { key: "{{gender}}", label: "Gender" },
   { key: "{{division}}", label: "Division" },
   { key: "{{thana}}", label: "Thana" },
   { key: "{{membership_type}}", label: "Membership Type" },
   { key: "{{birthdate}}", label: "Birthdate" },
 ];
 
 const SmsCampaignModal = ({ open, onClose, editingCampaign, isBirthdayMode }: SmsCampaignModalProps) => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [filters, setFilters] = useState<Record<string, unknown>>({});
   const [scheduleConfig, setScheduleConfig] = useState<Record<string, unknown>>({});
   const [recipientCount, setRecipientCount] = useState(0);
 
   // Fetch filter options
   const { data: divisions = [] } = useQuery({
     queryKey: ["divisions"],
     queryFn: async () => {
       const { data } = await supabase.from("divisions").select("*").eq("is_active", true);
       return data || [];
     },
   });
 
   const { data: thanas = [] } = useQuery({
     queryKey: ["thanas"],
     queryFn: async () => {
       const { data } = await supabase.from("thanas").select("*").eq("is_active", true);
       return data || [];
     },
   });
 
   const { data: customerTypes = [] } = useQuery({
     queryKey: ["customer-types"],
     queryFn: async () => {
       const { data } = await supabase.from("customer_types").select("*").eq("is_active", true);
       return data || [];
     },
   });
 
   const form = useForm<CampaignFormData>({
     resolver: zodResolver(campaignSchema),
     defaultValues: {
       name: "",
       message: isBirthdayMode ? "Happy Birthday {{name}} 🎉 Thank you for being with us!" : "",
       campaign_type: isBirthdayMode ? "automated" : "one-time",
       status: "draft",
       birthday_send_time: "09:00",
     },
   });
 
   const message = form.watch("message");
   const charCount = message?.length || 0;
   const smsCount = Math.ceil(charCount / 160) || 1;
 
   useEffect(() => {
     if (editingCampaign) {
       form.reset({
         name: editingCampaign.name,
         message: editingCampaign.message,
         campaign_type: editingCampaign.campaign_type as "one-time" | "scheduled" | "automated",
         status: editingCampaign.status as "draft" | "active" | "paused" | "completed",
         birthday_send_time: editingCampaign.birthday_send_time || "09:00",
       });
       setFilters(editingCampaign.filters || {});
       setScheduleConfig(editingCampaign.schedule_config || {});
       setRecipientCount(editingCampaign.recipient_count);
     } else {
       form.reset({
         name: "",
         message: isBirthdayMode ? "Happy Birthday {{name}} 🎉 Thank you for being with us!" : "",
         campaign_type: isBirthdayMode ? "automated" : "one-time",
         status: "draft",
         birthday_send_time: "09:00",
       });
       setFilters({});
       setScheduleConfig({});
       setRecipientCount(0);
     }
   }, [editingCampaign, form, open, isBirthdayMode]);
 
   // Calculate recipients based on filters
   useEffect(() => {
     const calculateRecipients = async () => {
       let query = supabase.from("customers").select("id", { count: "exact" }).eq("is_active", true);
 
       if (isBirthdayMode) {
         query = query.not("birthdate", "is", null);
       }
 
       if ((filters.genders as string[])?.length) {
         query = query.in("gender", filters.genders as string[]);
       }
       if ((filters.divisions as string[])?.length) {
         query = query.in("division_id", filters.divisions as string[]);
       }
       if ((filters.thanas as string[])?.length) {
         query = query.in("thana_id", filters.thanas as string[]);
       }
       if ((filters.customerTypes as string[])?.length) {
         query = query.in("customer_type_id", filters.customerTypes as string[]);
       }
 
       const { count } = await query;
       setRecipientCount(count || 0);
     };
 
     calculateRecipients();
   }, [filters, isBirthdayMode]);
 
   const mutation = useMutation({
     mutationFn: async (data: CampaignFormData) => {
       const payload = {
         name: data.name,
         message: data.message,
         campaign_type: data.campaign_type,
         status: data.status,
         filters: filters as unknown as Record<string, never>,
         schedule_config: scheduleConfig as unknown as Record<string, never>,
         is_birthday_campaign: isBirthdayMode,
         birthday_send_time: isBirthdayMode ? data.birthday_send_time : null,
         recipient_count: recipientCount,
       };
 
       if (editingCampaign) {
         const { error } = await supabase
           .from("sms_campaigns")
           .update(payload)
           .eq("id", editingCampaign.id);
         if (error) throw error;
       } else {
         const { error } = await supabase.from("sms_campaigns").insert(payload);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sms-campaigns"] });
       toast({ title: editingCampaign ? "Campaign updated" : "Campaign created" });
       onClose();
     },
     onError: (error) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     },
   });
 
   const insertVariable = (variable: string) => {
     const currentMessage = form.getValues("message");
     form.setValue("message", currentMessage + variable);
   };
 
   const handleFilterChange = (key: string, value: string, checked: boolean) => {
     setFilters((prev) => {
       const current = (prev[key] as string[]) || [];
       if (checked) {
         return { ...prev, [key]: [...current, value] };
       } else {
         return { ...prev, [key]: current.filter((v) => v !== value) };
       }
     });
   };
 
   const onSubmit = (data: CampaignFormData) => {
     mutation.mutate(data);
   };
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
         <DialogHeader>
           <DialogTitle>
             {editingCampaign ? "Edit" : "Create"} {isBirthdayMode ? "Birthday" : "SMS"} Campaign
           </DialogTitle>
         </DialogHeader>
 
         <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
             <Tabs defaultValue="message" className="flex-1 overflow-hidden flex flex-col">
               <TabsList className="grid w-full grid-cols-3">
                 <TabsTrigger value="message">Message</TabsTrigger>
                 <TabsTrigger value="filters">Filters ({recipientCount} recipients)</TabsTrigger>
                 {!isBirthdayMode && <TabsTrigger value="schedule">Schedule</TabsTrigger>}
                 {isBirthdayMode && <TabsTrigger value="schedule">Settings</TabsTrigger>}
               </TabsList>
 
               <ScrollArea className="flex-1 pr-4">
                 <TabsContent value="message" className="space-y-4 mt-4">
                   <FormField
                     control={form.control}
                     name="name"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Campaign Name</FormLabel>
                         <FormControl>
                           <Input placeholder="e.g., Summer Sale Promo" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
 
                   <div className="space-y-2">
                     <FormLabel>Dynamic Variables</FormLabel>
                     <div className="flex flex-wrap gap-2">
                       {DYNAMIC_VARIABLES.map((v) => (
                         <Badge
                           key={v.key}
                           variant="outline"
                           className="cursor-pointer hover:bg-muted"
                           onClick={() => insertVariable(v.key)}
                         >
                           {v.key}
                         </Badge>
                       ))}
                     </div>
                     <p className="text-xs text-muted-foreground">
                       Click to insert. Variables are replaced with customer data at send time.
                     </p>
                   </div>
 
                   <FormField
                     control={form.control}
                     name="message"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>SMS Message</FormLabel>
                         <FormControl>
                           <Textarea
                             placeholder="Enter your message..."
                             className="min-h-[120px]"
                             {...field}
                           />
                         </FormControl>
                         <div className="flex justify-between text-xs text-muted-foreground">
                           <span>{charCount} characters</span>
                           <span>{smsCount} SMS ({smsCount * 160 - charCount} chars remaining)</span>
                         </div>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
 
                   {message && (
                     <div className="p-4 bg-muted rounded-lg">
                       <p className="text-sm font-medium mb-2">Preview:</p>
                       <p className="text-sm">{message}</p>
                     </div>
                   )}
 
                   {!isBirthdayMode && (
                     <div className="grid grid-cols-2 gap-4">
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
                                 <SelectItem value="one-time">One-time</SelectItem>
                                 <SelectItem value="scheduled">Scheduled</SelectItem>
                                 <SelectItem value="automated">Recurring</SelectItem>
                               </SelectContent>
                             </Select>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
 
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
                     </div>
                   )}
                 </TabsContent>
 
                 <TabsContent value="filters" className="space-y-4 mt-4">
                   <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                     <Info className="h-4 w-4" />
                     <span className="text-sm">
                       {recipientCount} customers match the current filters.
                       {isBirthdayMode && " Only customers with birthdate will receive birthday SMS."}
                     </span>
                   </div>
 
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                       <p className="font-medium text-sm">Gender</p>
                       {["male", "female", "other"].map((gender) => (
                         <div key={gender} className="flex items-center gap-2">
                           <Checkbox
                             id={`gender-${gender}`}
                             checked={(filters.genders as string[])?.includes(gender)}
                             onCheckedChange={(checked) =>
                               handleFilterChange("genders", gender, checked as boolean)
                             }
                           />
                           <label htmlFor={`gender-${gender}`} className="text-sm capitalize">
                             {gender}
                           </label>
                         </div>
                       ))}
                     </div>
 
                     <div className="space-y-3">
                       <p className="font-medium text-sm">Membership Type</p>
                       {customerTypes.map((type) => (
                         <div key={type.id} className="flex items-center gap-2">
                           <Checkbox
                             id={`type-${type.id}`}
                             checked={(filters.customerTypes as string[])?.includes(type.id)}
                             onCheckedChange={(checked) =>
                               handleFilterChange("customerTypes", type.id, checked as boolean)
                             }
                           />
                           <label htmlFor={`type-${type.id}`} className="text-sm">
                             {type.name}
                           </label>
                         </div>
                       ))}
                     </div>
 
                     <div className="space-y-3">
                       <p className="font-medium text-sm">Division</p>
                       <ScrollArea className="h-[150px]">
                         {divisions.map((div) => (
                           <div key={div.id} className="flex items-center gap-2 py-1">
                             <Checkbox
                               id={`div-${div.id}`}
                               checked={(filters.divisions as string[])?.includes(div.id)}
                               onCheckedChange={(checked) =>
                                 handleFilterChange("divisions", div.id, checked as boolean)
                               }
                             />
                             <label htmlFor={`div-${div.id}`} className="text-sm">
                               {div.name}
                             </label>
                           </div>
                         ))}
                       </ScrollArea>
                     </div>
 
                     <div className="space-y-3">
                       <p className="font-medium text-sm">Thana</p>
                       <ScrollArea className="h-[150px]">
                         {thanas.map((thana) => (
                           <div key={thana.id} className="flex items-center gap-2 py-1">
                             <Checkbox
                               id={`thana-${thana.id}`}
                               checked={(filters.thanas as string[])?.includes(thana.id)}
                               onCheckedChange={(checked) =>
                                 handleFilterChange("thanas", thana.id, checked as boolean)
                               }
                             />
                             <label htmlFor={`thana-${thana.id}`} className="text-sm">
                               {thana.name}
                             </label>
                           </div>
                         ))}
                       </ScrollArea>
                     </div>
                   </div>
                 </TabsContent>
 
                 <TabsContent value="schedule" className="space-y-4 mt-4">
                   {isBirthdayMode ? (
                     <div className="space-y-4">
                       <FormField
                         control={form.control}
                         name="birthday_send_time"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Send Time</FormLabel>
                             <FormControl>
                               <Input type="time" {...field} />
                             </FormControl>
                             <FormDescription>
                               SMS will be sent at this time on each customer's birthday.
                             </FormDescription>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
 
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
                                 <SelectItem value="draft">Draft (Inactive)</SelectItem>
                                 <SelectItem value="active">Active (Auto-send enabled)</SelectItem>
                                 <SelectItem value="paused">Paused</SelectItem>
                               </SelectContent>
                             </Select>
                             <FormDescription>
                               When active, birthday SMS will be sent automatically every day.
                             </FormDescription>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                   ) : (
                     <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <FormLabel>Schedule Type</FormLabel>
                           <Select
                             value={(scheduleConfig.type as string) || "immediate"}
                             onValueChange={(value) =>
                               setScheduleConfig({ ...scheduleConfig, type: value })
                             }
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="immediate">Send Immediately</SelectItem>
                               <SelectItem value="once">Send at Specific Date/Time</SelectItem>
                               <SelectItem value="daily">Every Day</SelectItem>
                               <SelectItem value="weekly">Every Week</SelectItem>
                               <SelectItem value="monthly">Every Month</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
 
                         {scheduleConfig.type !== "immediate" && (
                           <div className="space-y-2">
                             <FormLabel>Send Time</FormLabel>
                             <Input
                               type="time"
                               value={(scheduleConfig.time as string) || "09:00"}
                               onChange={(e) =>
                                 setScheduleConfig({ ...scheduleConfig, time: e.target.value })
                               }
                             />
                           </div>
                         )}
                       </div>
 
                       {scheduleConfig.type === "once" && (
                         <div className="space-y-2">
                           <FormLabel>Send Date</FormLabel>
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className={cn(
                                   "w-full justify-start text-left font-normal",
                                   !scheduleConfig.date && "text-muted-foreground"
                                 )}
                               >
                                 <CalendarIcon className="mr-2 h-4 w-4" />
                                 {scheduleConfig.date
                                   ? format(new Date(scheduleConfig.date as string), "PPP")
                                   : "Pick a date"}
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0">
                               <Calendar
                                 mode="single"
                                 selected={
                                   scheduleConfig.date
                                     ? new Date(scheduleConfig.date as string)
                                     : undefined
                                 }
                                 onSelect={(date) =>
                                   setScheduleConfig({
                                     ...scheduleConfig,
                                     date: date?.toISOString(),
                                   })
                                 }
                                 initialFocus
                                 className="pointer-events-auto"
                               />
                             </PopoverContent>
                           </Popover>
                         </div>
                       )}
 
                       {scheduleConfig.type === "weekly" && (
                         <div className="space-y-2">
                           <FormLabel>Day of Week</FormLabel>
                           <Select
                             value={(scheduleConfig.dayOfWeek as string) || "1"}
                             onValueChange={(value) =>
                               setScheduleConfig({ ...scheduleConfig, dayOfWeek: value })
                             }
                           >
                             <SelectTrigger>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="0">Sunday</SelectItem>
                               <SelectItem value="1">Monday</SelectItem>
                               <SelectItem value="2">Tuesday</SelectItem>
                               <SelectItem value="3">Wednesday</SelectItem>
                               <SelectItem value="4">Thursday</SelectItem>
                               <SelectItem value="5">Friday</SelectItem>
                               <SelectItem value="6">Saturday</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       )}
 
                       {scheduleConfig.type === "monthly" && (
                         <div className="space-y-2">
                           <FormLabel>Day of Month</FormLabel>
                           <Input
                             type="number"
                             min={1}
                             max={31}
                             value={(scheduleConfig.dayOfMonth as number) || 1}
                             onChange={(e) =>
                               setScheduleConfig({
                                 ...scheduleConfig,
                                 dayOfMonth: parseInt(e.target.value),
                               })
                             }
                           />
                         </div>
                       )}
                     </div>
                   )}
                 </TabsContent>
               </ScrollArea>
             </Tabs>
 
             <div className="flex justify-end gap-2 pt-4 border-t mt-4">
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
 
 export default SmsCampaignModal;