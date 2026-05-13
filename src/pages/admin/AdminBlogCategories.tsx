import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useBlogCategories, useCreateBlogCategory, useUpdateBlogCategory, useDeleteBlogCategory,
} from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { BlogCategory } from "@/types/blog";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AdminBlogCategories() {
  const { data: categories, isLoading } = useBlogCategories();
  const createMut = useCreateBlogCategory();
  const updateMut = useUpdateBlogCategory();
  const deleteMut = useDeleteBlogCategory();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sort_order: 0, is_active: true });

  const openNew = () => { setEditing(null); setForm({ name: "", slug: "", description: "", sort_order: 0, is_active: true }); setOpen(true); };
  const openEdit = (c: BlogCategory) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || "", sort_order: c.sort_order, is_active: c.is_active });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    try {
      if (editing) await updateMut.mutateAsync({ id: editing.id, patch: payload });
      else await createMut.mutateAsync(payload);
      setOpen(false);
    } catch {}
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
      <Link to="/admin/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to posts
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Blog Categories</h1>
          <p className="text-sm text-muted-foreground">Organize posts under categories</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> New</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : (categories || []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No categories yet.</TableCell></TableRow>
            ) : (categories || []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">/{c.slug}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell>{c.is_active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>Posts will not be deleted, but their link to this category will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
