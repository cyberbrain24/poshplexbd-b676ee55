import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBlogPosts, useDeleteBlogPost, useSetBlogPostStatus } from "@/hooks/useBlog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Eye, Plus, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function AdminBlogPosts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published" | "scheduled">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useBlogPosts({ search, status, limit: 100 });
  const deleteMut = useDeleteBlogPost();
  const statusMut = useSetBlogPostStatus();

  const posts = data?.posts || [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Blog Posts</h1>
          <p className="text-sm text-muted-foreground">Manage SEO-optimized blog articles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/blog/categories")}>Categories</Button>
          <Button onClick={() => navigate("/admin/blog/new")}><Plus className="h-4 w-4 mr-1" /> New Post</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Loading...</TableCell></TableRow>
            ) : posts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">No posts yet. Create one or use the AI Assistant.</TableCell></TableRow>
            ) : posts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <div className="flex items-start gap-2">
                    {p.cover_image_url && <img src={p.cover_image_url} alt="" className="w-10 h-10 object-cover rounded" />}
                    <div className="min-w-0">
                      <div className="truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={p.status === "published" ? "default" : p.status === "draft" ? "secondary" : "outline"}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {p.published_at ? format(new Date(p.published_at), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right text-sm">{p.view_count}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {p.status === "published" && (
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" title="View live"><ExternalLink className="h-4 w-4" /></Button>
                      </a>
                    )}
                    {p.status !== "published" && (
                      <Button variant="ghost" size="sm" onClick={() => statusMut.mutate({ id: p.id, status: "published" })}>
                        Publish
                      </Button>
                    )}
                    {p.status === "published" && (
                      <Button variant="ghost" size="sm" onClick={() => statusMut.mutate({ id: p.id, status: "draft" })}>
                        Unpublish
                      </Button>
                    )}
                    <Link to={`/admin/blog/edit/${p.id}`}>
                      <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
