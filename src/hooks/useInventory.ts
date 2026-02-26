import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInventoryEntries,
  createInventoryEntry,
  updateInventoryEntry,
  deleteInventoryEntry,
  fetchInventoryProducts,
  createInventoryProduct,
  updateInventoryProduct,
  deleteInventoryProduct,
  InventoryItemInput,
  InventoryProductInput,
} from "@/services/inventory.service";
import { toast } from "sonner";

/* ─── Inventory Products ─── */

export const useInventoryProducts = () => {
  return useQuery({
    queryKey: ["inventory-products"],
    queryFn: fetchInventoryProducts,
  });
};

export const useCreateInventoryProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InventoryProductInput) => createInventoryProduct(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      toast.success("Inventory product created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateInventoryProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InventoryProductInput }) => updateInventoryProduct(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      toast.success("Inventory product updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteInventoryProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInventoryProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      toast.success("Inventory product deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/* ─── Inventory Entries ─── */

export const useInventoryEntries = (type: "in" | "out") => {
  return useQuery({
    queryKey: ["inventory-entries", type],
    queryFn: () => fetchInventoryEntries(type),
  });
};

export const useCreateInventoryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entry, items }: {
      entry: { type: "in" | "out"; date: string; notes?: string; account_id?: string | null; category_id?: string | null; subcategory_id?: string | null };
      items: InventoryItemInput[];
    }) => createInventoryEntry(entry, items),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inventory-entries", vars.entry.type] });
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success(`Inventory ${vars.entry.type} recorded`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateInventoryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entry, items }: {
      id: string;
      entry: { date: string; notes?: string; account_id?: string | null; category_id?: string | null; subcategory_id?: string | null };
      items: InventoryItemInput[];
    }) => updateInventoryEntry(id, entry, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-entries"] });
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Inventory entry updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteInventoryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInventoryEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-entries"] });
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Inventory entry deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
