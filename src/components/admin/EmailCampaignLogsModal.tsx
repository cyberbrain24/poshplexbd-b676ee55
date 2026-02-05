 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery } from "@tanstack/react-query";
 import { format } from "date-fns";
 
 interface EmailCampaign {
   id: string;
   name: string;
 }
 
 interface EmailCampaignLogsModalProps {
   open: boolean;
   onClose: () => void;
   campaign: EmailCampaign | null;
 }
 
 interface EmailLog {
   id: string;
   email: string;
   subject: string;
   status: string;
   sent_at: string | null;
   created_at: string;
   customer_id: string | null;
   customers?: { name: string } | null;
 }
 
 const EmailCampaignLogsModal = ({ open, onClose, campaign }: EmailCampaignLogsModalProps) => {
   const { data: logs = [], isLoading } = useQuery({
     queryKey: ["email-campaign-logs", campaign?.id],
     queryFn: async () => {
       if (!campaign?.id) return [];
       const { data, error } = await supabase
         .from("email_campaign_logs")
         .select("*, customers(name)")
         .eq("campaign_id", campaign.id)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as EmailLog[];
     },
     enabled: !!campaign?.id,
   });
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case "sent":
        return <Badge className="bg-primary">Sent</Badge>;
       case "failed":
         return <Badge variant="destructive">Failed</Badge>;
       case "pending":
         return <Badge variant="secondary">Pending</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Campaign Logs: {campaign?.name}</DialogTitle>
         </DialogHeader>
 
         <div className="border rounded-lg">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Customer</TableHead>
                 <TableHead>Email</TableHead>
                 <TableHead>Subject</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Sent At</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isLoading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                     Loading...
                   </TableCell>
                 </TableRow>
               ) : logs.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                     No logs yet for this campaign.
                   </TableCell>
                 </TableRow>
               ) : (
                 logs.map((log) => (
                   <TableRow key={log.id}>
                     <TableCell>{log.customers?.name || "-"}</TableCell>
                     <TableCell className="max-w-[200px] truncate">{log.email}</TableCell>
                     <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                     <TableCell>{getStatusBadge(log.status)}</TableCell>
                     <TableCell>
                       {log.sent_at
                         ? format(new Date(log.sent_at), "MMM d, yyyy HH:mm")
                         : "-"}
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default EmailCampaignLogsModal;