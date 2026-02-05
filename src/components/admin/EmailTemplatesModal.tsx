 import { useState } from "react";
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
 import { Textarea } from "@/components/ui/textarea";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { Badge } from "@/components/ui/badge";
 import { Plus, Pencil, Trash2 } from "lucide-react";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 
 const templateSchema = z.object({
   name: z.string().min(1, "Template name is required"),
   subject: z.string().min(1, "Subject is required"),
   body_html: z.string().min(1, "Body is required"),
   body_plain: z.string().optional(),
 });
 
 type TemplateFormData = z.infer<typeof templateSchema>;
 
 interface EmailTemplate {
   id: string;
   name: string;
   subject: string;
   body_html: string;
   body_plain: string | null;
   created_at: string;
   updated_at: string;
 }
 
 interface EmailTemplatesModalProps {
   open: boolean;
   onClose: () => void;
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
 
 const EmailTemplatesModal = ({ open, onClose }: EmailTemplatesModalProps) => {
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [isEditing, setIsEditing] = useState(false);
   const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
   const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
 
   const form = useForm<TemplateFormData>({
     resolver: zodResolver(templateSchema),
     defaultValues: {
       name: "",
       subject: "",
       body_html: "",
       body_plain: "",
     },
   });
 
   const { data: templates = [], isLoading } = useQuery({
     queryKey: ["email-templates"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("email_templates")
         .select("*")
         .order("name");
       if (error) throw error;
       return data as EmailTemplate[];
     },
   });
 
   const saveMutation = useMutation({
     mutationFn: async (data: TemplateFormData) => {
       const payload = {
         name: data.name,
         subject: data.subject,
         body_html: data.body_html,
         body_plain: data.body_plain || null,
       };
 
       if (editingTemplate) {
         const { error } = await supabase
           .from("email_templates")
           .update(payload)
           .eq("id", editingTemplate.id);
         if (error) throw error;
       } else {
         const { error } = await supabase.from("email_templates").insert(payload);
         if (error) throw error;
       }
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-templates"] });
       toast({ title: editingTemplate ? "Template updated" : "Template created" });
       resetForm();
     },
     onError: (error) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("email_templates").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-templates"] });
       toast({ title: "Template deleted" });
       setDeletingTemplate(null);
     },
     onError: (error) => {
       toast({ title: "Error", description: error.message, variant: "destructive" });
     },
   });
 
   const resetForm = () => {
     form.reset({
       name: "",
       subject: "",
       body_html: "",
       body_plain: "",
     });
     setIsEditing(false);
     setEditingTemplate(null);
   };
 
   const handleEdit = (template: EmailTemplate) => {
     setEditingTemplate(template);
     form.reset({
       name: template.name,
       subject: template.subject,
       body_html: template.body_html,
       body_plain: template.body_plain || "",
     });
     setIsEditing(true);
   };
 
   const insertVariable = (variable: string) => {
     const currentBody = form.getValues("body_html");
     form.setValue("body_html", currentBody + variable);
   };
 
   const onSubmit = (data: TemplateFormData) => {
     saveMutation.mutate(data);
   };
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Email Templates</DialogTitle>
         </DialogHeader>
 
         {isEditing ? (
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField
                 control={form.control}
                 name="name"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Template Name</FormLabel>
                     <FormControl>
                       <Input placeholder="e.g., Welcome Email" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <FormField
                 control={form.control}
                 name="subject"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Email Subject</FormLabel>
                     <FormControl>
                       <Input placeholder="Enter subject line..." {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <div>
                 <p className="text-sm text-muted-foreground mb-2">
                   Dynamic Variables (click to insert):
                 </p>
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
                         placeholder="<html>Enter your email template...</html>"
                         className="font-mono text-sm min-h-[200px]"
                         {...field}
                       />
                     </FormControl>
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
                         className="text-sm min-h-[80px]"
                         {...field}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
 
               <div className="flex justify-end gap-2">
                 <Button type="button" variant="outline" onClick={resetForm}>
                   Cancel
                 </Button>
                 <Button type="submit" disabled={saveMutation.isPending}>
                   {saveMutation.isPending ? "Saving..." : editingTemplate ? "Update" : "Create"}
                 </Button>
               </div>
             </form>
           </Form>
         ) : (
           <>
             <div className="flex justify-end">
               <Button size="sm" onClick={() => setIsEditing(true)}>
                 <Plus className="h-4 w-4 mr-2" />
                 New Template
               </Button>
             </div>
 
             <div className="border rounded-lg">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Name</TableHead>
                     <TableHead>Subject</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {isLoading ? (
                     <TableRow>
                       <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                         Loading...
                       </TableCell>
                     </TableRow>
                   ) : templates.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                         No templates yet. Create one to get started.
                       </TableCell>
                     </TableRow>
                   ) : (
                     templates.map((template) => (
                       <TableRow key={template.id}>
                         <TableCell className="font-medium">{template.name}</TableCell>
                         <TableCell className="max-w-[300px] truncate">
                           {template.subject}
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex items-center justify-end gap-2">
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleEdit(template)}
                             >
                               <Pencil className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => setDeletingTemplate(template)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </div>
           </>
         )}
 
         <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Delete Template?</AlertDialogTitle>
               <AlertDialogDescription>
                 Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel>Cancel</AlertDialogCancel>
               <AlertDialogAction
                 onClick={() => deletingTemplate && deleteMutation.mutate(deletingTemplate.id)}
               >
                 Delete
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default EmailTemplatesModal;