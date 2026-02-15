import { useState, useRef, useMemo } from "react";
import { useMediaFiles, useUploadMedia, useDeleteMedia, useRenameMedia, MediaFile } from "@/hooks/useMedia";
import { getFileType, formatFileSize, copyFileUrl } from "@/services/media.service";
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
  X,
  Loader2,
  ExternalLink,
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

const AdminMedia = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterBucket, setFilterBucket] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useMediaFiles();
  const uploadMutation = useUploadMedia();
  const deleteMutation = useDeleteMedia();
  const renameMutation = useRenameMedia();

  // Filter files based on search, type, and bucket
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
      const fileType = getFileType(file.mime_type, file.name);
      const matchesType = filterType === "all" || fileType === filterType;
      const matchesBucket = filterBucket === "all" || file.bucket_id === filterBucket;
      return matchesSearch && matchesType && matchesBucket;
    });
  }, [files, search, filterType, filterBucket]);

  // Get unique buckets from files
  const buckets = useMemo(() => {
    const uniqueBuckets = [...new Set(files.map((f) => f.bucket_id))];
    return uniqueBuckets;
  }, [files]);

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

    await deleteMutation.mutateAsync({
      bucketId: selectedFile.bucket_id,
      fileName: selectedFile.name,
    });

    setIsDeleteOpen(false);
    setSelectedFile(null);
  };

  const openRenameDialog = (file: MediaFile) => {
    setSelectedFile(file);
    setNewFileName(file.name.split(".").slice(0, -1).join("."));
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map((file) => {
            const fileType = getFileType(file.mime_type, file.name);
            const canEdit = file.bucket_id === "media";

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
                    {canEdit && (
                      <>
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
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{selectedFile?.name}</DialogTitle>
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
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyUrl(selectedFile.public_url)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={selectedFile.public_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
              </div>
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
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedFile?.name}"? This action cannot be undone.
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
