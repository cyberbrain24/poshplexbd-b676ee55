 import { useState } from "react";
 import AdminLayout from "@/components/admin/AdminLayout";
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
 import SmsApiModal from "@/components/admin/SmsApiModal";
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
   created_at: string;
   updated_at: string;
 }
 
 const AdminSmsApi = () => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingApi, setEditingApi] = useState<SmsApi | null>(null);
   const [deletingApi, setDeletingApi] = useState<SmsApi | null>(null);
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: smsApis = [], isLoading } = useQuery({
     queryKey: ["sms-apis"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("sms_apis")
         .select("*")
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as SmsApi[];
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("sms_apis").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sms-apis"] });
       toast({ title: "SMS API deleted successfully" });
       setDeletingApi(null);
     },
     onError: (error) => {
       toast({ title: "Error deleting SMS API", description: error.message, variant: "destructive" });
     },
   });
 
   const toggleActiveMutation = useMutation({
     mutationFn: async (api: SmsApi) => {
       const { error } = await supabase
         .from("sms_apis")
         .update({ is_active: !api.is_active })
         .eq("id", api.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sms-apis"] });
       toast({ title: "SMS API status updated" });
     },
     onError: (error) => {
       toast({ title: "Error updating status", description: error.message, variant: "destructive" });
     },
   });
 
   const handleEdit = (api: SmsApi) => {
     setEditingApi(api);
     setIsModalOpen(true);
   };
 
   const handleModalClose = () => {
     setIsModalOpen(false);
     setEditingApi(null);
   };
 
   return (
     <AdminLayout>
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-semibold tracking-tight">SMS API Configuration</h1>
             <p className="text-sm text-muted-foreground mt-1">
               Manage SMS gateway integrations. Only one API can be active at a time.
             </p>
           </div>
           <Button onClick={() => setIsModalOpen(true)} size="sm">
             <Plus className="h-4 w-4 mr-2" />
             Add SMS API
           </Button>
         </div>
 
         <div className="border rounded-lg">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Provider</TableHead>
                 <TableHead>API URL</TableHead>
                 <TableHead>Method</TableHead>
                 <TableHead>Sender ID</TableHead>
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
               ) : smsApis.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                     No SMS APIs configured. Add one to get started.
                   </TableCell>
                 </TableRow>
               ) : (
                 smsApis.map((api) => (
                   <TableRow key={api.id}>
                     <TableCell className="font-medium">{api.provider_name}</TableCell>
                     <TableCell className="max-w-[200px] truncate">{api.api_base_url}</TableCell>
                     <TableCell>{api.http_method}</TableCell>
                     <TableCell>{api.sender_id || "-"}</TableCell>
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
 
       <SmsApiModal
         open={isModalOpen}
         onClose={handleModalClose}
         editingApi={editingApi}
       />
 
       <AlertDialog open={!!deletingApi} onOpenChange={() => setDeletingApi(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete SMS API?</AlertDialogTitle>
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
     </AdminLayout>
   );
 };
 
 export default AdminSmsApi;