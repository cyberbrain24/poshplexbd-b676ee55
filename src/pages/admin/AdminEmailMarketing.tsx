 import { useState } from "react";
 import AdminLayout from "@/components/admin/AdminLayout";
 import { Button } from "@/components/ui/button";
 import { Plus, Pencil, Trash2, Play, Pause, History, FileText } from "lucide-react";
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
 import EmailCampaignModal from "@/components/admin/EmailCampaignModal";
 import EmailCampaignLogsModal from "@/components/admin/EmailCampaignLogsModal";
 import EmailTemplatesModal from "@/components/admin/EmailTemplatesModal";
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
 import { format } from "date-fns";
 
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
   last_run_at: string | null;
   next_run_at: string | null;
   created_at: string;
   updated_at: string;
 }
 
 const AdminEmailMarketing = () => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
   const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
   const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
   const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
   const [deletingCampaign, setDeletingCampaign] = useState<EmailCampaign | null>(null);
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: campaigns = [], isLoading } = useQuery({
     queryKey: ["email-campaigns"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("email_campaigns")
         .select("*")
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as EmailCampaign[];
     },
   });
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
       toast({ title: "Campaign deleted successfully" });
       setDeletingCampaign(null);
     },
     onError: (error) => {
       toast({ title: "Error deleting campaign", description: error.message, variant: "destructive" });
     },
   });
 
   const toggleStatusMutation = useMutation({
     mutationFn: async (campaign: EmailCampaign) => {
       const newStatus = campaign.status === "active" ? "paused" : "active";
       const { error } = await supabase
         .from("email_campaigns")
         .update({ status: newStatus })
         .eq("id", campaign.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });
       toast({ title: "Campaign status updated" });
     },
     onError: (error) => {
       toast({ title: "Error updating status", description: error.message, variant: "destructive" });
     },
   });
 
   const handleEdit = (campaign: EmailCampaign) => {
     setEditingCampaign(campaign);
     setIsModalOpen(true);
   };
 
   const handleViewLogs = (campaign: EmailCampaign) => {
     setSelectedCampaign(campaign);
     setIsLogsModalOpen(true);
   };
 
   const handleModalClose = () => {
     setIsModalOpen(false);
     setEditingCampaign(null);
   };
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case "active":
        return <Badge>Active</Badge>;
       case "paused":
         return <Badge variant="secondary">Paused</Badge>;
       case "completed":
         return <Badge variant="outline">Completed</Badge>;
       default:
         return <Badge variant="outline">Draft</Badge>;
     }
   };
 
   const getCampaignTypeBadge = (campaign: EmailCampaign) => {
     if (campaign.is_birthday_campaign) {
        return <Badge variant="outline">🎂 Birthday</Badge>;
     }
     switch (campaign.campaign_type) {
       case "scheduled":
         return <Badge variant="outline">Scheduled</Badge>;
       case "recurring":
         return <Badge variant="outline">Recurring</Badge>;
       default:
         return <Badge variant="outline">One-time</Badge>;
     }
   };
 
   return (
     <AdminLayout>
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-semibold tracking-tight">Email Marketing</h1>
             <p className="text-sm text-muted-foreground mt-1">
               Create and manage email campaigns with automation
             </p>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => setIsTemplatesModalOpen(true)}>
               <FileText className="h-4 w-4 mr-2" />
               Templates
             </Button>
             <Button onClick={() => setIsModalOpen(true)} size="sm">
               <Plus className="h-4 w-4 mr-2" />
               New Campaign
             </Button>
           </div>
         </div>
 
         <div className="border rounded-lg">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Campaign</TableHead>
                 <TableHead>Type</TableHead>
                 <TableHead>Recipients</TableHead>
                 <TableHead>Last Run</TableHead>
                 <TableHead>Next Run</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-right">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isLoading ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                     Loading...
                   </TableCell>
                 </TableRow>
               ) : campaigns.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                     No campaigns yet. Create one to get started.
                   </TableCell>
                 </TableRow>
               ) : (
                 campaigns.map((campaign) => (
                   <TableRow key={campaign.id}>
                     <TableCell>
                       <div>
                         <div className="font-medium">{campaign.name}</div>
                         <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                           {campaign.subject}
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>{getCampaignTypeBadge(campaign)}</TableCell>
                     <TableCell>{campaign.recipient_count || 0}</TableCell>
                     <TableCell>
                       {campaign.last_run_at
                         ? format(new Date(campaign.last_run_at), "MMM d, yyyy HH:mm")
                         : "-"}
                     </TableCell>
                     <TableCell>
                       {campaign.next_run_at
                         ? format(new Date(campaign.next_run_at), "MMM d, yyyy HH:mm")
                         : "-"}
                     </TableCell>
                     <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                     <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-1">
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => toggleStatusMutation.mutate(campaign)}
                           title={campaign.status === "active" ? "Pause" : "Activate"}
                         >
                           {campaign.status === "active" ? (
                             <Pause className="h-4 w-4" />
                           ) : (
                             <Play className="h-4 w-4" />
                           )}
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleViewLogs(campaign)}>
                           <History className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                           <Pencil className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => setDeletingCampaign(campaign)}>
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
 
       <EmailCampaignModal
         open={isModalOpen}
         onClose={handleModalClose}
         editingCampaign={editingCampaign}
       />
 
       <EmailCampaignLogsModal
         open={isLogsModalOpen}
         onClose={() => {
           setIsLogsModalOpen(false);
           setSelectedCampaign(null);
         }}
         campaign={selectedCampaign}
       />
 
       <EmailTemplatesModal
         open={isTemplatesModalOpen}
         onClose={() => setIsTemplatesModalOpen(false)}
       />
 
       <AlertDialog open={!!deletingCampaign} onOpenChange={() => setDeletingCampaign(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{deletingCampaign?.name}"? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={() => deletingCampaign && deleteMutation.mutate(deletingCampaign.id)}>
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </AdminLayout>
   );
 };
 
 export default AdminEmailMarketing;