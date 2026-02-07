import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import EmailApiModal from "@/components/admin/EmailApiModal";
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
   created_at: string;
   updated_at: string;
 }
 
 const AdminEmailApi = () => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingApi, setEditingApi] = useState<EmailApi | null>(null);
   const [deletingApi, setDeletingApi] = useState<EmailApi | null>(null);
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: emailApis = [], isLoading } = useQuery({
     queryKey: ["email-apis"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("email_apis")
         .select("*")
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as EmailApi[];
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("email_apis").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-apis"] });
       toast({ title: "Email API deleted successfully" });
       setDeletingApi(null);
     },
     onError: (error) => {
       toast({ title: "Error deleting Email API", description: error.message, variant: "destructive" });
     },
   });
 
   const toggleActiveMutation = useMutation({
     mutationFn: async (api: EmailApi) => {
       const { error } = await supabase
         .from("email_apis")
         .update({ is_active: !api.is_active })
         .eq("id", api.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-apis"] });
       toast({ title: "Email API status updated" });
     },
     onError: (error) => {
       toast({ title: "Error updating status", description: error.message, variant: "destructive" });
     },
   });
 
   const handleEdit = (api: EmailApi) => {
     setEditingApi(api);
     setIsModalOpen(true);
   };
 
   const handleModalClose = () => {
     setIsModalOpen(false);
     setEditingApi(null);
   };
 
   return (
     <>
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-semibold tracking-tight">Email API Configuration</h1>
             <p className="text-sm text-muted-foreground mt-1">
               Manage email gateway integrations (SMTP or API). Only one can be active at a time.
             </p>
           </div>
           <Button onClick={() => setIsModalOpen(true)} size="sm">
             <Plus className="h-4 w-4 mr-2" />
             Add Email API
           </Button>
         </div>
 
         <div className="border rounded-lg">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Provider</TableHead>
                 <TableHead>Type</TableHead>
                 <TableHead>Host/URL</TableHead>
                 <TableHead>Sender</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isLoading ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                     Loading...
                   </TableCell>
                 </TableRow>
               ) : emailApis.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                     No Email APIs configured. Add one to get started.
                   </TableCell>
                 </TableRow>
               ) : (
                 emailApis.map((api) => (
                   <TableRow key={api.id}>
                     <TableCell className="font-medium">{api.provider_name}</TableCell>
                     <TableCell>
                       <Badge variant="outline">
                         {api.connection_type.toUpperCase()}
                       </Badge>
                     </TableCell>
                     <TableCell className="max-w-[200px] truncate">
                       {api.connection_type === "smtp" ? api.smtp_host : api.api_base_url}
                     </TableCell>
                     <TableCell>{api.sender_email}</TableCell>
                     <TableCell>
                       <Badge
                         variant={api.is_active ? "default" : "secondary"}
                         className="cursor-pointer"
                         onClick={() => toggleActiveMutation.mutate(api)}
                       >
                         {api.is_active ? (
                           <>
                             <Check className="h-3 w-3 mr-1" /> Active
                           </>
                         ) : (
                           <>
                             <X className="h-3 w-3 mr-1" /> Inactive
                           </>
                         )}
                       </Badge>
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                         <Button variant="ghost" size="icon" onClick={() => handleEdit(api)}>
                           <Pencil className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => setDeletingApi(api)}>
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
       </div>
 
       <EmailApiModal
         open={isModalOpen}
         onClose={handleModalClose}
         editingApi={editingApi}
       />
 
       <AlertDialog open={!!deletingApi} onOpenChange={() => setDeletingApi(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Email API?</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{deletingApi?.provider_name}"? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={() => deletingApi && deleteMutation.mutate(deletingApi.id)}>
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 };
 
 export default AdminEmailApi;