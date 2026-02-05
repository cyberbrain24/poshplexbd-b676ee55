import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { format } from "date-fns";
import { CheckCheck, Check, Clock, XCircle } from "lucide-react";

interface WhatsappCampaignLogsModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string | null;
}

const WhatsappCampaignLogsModal = ({ open, onClose, campaignId }: WhatsappCampaignLogsModalProps) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["whatsapp-campaign-logs", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("whatsapp_campaign_logs")
        .select(`
          *,
          customers (name, phone)
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  // Calculate stats
  const stats = {
    total: logs?.length || 0,
    sent: logs?.filter((l) => l.status !== "pending" && l.status !== "failed").length || 0,
    delivered: logs?.filter((l) => l.status === "delivered" || l.status === "read").length || 0,
    read: logs?.filter((l) => l.status === "read").length || 0,
    failed: logs?.filter((l) => l.status === "failed").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "read":
        return (
          <Badge className="bg-blue-500 gap-1">
            <CheckCheck className="h-3 w-3" />
            Read
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-green-500 gap-1">
            <Check className="h-3 w-3" />
            Delivered
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="secondary" className="gap-1">
            <Check className="h-3 w-3" />
            Sent
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Delivery Logs</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.sent}</div>
            <div className="text-xs text-muted-foreground">Sent</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-xs text-muted-foreground">Delivered</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.read}</div>
            <div className="text-xs text-muted-foreground">Read</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Read At</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.customers?.name || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                    <TableCell>{log.template_name || "-"}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      {log.sent_at ? format(new Date(log.sent_at), "MMM d, HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      {log.read_at ? format(new Date(log.read_at), "MMM d, HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      {log.error_code && (
                        <span className="text-xs text-red-600">
                          {log.error_code}: {log.error_message?.slice(0, 30)}
                        </span>
                      )}
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

export default WhatsappCampaignLogsModal;
