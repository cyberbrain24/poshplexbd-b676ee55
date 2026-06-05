import { useState } from "react";
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useProductAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
} from "@/hooks/useProductAttributes";
import type { ProductAttribute, ProductAttributeValue } from "@/types/productAttributes";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminProductAttributes = () => {
  const { data: attributes = [], isLoading } = useProductAttributes();
  const createAttr = useCreateAttribute();
  const updateAttr = useUpdateAttribute();
  const deleteAttr = useDeleteAttribute();
  const createVal = useCreateAttributeValue();
  const updateVal = useUpdateAttributeValue();
  const deleteVal = useDeleteAttributeValue();

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newAttrName, setNewAttrName] = useState("");
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [editingAttrName, setEditingAttrName] = useState("");
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  const [editingValue, setEditingValue] = useState<{ id: string; value: string } | null>(null);
  const [deleteAttrTarget, setDeleteAttrTarget] = useState<ProductAttribute | null>(null);

  const filtered = attributes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateAttr = async () => {
    const name = newAttrName.trim();
    if (!name) return;
    try {
      const created = await createAttr.mutateAsync({ name, sort_order: attributes.length });
      setNewAttrName("");
      setExpanded((e) => ({ ...e, [created.id]: true }));
      toast.success("Attribute created");
    } catch (e: any) {
      toast.error(e?.message?.includes("duplicate") ? "Name already exists" : "Failed to create");
    }
  };

  const handleSaveAttr = async (id: string) => {
    const name = editingAttrName.trim();
    if (!name) return;
    try {
      await updateAttr.mutateAsync({ id, data: { name } });
      setEditingAttrId(null);
      toast.success("Attribute updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDeleteAttr = async () => {
    if (!deleteAttrTarget) return;
    try {
      await deleteAttr.mutateAsync(deleteAttrTarget.id);
      toast.success("Attribute deleted");
      setDeleteAttrTarget(null);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddValue = async (attrId: string) => {
    const val = (newValueInputs[attrId] || "").trim();
    if (!val) return;
    try {
      const attr = attributes.find((a) => a.id === attrId);
      const nextSort = (attr?.values?.length || 0);
      await createVal.mutateAsync({ attribute_id: attrId, value: val, sort_order: nextSort });
      setNewValueInputs((s) => ({ ...s, [attrId]: "" }));
    } catch (e: any) {
      toast.error(e?.message?.includes("duplicate") ? "Value already exists" : "Failed to add");
    }
  };

  const handleSaveValue = async () => {
    if (!editingValue) return;
    const v = editingValue.value.trim();
    if (!v) return;
    try {
      await updateVal.mutateAsync({ id: editingValue.id, data: { value: v } });
      setEditingValue(null);
    } catch {
      toast.error("Failed to update value");
    }
  };

  const handleDeleteValue = async (id: string) => {
    try {
      await deleteVal.mutateAsync(id);
    } catch {
      toast.error("Failed to delete value");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Product Attributes</h1>
          <p className="text-muted-foreground mt-1">
            Create reusable attributes (e.g. Style, Edition, Pack) and map multiple values to each
          </p>
        </div>
      </div>

      {/* Create new attribute */}
      <div className="border border-border p-4 space-y-3">
        <h3 className="text-sm font-medium">Add New Attribute</h3>
        <div className="flex gap-2">
          <Input
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            placeholder="Attribute name (e.g. Style, Edition, Pack)"
            onKeyDown={(e) => e.key === "Enter" && handleCreateAttr()}
          />
          <Button onClick={handleCreateAttr} disabled={!newAttrName.trim() || createAttr.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search attributes..."
          className="pl-10"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border">
            No attributes yet. Add one above to get started.
          </div>
        ) : (
          filtered.map((attr) => {
            const isOpen = expanded[attr.id] ?? false;
            const isEditing = editingAttrId === attr.id;
            return (
              <div key={attr.id} className="border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-3 bg-muted/30">
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [attr.id]: !isOpen }))}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {isEditing ? (
                      <Input
                        value={editingAttrName}
                        onChange={(e) => setEditingAttrName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveAttr(attr.id);
                          if (e.key === "Escape") setEditingAttrId(null);
                        }}
                        className="h-8 max-w-xs"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{attr.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ({attr.values?.length || 0} value{(attr.values?.length || 0) !== 1 ? "s" : ""})
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleSaveAttr(attr.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAttrId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingAttrId(attr.id); setEditingAttrName(attr.name); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteAttrTarget(attr)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Values */}
                {isOpen && (
                  <div className="p-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(attr.values || []).map((v) => (
                        <div key={v.id} className="inline-flex items-center gap-1 border border-border rounded-md px-2 py-1 text-sm bg-background">
                          {editingValue?.id === v.id ? (
                            <>
                              <Input
                                value={editingValue.value}
                                onChange={(e) => setEditingValue({ id: v.id, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveValue();
                                  if (e.key === "Escape") setEditingValue(null);
                                }}
                                className="h-6 w-32 text-xs"
                                autoFocus
                              />
                              <button onClick={handleSaveValue} className="text-xs text-primary px-1">Save</button>
                            </>
                          ) : (
                            <>
                              <span>{v.value}</span>
                              <button onClick={() => setEditingValue({ id: v.id, value: v.value })} className="text-muted-foreground hover:text-foreground">
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDeleteValue(v.id)} className="text-muted-foreground hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                      {(attr.values || []).length === 0 && (
                        <span className="text-xs text-muted-foreground">No values yet</span>
                      )}
                    </div>

                    {/* Add value */}
                    <div className="flex gap-2 max-w-md">
                      <Input
                        value={newValueInputs[attr.id] || ""}
                        onChange={(e) => setNewValueInputs((s) => ({ ...s, [attr.id]: e.target.value }))}
                        placeholder="Add value (e.g. Design 1, Combo 2)"
                        onKeyDown={(e) => e.key === "Enter" && handleAddValue(attr.id)}
                        className="h-8 text-sm"
                      />
                      <Button size="sm" variant="outline" onClick={() => handleAddValue(attr.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteAttrTarget} onOpenChange={() => setDeleteAttrTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteAttrTarget?.name}" and all its values? This will also remove it from any products it's applied to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAttr}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProductAttributes;
