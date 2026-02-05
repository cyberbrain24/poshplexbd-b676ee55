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
 
 const emailApiSchema = z.object({
   provider_name: z.string().min(1, "Provider name is required"),
   connection_type: z.enum(["smtp", "api"]),
   api_base_url: z.string().optional(),
   smtp_host: z.string().optional(),
   smtp_port: z.coerce.number().optional(),
   username: z.string().optional(),
   api_key: z.string().min(1, "API key is required"),
   password: z.string().optional(),
   sender_email: z.string().email("Must be a valid email"),
   sender_name: z.string().min(1, "Sender name is required"),
   header_params: z.string().optional(),
   is_active: z.boolean(),
 });
 
 type EmailApiFormData = z.infer<typeof emailApiSchema>;
 
 interface EmailApi {
   id: string;
   provider_name: string;
   connection_type: string;
   api_base_url: string | null;
   smtp_host: string | null;
   smtp_port: number | null;
   username: string | null;
   api_key: string;
   password: string | null;
   sender_email: string;
   sender_name: string;
   header_params: Record<string, string>;
   is_active: boolean;
 }
 
 interface EmailApiModalProps {
   open: boolean;
   onClose: () => void;
   editingApi: EmailApi | null;
 }
 
 const EmailApiModal = ({ open, onClose, editingApi }: EmailApiModalProps) => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const form = useForm<EmailApiFormData>({
     resolver: zodResolver(emailApiSchema),
     defaultValues: {
       provider_name: "",
       connection_type: "api",
       api_base_url: "",
       smtp_host: "",
       smtp_port: 587,
       username: "",
       api_key: "",
       password: "",
       sender_email: "",
       sender_name: "",
       header_params: "",
       is_active: false,
     },
   });
 
   const connectionType = form.watch("connection_type");
 
   useEffect(() => {
     if (editingApi) {
       form.reset({
         provider_name: editingApi.provider_name,
         connection_type: editingApi.connection_type as "smtp" | "api",
         api_base_url: editingApi.api_base_url || "",
         smtp_host: editingApi.smtp_host || "",
         smtp_port: editingApi.smtp_port || 587,
         username: editingApi.username || "",
         api_key: editingApi.api_key,
         password: editingApi.password || "",
         sender_email: editingApi.sender_email,
         sender_name: editingApi.sender_name,
         header_params: JSON.stringify(editingApi.header_params || {}, null, 2),
         is_active: editingApi.is_active,
       });
     } else {
       form.reset({
         provider_name: "",
         connection_type: "api",
         api_base_url: "",
         smtp_host: "",
         smtp_port: 587,
         username: "",
         api_key: "",
         password: "",
         sender_email: "",
         sender_name: "",
         header_params: "",
         is_active: false,
       });
     }
   }, [editingApi, form, open]);
 
   const mutation = useMutation({
     mutationFn: async (data: EmailApiFormData) => {
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
         connection_type: data.connection_type,
         api_base_url: data.connection_type === "api" ? data.api_base_url : null,
         smtp_host: data.connection_type === "smtp" ? data.smtp_host : null,
         smtp_port: data.connection_type === "smtp" ? data.smtp_port : null,
         username: data.username || null,
         api_key: data.api_key,
         password: data.password || null,
         sender_email: data.sender_email,
         sender_name: data.sender_name,
         header_params: headerParams,
         is_active: data.is_active,
       };
 
       if (editingApi) {
         const { error } = await supabase
           .from("email_apis")
           .update(payload)
           .eq("id", editingApi.id);
         if (error) throw error;
       } else {
         const { error } = await supabase.from("email_apis").insert(payload);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-apis"] });
       toast({ title: editingApi ? "Email API updated" : "Email API created" });
       onClose();
     },
     onError: (error) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     },
   });
 
   const onSubmit = (data: EmailApiFormData) => {
     mutation.mutate(data);
   };
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{editingApi ? "Edit Email API" : "Add Email API"}</DialogTitle>
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
                       <Input placeholder="e.g., SendGrid, Mailgun, Resend" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="connection_type"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Connection Type</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="api">API</SelectItem>
                         <SelectItem value="smtp">SMTP</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             </div>
 
             {connectionType === "api" && (
               <FormField
                 control={form.control}
                 name="api_base_url"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>API Base URL</FormLabel>
                     <FormControl>
                       <Input placeholder="https://api.sendgrid.com/v3/mail/send" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             )}
 
             {connectionType === "smtp" && (
               <div className="grid grid-cols-2 gap-4">
                 <FormField
                   control={form.control}
                   name="smtp_host"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>SMTP Host</FormLabel>
                       <FormControl>
                         <Input placeholder="smtp.gmail.com" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
 
                 <FormField
                   control={form.control}
                   name="smtp_port"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>SMTP Port</FormLabel>
                       <FormControl>
                         <Input type="number" placeholder="587" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </div>
             )}
 
             <div className="grid grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="username"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Username (optional)</FormLabel>
                     <FormControl>
                       <Input placeholder="Username or email" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
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
             </div>
 
             {connectionType === "smtp" && (
               <FormField
                 control={form.control}
                 name="password"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Password (for SMTP)</FormLabel>
                     <FormControl>
                       <Input type="password" placeholder="SMTP password" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             )}
 
             <div className="grid grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="sender_email"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Sender Email</FormLabel>
                     <FormControl>
                       <Input placeholder="noreply@example.com" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="sender_name"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Sender Name</FormLabel>
                     <FormControl>
                       <Input placeholder="My Store" {...field} />
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
                       Only one API can be active. This will be used for all email sending.
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
 
 export default EmailApiModal;