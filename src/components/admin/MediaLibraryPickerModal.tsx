import { useState, useEffect, useMemo } from "react";
import { X, Search, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAllMediaFiles, MediaFile, getFileType } from "@/services/media.service";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const MediaLibraryPickerModal = ({ isOpen, onClose, onSelect }: MediaLibraryPickerModalProps) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedUrl(null);
      setSearch("");
      fetchAllMediaFiles()
        .then(setFiles)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const imageFiles = useMemo(() => {
    const images = files.filter((f) => getFileType(f.mime_type, f.name) === "image");
    if (!search.trim()) return images;
    const q = search.toLowerCase();
    return images.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, search]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-3xl max-h-[80vh] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium">Select Image from Media Library</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : imageFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No images found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {imageFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedUrl(file.public_url)}
                  className={`aspect-square overflow-hidden border-2 transition-all ${
                    selectedUrl === file.public_url
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <img
                    src={file.public_url}
                    alt={file.name.split("/").pop() || ""}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selectedUrl ? "1 image selected" : `${imageFiles.length} images available`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedUrl}>
              Select Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaLibraryPickerModal;
