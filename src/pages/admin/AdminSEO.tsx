import { useState } from "react";
import { Search, Plus, Globe, FileText, Package, FolderOpen, Settings, ExternalLink, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useSEOPaths, useSEOMutations, SEOMetadata } from "@/hooks/useSEO";
import SEOPathModal from "@/components/admin/SEOPathModal";
import { toast } from "sonner";
import { useDebounce } from "@/utils/performance";

const AdminSEO = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSEO, setSelectedSEO] = useState<SEOMetadata | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 300);
  const { data: seoPaths, isLoading } = useSEOPaths(debouncedSearch);
  const { deleteSEO } = useSEOMutations();

  const handleEdit = (seo: SEOMetadata) => {
    setSelectedSEO(seo);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSEO(null);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSEO.mutateAsync(deleteId);
      toast.success("SEO entry deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete SEO entry");
    }
  };

  const getEntityIcon = (entityType: string | null) => {
    switch (entityType) {
      case "product":
        return <Package className="h-4 w-4" />;
      case "blog":
        return <FileText className="h-4 w-4" />;
      case "category":
        return <FolderOpen className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getEntityBadge = (entityType: string | null, isDynamic: boolean) => {
    if (entityType === "product") return <Badge variant="secondary">Product</Badge>;
    if (entityType === "blog") return <Badge variant="secondary">Blog</Badge>;
    if (entityType === "category") return <Badge variant="secondary">Category</Badge>;
    if (!isDynamic) return <Badge variant="outline">Static</Badge>;
    return <Badge variant="outline">Custom</Badge>;
  };

  const getSEOScore = (seo: SEOMetadata) => {
    let score = 0;
    if (seo.meta_title) score += 30;
    if (seo.meta_description) score += 30;
    if (seo.focus_keywords && seo.focus_keywords.length > 0) score += 20;
    if (seo.og_image) score += 20;
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            SEO Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage SEO metadata for all pages across your site
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Path
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{seoPaths?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total Paths</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {seoPaths?.filter(s => s.entity_type === "product").length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Products</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {seoPaths?.filter(s => s.entity_type === "blog").length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Blog Posts</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {seoPaths?.filter(s => getSEOScore(s) >= 80).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Optimized</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search paths or titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Path</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Meta Title</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : seoPaths?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No SEO paths found
                </TableCell>
              </TableRow>
            ) : (
              seoPaths?.map((seo) => {
                const score = getSEOScore(seo);
                return (
                  <TableRow key={seo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEntityIcon(seo.entity_type)}
                        <span className="font-mono text-sm">{seo.page_path}</span>
                        {seo.no_index && (
                          <Badge variant="destructive" className="text-xs">noindex</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEntityBadge(seo.entity_type, seo.is_dynamic)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {seo.meta_title || (
                        <span className="text-muted-foreground italic">Auto-generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{seo.priority || 0.5}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(seo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a
                            href={`https://poshplexbd.lovable.app${seo.page_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        {!seo.is_dynamic && !seo.entity_type && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(seo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Modal */}
      <SEOPathModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        seoData={selectedSEO}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SEO Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the custom SEO settings for this path. The page will fall back to auto-generated SEO.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSEO;
