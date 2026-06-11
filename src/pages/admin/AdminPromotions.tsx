import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, MousePointerClick, Megaphone } from "lucide-react";
import { toast } from "sonner";
import PromotionModal from "@/components/admin/PromotionModal";
import { format } from "date-fns";

const AdminPromotions = () => {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions" as any)
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("promotions" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      qc.invalidateQueries({ queryKey: ["promotions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promotion deleted");
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      qc.invalidateQueries({ queryKey: ["promotions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6" /> Promotions & Ads</h1>
          <p className="text-sm text-muted-foreground">Manage banners, popups and floating ads shown across the storefront.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New Promotion</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Promotions ({promotions.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : promotions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No promotions yet. Create your first ad to display it on the storefront.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Placements</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center"><Megaphone className="w-4 h-4 text-muted-foreground" /></div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{p.title}</p>
                      {p.subtitle && <p className="text-xs text-muted-foreground">{p.subtitle}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(p.placements ?? []).map((pl: string) => (
                          <Badge key={pl} variant="secondary" className="text-[10px]">{pl}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{p.action_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.starts_at ? format(new Date(p.starts_at), "MMM d") : "—"} → {p.ends_at ? format(new Date(p.ends_at), "MMM d") : "∞"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2"><Eye className="w-3 h-3" />{p.views}</div>
                      <div className="flex items-center gap-2"><MousePointerClick className="w-3 h-3" />{p.clicks}</div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: p.id, is_active: v })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PromotionModal open={modalOpen} onOpenChange={setModalOpen} promotion={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this promotion?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && removeOne.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPromotions;
