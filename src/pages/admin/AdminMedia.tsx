import { useState, useRef, useMemo } from "react";
import { useMediaFiles, useUploadMedia, useDeleteMedia, useRenameMedia, MediaFile } from "@/hooks/useMedia";
import { useAllMediaMetadata, useDeleteMediaMetadata } from "@/hooks/useMediaMetadata";
import { useMediaReferences, MediaReference } from "@/hooks/useMediaReferences";
import { getFileType, formatFileSize, copyFileUrl } from "@/services/media.service";
import MediaSeoEditor from "@/components/admin/MediaSeoEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Upload,
  Trash2,
  Copy,
  Search,
  Image,
  Film,
  FileText,
  File,
  Music,
  Pencil,
  Loader2,
  ExternalLink,
  Package,
  Tag,
  Monitor,
  Star,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  video: Film,
  audio: Music,
  pdf: FileText,
  file: File,
};

const BUCKET_LABELS: Record<string, string> = {
  media: "General Media",
  "product-images": "Product Images",
  "review-images": "Review Images",
  "profile-images": "Profile Images",
};

const REF_TYPE_ICONS: Record<string, React.ElementType> = {
  product: Package,
  variant: Layers,
  category: Tag,
  banner: Monitor,
  review: Star,
};

const INITIAL_LOAD = 18;
const LOAD_MORE_SIZE = 50;

