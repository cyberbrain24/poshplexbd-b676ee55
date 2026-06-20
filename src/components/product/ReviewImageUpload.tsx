import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ReviewImageUpload = ({ images, onChange, maxImages = 3 }: ReviewImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    const files = fileList.slice(0, remaining);
    if (fileList.length > remaining) {
      toast.error(`Only ${remaining} more image(s) allowed`);
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to upload images");
        return;
      }

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB`);
          continue;
        }

        const { toWebpUnder250 } = await import("@/lib/imageToWebp");
        let webpFile: File;
        try {
          webpFile = await toWebpUnder250(file);
        } catch {
          toast.error(`${file.name} could not be processed`);
          continue;
        }

        const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("review-images")
          .upload(fileName, webpFile, { contentType: "image/webp" });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("review-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    uploadFiles(Array.from(files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) {
      toast.error("Please drop image files only");
      return;
    }
    uploadFiles(files);
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const reachedMax = images.length >= maxImages;

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Review image ${index + 1}`}
                className="w-20 h-20 object-cover rounded border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {reachedMax ? (
        <p className="text-xs text-muted-foreground">
          Maximum {maxImages} photos reached. Remove one to upload another.
        </p>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isUploading) setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isUploading) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isUploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center gap-2 w-full min-h-28 px-4 py-6 border-2 border-dashed rounded-md cursor-pointer transition-colors text-center ${
            isDragging
              ? "border-foreground bg-muted"
              : "border-border hover:border-foreground/50 hover:bg-muted/40"
          } ${isUploading ? "opacity-70 cursor-wait" : ""}`}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading…</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">
                Click to upload <span className="text-muted-foreground font-normal">or drag and drop</span>
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB · max {maxImages} images
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInput}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewImageUpload;
