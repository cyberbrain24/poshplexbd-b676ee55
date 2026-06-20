import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllMediaFiles,
  uploadMediaFile,
  deleteMediaFile,
  deleteMediaFiles,
  renameMediaFile,
  MediaFile,
} from "@/services/media.service";
import { toast } from "sonner";

const MEDIA_QUERY_KEY = ["admin-media"];

/**
 * Hook to fetch all media files across buckets
 */
export const useMediaFiles = () => {
  return useQuery({
    queryKey: MEDIA_QUERY_KEY,
    queryFn: fetchAllMediaFiles,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to upload a media file
 */
export const useUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMediaFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      toast.success("File uploaded successfully");
    },
    onError: (error: Error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    },
  });
};

/**
 * Hook to delete a media file
 */
export const useDeleteMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, fileName }: { bucketId: string; fileName: string }) =>
      deleteMediaFile(bucketId, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      toast.success("File deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    },
  });
};

export const useDeleteMediaFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, fileNames }: { bucketId: string; fileNames: string[] }) =>
      deleteMediaFiles(bucketId, fileNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      toast.success("Files deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete files");
    },
  });
};

/**
 * Hook to rename a media file
 */
export const useRenameMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bucketId,
      oldName,
      newName,
    }: {
      bucketId: string;
      oldName: string;
      newName: string;
    }) => renameMediaFile(bucketId, oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
      toast.success("File renamed successfully");
    },
    onError: (error: Error) => {
      console.error("Rename error:", error);
      toast.error("Failed to rename file");
    },
  });
};

export type { MediaFile };