const AdminMedia = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterBucket, setFilterBucket] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useMediaFiles();
  const { data: allMetadata = [] } = useAllMediaMetadata();
  const { data: referencesMap } = useMediaReferences();
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const deleteMetadataMutation = useDeleteMediaMetadata();
  const renameMutation = useRenameMedia();

  // Filter files based on search, type, and bucket (filters work across ALL files)
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
      const fileType = getFileType(file.mime_type, file.name);
      const matchesType = filterType === "all" || fileType === filterType;
      const matchesBucket = filterBucket === "all" || file.bucket_id === filterBucket;
      return matchesSearch && matchesType && matchesBucket;
    });
  }, [files, search, filterType, filterBucket]);

  // Reset visible count when filters change
  useMemo(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [search, filterType, filterBucket]);

  // Paginated slice for display
  const visibleFiles = useMemo(() => filteredFiles.slice(0, visibleCount), [filteredFiles, visibleCount]);
  const hasMore = visibleCount < filteredFiles.length;

  const buckets = useMemo(() => {
    return [...new Set(files.map((f) => f.bucket_id))];
  }, [files]);

  const getFileReferences = (file: MediaFile): MediaReference[] => {
    if (!referencesMap) return [];
    return referencesMap.get(file.public_url) || [];
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (const file of Array.from(selectedFiles)) {
      await uploadMutation.mutateAsync(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyUrl = async (url: string) => {
    await copyFileUrl(url);
    toast.success("URL copied to clipboard");
  };

  const handleRename = async () => {
    if (!selectedFile || !newFileName.trim()) return;

    const ext = selectedFile.name.split(".").pop();
    const finalName = newFileName.includes(".") ? newFileName : `${newFileName}.${ext}`;

    await renameMutation.mutateAsync({
      bucketId: selectedFile.bucket_id,
      oldName: selectedFile.name,
      newName: finalName,
    });

    setIsRenameOpen(false);
    setSelectedFile(null);
    setNewFileName("");
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      await deleteMutation.mutateAsync({
        bucketId: selectedFile.bucket_id,
        fileName: selectedFile.name,
      });

      // Also clean up any associated metadata
      deleteMetadataMutation.mutate({
        bucketId: selectedFile.bucket_id,
        filePath: selectedFile.name,
      });

      setIsDeleteOpen(false);
      setIsPreviewOpen(false);
      setSelectedFile(null);
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file. Check storage permissions.");
    }
  };

  const openRenameDialog = (file: MediaFile) => {
    setSelectedFile(file);
    const nameWithoutPath = file.name.includes("/") ? file.name.split("/").pop()! : file.name;
    setNewFileName(nameWithoutPath.split(".").slice(0, -1).join("."));
    setIsRenameOpen(true);
  };

  const openDeleteDialog = (file: MediaFile) => {
    setSelectedFile(file);
    setIsDeleteOpen(true);
  };

  const openPreview = (file: MediaFile) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  const renderFilePreview = (file: MediaFile, size: "sm" | "lg" = "sm") => {
    const fileType = getFileType(file.mime_type, file.name);
    const Icon = FILE_TYPE_ICONS[fileType] || File;
    const sizeClass = size === "sm" ? "w-full h-32" : "max-w-full max-h-[60vh]";

    if (fileType === "image") {
      return (
        <img
          src={file.public_url}
          alt={file.name}
          className={`${sizeClass} object-cover ${size === "sm" ? "rounded-t" : "rounded"}`}
        />
      );
    }

    if (fileType === "video") {
      return size === "lg" ? (
        <video src={file.public_url} controls className={sizeClass} />
      ) : (
        <div className={`${sizeClass} bg-muted flex items-center justify-center rounded-t`}>
          <Film className="h-12 w-12 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className={`${sizeClass} bg-muted flex items-center justify-center ${size === "sm" ? "rounded-t" : "rounded"}`}>
        <Icon className={size === "sm" ? "h-12 w-12 text-muted-foreground" : "h-24 w-24 text-muted-foreground"} />
      </div>
    );
  };

  const renderReferences = (refs: MediaReference[]) => {
    if (refs.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Used by:</p>
        {refs.map((ref, i) => {
          const Icon = REF_TYPE_ICONS[ref.type] || File;
          return (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
              <Badge variant="outline" className="text-xs capitalize py-0 h-5">
                {ref.type}
              </Badge>
              <span className="truncate text-muted-foreground">{ref.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your files and images
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Files
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="File type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="file">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBucket} onValueChange={setFilterBucket}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Bucket" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            {buckets.map((bucket) => (
              <SelectItem key={bucket} value={bucket}>
                {BUCKET_LABELS[bucket] || bucket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{filteredFiles.length} files</span>
        <span>•</span>
        <span>
          {formatFileSize(filteredFiles.reduce((sum, f) => sum + (f.size || 0), 0))} total
        </span>
      </div>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {files.length === 0 ? "No files uploaded yet" : "No files match your filters"}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visibleFiles.map((file) => {
              const fileType = getFileType(file.mime_type, file.name);
              const refs = getFileReferences(file);

              return (
                <Card
                  key={`${file.bucket_id}-${file.name}`}
                  className="group overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
                  onClick={() => openPreview(file)}
                >
                  <div className="relative">
                    {renderFilePreview(file, "sm")}
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 text-xs capitalize"
                    >
                      {fileType}
                    </Badge>
                    {refs.length > 0 && (
                      <Badge variant="default" className="absolute top-2 left-2 text-xs">
                        {refs.length} ref{refs.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name.includes("/") ? file.name.split("/").pop() : file.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{BUCKET_LABELS[file.bucket_id] || file.bucket_id}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(file.public_url);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(file);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(file);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_SIZE)}
              >
                Load More ({visibleFiles.length} of {filteredFiles.length})
              </Button>
            </div>
          )}

          {!hasMore && filteredFiles.length > INITIAL_LOAD && (
            <p className="text-center text-sm text-muted-foreground">
              Showing all {filteredFiles.length} files
            </p>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {selectedFile?.name.includes("/") ? selectedFile?.name.split("/").pop() : selectedFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            {selectedFile && renderFilePreview(selectedFile, "lg")}
          </div>
          {selectedFile && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Size:</span>{" "}
                  {formatFileSize(selectedFile.size)}
                </div>
                <div>
                  <span className="text-muted-foreground">Bucket:</span>{" "}
                  {BUCKET_LABELS[selectedFile.bucket_id] || selectedFile.bucket_id}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {selectedFile.mime_type || "Unknown"}
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {format(new Date(selectedFile.created_at), "MMM d, yyyy")}
                </div>
              </div>

              {/* File References */}
              {renderReferences(getFileReferences(selectedFile))}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(selectedFile.public_url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedFile.public_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRenameDialog(selectedFile)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(selectedFile)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              {/* SEO Metadata Editor */}
              <MediaSeoEditor
                bucketId={selectedFile.bucket_id}
                filePath={selectedFile.name}
                fileName={selectedFile.name.includes("/") ? selectedFile.name.split("/").pop()! : selectedFile.name}
                metadata={
                  allMetadata.find(
                    (m) => m.bucket_id === selectedFile.bucket_id && m.file_path === selectedFile.name
                  ) || null
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter new file name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={renameMutation.isPending}>
              {renameMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to delete "{selectedFile?.name}"? This action cannot be undone.</p>
                {selectedFile && getFileReferences(selectedFile).length > 0 && (
                  <div className="bg-muted p-3 rounded text-sm space-y-1 mt-2">
                    <p className="font-medium text-foreground">⚠️ This file is currently used by:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {getFileReferences(selectedFile).map((ref, i) => (
                        <li key={i}>{ref.type}: {ref.label}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-destructive mt-1">Deleting will break these references.</p>
                  </div>
                )}
              </div>
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

export default AdminMedia;
