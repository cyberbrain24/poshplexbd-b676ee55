import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSharedVariants,
  createSharedVariant,
  updateSharedVariant,
  deleteSharedVariant,
} from "@/services/shared-variant.service";
import { toast } from "sonner";

export const useSharedVariants = () => {
  return useQuery({
    queryKey: ["shared-variants"],
    queryFn: fetchSharedVariants,
  });
};

export const useCreateSharedVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSharedVariant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-variants"] });
      toast.success("Shared variant created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateSharedVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Parameters<typeof updateSharedVariant>[1] & { id: string }) =>
      updateSharedVariant(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-variants"] });
      toast.success("Shared variant updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteSharedVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSharedVariant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-variants"] });
      toast.success("Shared variant deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
