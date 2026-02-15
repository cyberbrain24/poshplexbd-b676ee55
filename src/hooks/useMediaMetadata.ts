import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllMediaMetadata,
  upsertMediaMetadata,
  deleteMediaMetadata,
  MediaMetadataUpsert,
} from "@/services/media-metadata.service";
import { toast } from "sonner";

const METADATA_QUERY_KEY = ["admin-media-metadata"];

export const useAllMediaMetadata = () => {
  return useQuery({
    queryKey: METADATA_QUERY_KEY,
    queryFn: fetchAllMediaMetadata,
    staleTime: 1000 * 60 * 2,
  });
};

export const useUpsertMediaMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertMediaMetadata,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: METADATA_QUERY_KEY });
      toast.success("SEO metadata saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save metadata");
    },
  });
};

export const useDeleteMediaMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bucketId, filePath }: { bucketId: string; filePath: string }) =>
      deleteMediaMetadata(bucketId, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: METADATA_QUERY_KEY });
    },
  });
};
