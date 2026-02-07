import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { usePages, usePageMutations, Page } from "@/hooks/usePages";
import PageModal from "@/components/admin/PageModal";
import { Plus, Search, FileText, Edit, Trash2, ExternalLink, Shield, File } from "lucide-react";
import { format } from "date-fns";

const AdminPages = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Page | null>(null);

  const { data: pages, isLoading } = usePages(search);
  const { deletePage } = usePageMutations();

  const handleEdit = (page: Page) => {
    setSelectedPage(page);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPage(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    try {
      await deletePage.mutateAsync(deleteDialog.id);
      toast({
        title: "Page Deleted",
        description: `"${deleteDialog.title}" has been deleted`,
      });
      setDeleteDialog(null);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string, isProtected: boolean) => {
    if (isProtected) {
      return (
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          Protected
        </Badge>
      );
    }
    if (type === "system") {
      return <Badge variant="outline">System</Badge>;
    }
    return (
      <Badge variant="outline" className="gap-1">
        <File className="h-3 w-3" />
        Custom
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Page Manager
            </h1>
            <p className="text-muted-foreground">
              Create and manage dynamic pages for your site
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Page
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pages Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading pages...
                    </div>
                  </TableCell>
                </TableRow>
              ) : pages?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <p>No pages found</p>
                      <Button variant="outline" size="sm" onClick={handleCreate}>
                        Create your first page
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pages?.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="font-medium">{page.title}</div>
                      {page.excerpt && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {page.excerpt}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        /{page.slug}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(page.status)}</TableCell>
                    <TableCell>{getTypeBadge(page.page_type, page.is_protected)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(page.updated_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {page.status === "published" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="View page"
                          >
                            <a
                              href={`/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(page)}
                          title="Edit page"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!page.is_protected && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog(page)}
                            title="Delete page"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        {pages && pages.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{pages.length} total pages</span>
            <span>•</span>
            <span>
              {pages.filter((p) => p.status === "published").length} published
            </span>
            <span>•</span>
            <span>
              {pages.filter((p) => p.status === "draft").length} drafts
            </span>
          </div>
        )}
      </div>

      {/* Page Modal */}
      <PageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        page={selectedPage}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPages;
