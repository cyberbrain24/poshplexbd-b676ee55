import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useMediaFiles, useDeleteMediaFiles } from "@/hooks/useMedia";
import {
  useAllMediaMetadata,
  useDeleteMediaMetadata,
} from "@/hooks/useMediaMetadata";
import { useMediaReferences } from "@/hooks/useMediaReferences";
import {
  getFileType,
  formatFileSize,
  copyFileUrl,
  type MediaFile,
} from "@/services/media.service";
import { resolveMainImage, isDerivedThumbnail, getDerivativeImagesForMain } from "@/lib/mediaThumbResolve";
import MediaSeoEditor from "@/components/admin/MediaSeoEditor";

const BUCKET_LABELS: Record<string, string> = {
  media: "General Media",
  "product-images": "Product Images",
  "review-images": "Review Images",
  "profile-images": "Profile Images",
};

const INITIAL = 60;
const PAGE = 60;

const MediaThumbnailsGallery = () => {
  const { data: files = [], isLoading } = useMediaFiles();
  const { data: allMetadata = [] } = useAllMediaMetadata();
  const { data: referencesMap } = useMediaReferences();
  const deleteMutation = useDeleteMediaFiles();
  const deleteMetaMutation = useDeleteMediaMetadata();

  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<string>("all");
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaFile | null>(null);
  const [visible, setVisible] = useState(INITIAL);

  // Image-only across all buckets
  const imageFiles = useMemo(
    () => files.filter((f) => getFileType(f.mime_type, f.name) === "image"),
    [files],
  );

  const buckets = useMemo(
    () => [...new Set(imageFiles.map((f) => f.bucket_id))],
    [imageFiles],
  );

  const filtered = useMemo(() => {
    return imageFiles.filter((f) => {
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
      const matchBucket = bucket === "all" || f.bucket_id === bucket;
      return matchSearch && matchBucket;
    });
  }, [imageFiles, search, bucket]);

  // Reset pagination on filter change
  useMemo(() => setVisible(INITIAL), [search, bucket]);

  const visibleFiles = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // Resolve the "main image" for the selected file (used for SEO sync)
  const main = selected ? resolveMainImage(selected, files) : null;
  const mainMetadata = main
    ? allMetadata.find(
        (m) => m.bucket_id === main.bucket_id && m.file_path === main.name,
      ) ?? null
    : null;

  const refs = selected ? referencesMap?.get(selected.public_url) ?? [] : [];

  const handleCopy = async (url: string) => {
    await copyFileUrl(url);
    toast.success("URL copied");
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const confirmMain = resolveMainImage(confirmDelete, files);
    if (isDerivedThumbnail(confirmDelete) && confirmMain.name !== confirmDelete.name) {
      toast.error("You can't delete the thumbnail image because the main image is stored in the system.");
      setConfirmDelete(null);
      return;
    }

    try {
      const derivatives = getDerivativeImagesForMain(confirmDelete, files);
      const fileNames = [confirmDelete.name, ...derivatives.map((f) => f.name)];
      await deleteMutation.mutateAsync({
        bucketId: confirmDelete.bucket_id,
        fileNames,
      });
      fileNames.forEach((filePath) => deleteMetaMutation.mutate({
        bucketId: confirmDelete.bucket_id,
        filePath,
      }));
      if (selected && fileNames.includes(selected.name)) setSelected(null);
      setConfirmDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete file");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={bucket} onValueChange={setBucket}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Bucket" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            {buckets.map((b) => (
              <SelectItem key={b} value={b}>
                {BUCKET_LABELS[b] || b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-sm text-muted-foreground">
        <span>{filtered.length} images</span>
        <span>•</span>
        <span>
          {formatFileSize(filtered.reduce((s, f) => s + (f.size || 0), 0))} total
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No images match your filters
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {visibleFiles.map((file) => {
              const derived = isDerivedThumbnail(file);
              return (
                <button
                  key={`${file.bucket_id}-${file.name}`}
                  type="button"
                  onClick={() => setSelected(file)}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-border hover:ring-2 hover:ring-primary/40 transition"
                  title={file.name}
                >
                  <img
                    src={file.public_url}
                    alt={file.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {derived && (
                    <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0">
                      thumb
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>
                Load More ({visibleFiles.length} of {filtered.length})
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview / Edit dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {selected?.name.split("/").pop()}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex items-center justify-center bg-muted rounded-xl p-2">
                <img
                  src={selected.public_url}
                  alt={selected.name}
                  className="max-h-[60vh] max-w-full object-contain rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Bucket:</span>{" "}
                  {BUCKET_LABELS[selected.bucket_id] || selected.bucket_id}
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>{" "}
                  {formatFileSize(selected.size)}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Path:</span>{" "}
                  <span className="break-all">{selected.name}</span>
                </div>
                {main && main.name !== selected.name && (
                  <div className="col-span-2 text-xs text-muted-foreground">
                    SEO meta will sync to main image:{" "}
                    <span className="break-all">{main.name}</span>
                  </div>
                )}
                {refs.length > 0 && (
                  <div className="col-span-2">
                    <Badge variant="outline">
                      Used in {refs.length} place{refs.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(selected.public_url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={selected.public_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDelete(selected)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              {/* SEO editor — keyed to the main image so edits sync */}
              {main && (
                <MediaSeoEditor
                  bucketId={main.bucket_id}
                  filePath={main.name}
                  fileName={main.name.split("/").pop() || main.name}
                  metadata={mainMetadata}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && referencesMap?.get(confirmDelete.public_url)?.length
                ? `This image is used in ${
                    referencesMap.get(confirmDelete.public_url)!.length
                  } place(s). Deleting will break those references.`
                : "This action cannot be undone. The file will be removed from storage."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MediaThumbnailsGallery;
