import { supabase } from "@/integrations/supabase/client";

export interface MediaFile {
  id: string;
  name: string;
  bucket_id: string;
  created_at: string;
  updated_at: string;
  size: number;
  mime_type: string | null;
  public_url: string;
}

export interface MediaBucket {
  id: string;
  name: string;
  public: boolean;
}

const SUPPORTED_BUCKETS = ["media", "product-images", "review-images", "profile-images"];

/**
 * Get file extension from filename
 */
const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

/**
 * Get mime type category for display
 */
export const getFileType = (mimeType: string | null, filename: string): string => {
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
  }
  
  const ext = getFileExtension(filename);
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"];
  const videoExts = ["mp4", "webm", "mov", "avi"];
  const audioExts = ["mp3", "wav", "ogg"];
  
  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  
  return "file";
};

/**
 * Fetch all files from a specific bucket
 */
export const fetchBucketFiles = async (bucketId: string): Promise<MediaFile[]> => {
  const { data: files, error } = await supabase.storage.from(bucketId).list("", {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) throw error;

  return (files || [])
    .filter((file) => file.name !== ".emptyFolderPlaceholder")
    .map((file) => {
      const { data: { publicUrl } } = supabase.storage
        .from(bucketId)
        .getPublicUrl(file.name);

      return {
        id: file.id || file.name,
        name: file.name,
        bucket_id: bucketId,
        created_at: file.created_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString(),
        size: file.metadata?.size || 0,
        mime_type: file.metadata?.mimetype || null,
        public_url: publicUrl,
      };
    });
};

/**
 * Fetch all files from all supported buckets
 */
export const fetchAllMediaFiles = async (): Promise<MediaFile[]> => {
  const allFiles: MediaFile[] = [];

  for (const bucketId of SUPPORTED_BUCKETS) {
    try {
      const files = await fetchBucketFiles(bucketId);
      allFiles.push(...files);
    } catch (error) {
      console.warn(`Failed to fetch files from bucket ${bucketId}:`, error);
    }
  }

  return allFiles.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Upload a file to the media bucket
 */
export const uploadMediaFile = async (file: File): Promise<MediaFile> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from("media")
    .getPublicUrl(fileName);

  return {
    id: fileName,
    name: fileName,
    bucket_id: "media",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    size: file.size,
    mime_type: file.type,
    public_url: publicUrl,
  };
};

/**
 * Delete a file from storage
 */
export const deleteMediaFile = async (bucketId: string, fileName: string): Promise<void> => {
  const { error } = await supabase.storage.from(bucketId).remove([fileName]);
  if (error) throw error;
};

/**
 * Rename/move a file (copy + delete)
 */
export const renameMediaFile = async (
  bucketId: string,
  oldName: string,
  newName: string
): Promise<void> => {
  const { error: moveError } = await supabase.storage
    .from(bucketId)
    .move(oldName, newName);

  if (moveError) throw moveError;
};

/**
 * Copy file URL to clipboard
 */
export const copyFileUrl = async (url: string): Promise<void> => {
  await navigator.clipboard.writeText(url);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
