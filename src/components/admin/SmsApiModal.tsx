 import { useEffect } from "react";
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
 import { useMutation, useQueryClient } from "@tanstack/react-query";
 
 const smsApiSchema = z.object({
   provider_name: z.string().min(1, "Provider name is required"),
   api_base_url: z.string().url("Must be a valid URL"),
   http_method: z.enum(["GET", "POST"]),
   api_key: z.string().min(1, "API key is required"),
   sender_id: z.string().optional(),
   phone_param_name: z.string().min(1, "Phone parameter name is required"),
   message_param_name: z.string().min(1, "Message parameter name is required"),
   header_params: z.string().optional(),
   content_type: z.enum(["json", "form-data"]),
   is_active: z.boolean(),
 });
 
 type SmsApiFormData = z.infer<typeof smsApiSchema>;
 
 interface SmsApi {
   id: string;
   provider_name: string;
   api_base_url: string;
   http_method: string;
   api_key: string;
   sender_id: string | null;
   phone_param_name: string;
   message_param_name: string;
   header_params: Record<string, string>;
   content_type: string;
   is_active: boolean;
 }
 
 interface SmsApiModalProps {
   open: boolean;
   onClose: () => void;
   editingApi: SmsApi | null;
 }
 
 const SmsApiModal = ({ open, onClose, editingApi }: SmsApiModalProps) => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const form = useForm<SmsApiFormData>({
     resolver: zodResolver(smsApiSchema),
     defaultValues: {
       provider_name: "",
       api_base_url: "",
       http_method: "POST",
       api_key: "",
       sender_id: "",
       phone_param_name: "phone",
       message_param_name: "message",
       header_params: "",
       content_type: "json",
       is_active: false,
     },
   });
 
   useEffect(() => {
     if (editingApi) {
       form.reset({
         provider_name: editingApi.provider_name,
         api_base_url: editingApi.api_base_url,
         http_method: editingApi.http_method as "GET" | "POST",
         api_key: editingApi.api_key,
         sender_id: editingApi.sender_id || "",
         phone_param_name: editingApi.phone_param_name,
         message_param_name: editingApi.message_param_name,
         header_params: JSON.stringify(editingApi.header_params || {}, null, 2),
         content_type: editingApi.content_type as "json" | "form-data",
         is_active: editingApi.is_active,
       });
     } else {
       form.reset({
         provider_name: "",
         api_base_url: "",
         http_method: "POST",
         api_key: "",
         sender_id: "",
         phone_param_name: "phone",
         message_param_name: "message",
         header_params: "",
         content_type: "json",
         is_active: false,
       });
     }
   }, [editingApi, form, open]);
 
   const mutation = useMutation({
     mutationFn: async (data: SmsApiFormData) => {
       let headerParams = {};
       if (data.header_params) {
         try {
           headerParams = JSON.parse(data.header_params);
         } catch {
           throw new Error("Invalid JSON in header parameters");
         }
       }
 
       const payload = {
         provider_name: data.provider_name,
         api_base_url: data.api_base_url,
         http_method: data.http_method,
         api_key: data.api_key,
         sender_id: data.sender_id || null,
         phone_param_name: data.phone_param_name,
         message_param_name: data.message_param_name,
         header_params: headerParams,
         content_type: data.content_type,
         is_active: data.is_active,
       };
 
       if (editingApi) {
         const { error } = await supabase
           .from("sms_apis")
           .update(payload)
           .eq("id", editingApi.id);
         if (error) throw error;
       } else {
         const { error } = await supabase.from("sms_apis").insert(payload);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sms-apis"] });
       toast({ title: editingApi ? "SMS API updated" : "SMS API created" });
       onClose();
     },
     onError: (error) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     },
   });
 
   const onSubmit = (data: SmsApiFormData) => {
     mutation.mutate(data);
   };
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{editingApi ? "Edit SMS API" : "Add SMS API"}</DialogTitle>
         </DialogHeader>
 
         <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="provider_name"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Provider Name</FormLabel>
                     <FormControl>
                       <Input placeholder="e.g., Twilio, MSG91" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="sender_id"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Sender ID / Masking Name</FormLabel>
                     <FormControl>
                       <Input placeholder="e.g., MYSHOP" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             </div>
 
             <FormField
               control={form.control}
               name="api_base_url"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>API Base URL</FormLabel>
                   <FormControl>
                     <Input placeholder="https://api.provider.com/sms/send" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
 
             <div className="grid grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="http_method"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>HTTP Method</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="GET">GET</SelectItem>
                         <SelectItem value="POST">POST</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="content_type"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Content Type</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="json">JSON</SelectItem>
                         <SelectItem value="form-data">Form Data</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             </div>
 
             <FormField
               control={form.control}
               name="api_key"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>API Key / Token</FormLabel>
                   <FormControl>
                     <Input type="password" placeholder="Your API key" {...field} />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
 
             <div className="grid grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="phone_param_name"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Phone Parameter Name</FormLabel>
                     <FormControl>
                       <Input placeholder="phone" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="message_param_name"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Message Parameter Name</FormLabel>
                     <FormControl>
                       <Input placeholder="message" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             </div>
 
             <FormField
               control={form.control}
               name="header_params"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Header Parameters (JSON, optional)</FormLabel>
                   <FormControl>
                     <Textarea
                       placeholder='{"Authorization": "Bearer {{api_key}}"}'
                       className="font-mono text-sm"
                       rows={3}
                       {...field}
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
 
             <FormField
               control={form.control}
               name="is_active"
               render={({ field }) => (
                 <FormItem className="flex items-center justify-between rounded-lg border p-3">
                   <div>
                     <FormLabel>Active</FormLabel>
                     <p className="text-sm text-muted-foreground">
                       Only one API can be active. This will be used for all SMS sending.
                     </p>
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
 
 export default SmsApiModal;