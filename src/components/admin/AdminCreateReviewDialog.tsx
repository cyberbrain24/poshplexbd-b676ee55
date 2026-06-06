import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Plus, Loader2, X, Search } from "lucide-react";
import { toast } from "sonner";
import ReviewImageUpload from "@/components/product/ReviewImageUpload";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  image?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

const useDebounced = <T,>(value: T, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const AdminCreateReviewDialog = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Product picker (multi-select)
  const [productSearch, setProductSearch] = useState("");
  const debouncedProduct = useDebounced(productSearch, 300);
  const [productResults, setProductResults] = useState<ProductOption[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);

  // Customer picker (optional)
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomer = useDebounced(customerSearch, 300);
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  // Review fields
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [approved, setApproved] = useState(true);
  const [customDate, setCustomDate] = useState("");

  const resetForm = () => {
    setProductSearch("");
    setProductResults([]);
    setSelectedProducts([]);
    setCustomerSearch("");
    setCustomerResults([]);
    setSelectedCustomer(null);
    setReviewerName("");
    setRating(5);
    setTitle("");
    setContent("");
    setImages([]);
    setApproved(true);
    setCustomDate("");
  };

  // Product search
  useEffect(() => {
    if (!debouncedProduct || selectedProduct) {
      setProductResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, product_images(image_url, is_main)")
        .or(`name.ilike.%${debouncedProduct}%,sku.ilike.%${debouncedProduct}%`)
        .limit(8);
      if (cancelled) return;
      setProductResults(
        (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          image:
            p.product_images?.find((i: any) => i.is_main)?.image_url ||
            p.product_images?.[0]?.image_url,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedProduct, selectedProduct]);

  // Customer search
  useEffect(() => {
    if (!debouncedCustomer || selectedCustomer) {
      setCustomerResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, phone")
        .or(`name.ilike.%${debouncedCustomer}%,phone.ilike.%${debouncedCustomer}%`)
        .limit(8);
      if (cancelled) return;
      setCustomerResults((data || []) as CustomerOption[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedCustomer, selectedCustomer]);

  const canSubmit = useMemo(() => {
    if (!selectedProduct) return false;
    if (!content.trim()) return false;
    if (rating < 1 || rating > 5) return false;
    // need either a linked customer or a typed reviewer name
    if (!selectedCustomer && !reviewerName.trim()) return false;
    return true;
  }, [selectedProduct, content, rating, selectedCustomer, reviewerName]);

  const submit = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const payload: any = {
        product_id: selectedProduct.id,
        customer_id: selectedCustomer?.id ?? null,
        reviewer_name: selectedCustomer ? null : reviewerName.trim(),
        rating,
        title: title.trim() || null,
        content: content.trim(),
        images,
        is_approved: approved,
      };
      if (customDate) {
        payload.created_at = new Date(customDate).toISOString();
      }

      const { error } = await supabase.from("reviews").insert(payload);
      if (error) {
        if ((error as any).code === "23505") {
          toast.error("This customer already reviewed this product. Pick another customer or leave it unlinked.");
        } else {
          toast.error(error.message || "Failed to create review");
        }
        return;
      }

      toast.success("Review created");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["product-reviews", selectedProduct.id] });
      resetForm();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Create Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Product picker */}
          <div className="space-y-2">
            <Label>Product *</Label>
            {selectedProduct ? (
              <div className="flex items-center gap-3 p-2 border rounded">
                {selectedProduct.image && (
                  <img src={selectedProduct.image} alt="" className="w-10 h-10 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedProduct.sku}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedProduct(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by name or SKU"
                    className="pl-8"
                  />
                </div>
                {productResults.length > 0 && (
                  <div className="border rounded max-h-48 overflow-y-auto divide-y">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setProductSearch("");
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                      >
                        {p.image && (
                          <img src={p.image} alt="" className="w-8 h-8 object-cover rounded" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reviewer name */}
          <div className="space-y-2">
            <Label>Reviewer name {selectedCustomer ? "(using linked customer)" : "*"}</Label>
            <Input
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Tanvir Ahmed"
              disabled={!!selectedCustomer}
            />
          </div>

          {/* Optional customer link */}
          <div className="space-y-2">
            <Label>Link to existing customer (optional)</Label>
            {selectedCustomer ? (
              <div className="flex items-center gap-3 p-2 border rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer by name or phone"
                    className="pl-8"
                  />
                </div>
                {customerResults.length > 0 && (
                  <div className="border rounded max-h-48 overflow-y-auto divide-y">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearch("");
                        }}
                        className="w-full flex items-center justify-between p-2 hover:bg-muted text-left"
                      >
                        <span className="text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      s <= rating ? "text-foreground fill-foreground" : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summary" />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Review *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the review..."
              className="min-h-24"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Photos (optional)</Label>
            <ReviewImageUpload images={images} onChange={setImages} maxImages={5} />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={approved}
                onCheckedChange={(v) => setApproved(!!v)}
              />
              Approve immediately
            </label>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-8 w-40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canSubmit || submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCreateReviewDialog;
