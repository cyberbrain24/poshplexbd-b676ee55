import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInvProducts,
  createInvProduct,
  updateInvProduct,
  deleteInvProduct,
  bulkStockMovement,
  fetchStockReport,
  InvProductInput,
  StockMovement,
} from "@/services/independent-inventory.service";
import { toast } from "sonner";

export const useInvProducts = (categoryId?: string, subcategoryId?: string) =>
  useQuery({
    queryKey: ["inv-products", categoryId || "", subcategoryId || ""],
    queryFn: () => fetchInvProducts(categoryId, subcategoryId),
  });

export const useCreateInvProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InvProductInput) => createInvProduct(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inv-products"] });
      toast.success("Product added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateInvProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<InvProductInput> }) =>
      updateInvProduct(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inv-products"] });
      toast.success("Product updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteInvProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInvProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inv-products"] });
      toast.success("Product removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useBulkStockMovement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      type, items, date, notes,
    }: {
      type: "in" | "out";
      items: StockMovement[];
      date: string;
      notes?: string;
    }) => bulkStockMovement(type, items, date, notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inv-products"] });
      toast.success(`Stock ${vars.type === "in" ? "added" : "removed"} successfully`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useStockReport = (from: string, to: string, enabled = true) =>
  useQuery({
    queryKey: ["inv-stock-report", from, to],
    queryFn: () => fetchStockReport(from, to),
    enabled,
  });
