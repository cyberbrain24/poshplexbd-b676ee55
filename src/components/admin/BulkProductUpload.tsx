import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── System fields ────────────────────────────────────────────
const SYSTEM_FIELDS = [
  { key: "name", label: "Product Name", required: true },
  { key: "sku", label: "SKU", required: false },
  { key: "category", label: "Category", required: false },
  { key: "subcategory", label: "Subcategory", required: false },
  { key: "brand", label: "Brand", required: false },
  { key: "short_description", label: "Short Description", required: false },
  { key: "full_description", label: "Full Description", required: false },
  { key: "base_price", label: "Price", required: true },
  { key: "product_type", label: "Product Type", required: false },
  { key: "is_active", label: "Active", required: false },
  { key: "is_featured", label: "Featured", required: false },
  { key: "youtube_url", label: "YouTube Video", required: false },
  { key: "size_guide", label: "Size Guide", required: false },
  { key: "care_instruction", label: "Care & Cleaning", required: false },
  { key: "image_urls", label: "Product Images", required: false },
  { key: "variant_color", label: "Variant Color", required: false },
  { key: "variant_size", label: "Variant Size", required: false },
  { key: "variant_material", label: "Variant Material", required: false },
  { key: "variant_sku", label: "Variant SKU", required: false },
  { key: "variant_price", label: "Variant Price", required: false },
] as const;

type SystemFieldKey = (typeof SYSTEM_FIELDS)[number]["key"];

interface RowData {
  [key: string]: string;
}

interface CellError {
  row: number;
  col: string;
  message: string;
  resolved: boolean;
  resolvedValue?: string;
}

interface LookupData {
  categories: { id: string; name: string; parent_id: string | null }[];
  brands: { id: string; name: string }[];
  colors: { id: string; name: string }[];
  sizes: { id: string; label: string }[];
  materials: { id: string; name: string }[];
  sizeGuides: { id: string; name: string }[];
  careInstructions: { id: string; name: string }[];
}

type Step = "upload" | "mapping" | "review" | "importing" | "done";

const BulkProductUpload = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [mapping, setMapping] = useState<Record<string, SystemFieldKey | "">>(
    {}
  );
  const [errors, setErrors] = useState<CellError[]>([]);
  const [editCell, setEditCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [lookup, setLookup] = useState<LookupData | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  // ── Fetch lookup data ──────────────────────────────────────
  const fetchLookups = useCallback(async () => {
    const [cats, brands, colors, sizes, mats, sg, ci] = await Promise.all([
      supabase.from("categories").select("id, name, parent_id"),
      supabase.from("brands").select("id, name"),
      supabase.from("colors").select("id, name"),
      supabase.from("sizes").select("id, label"),
      supabase.from("materials").select("id, name"),
      supabase.from("size_guides").select("id, name"),
      supabase.from("care_instructions").select("id, name"),
    ]);
    setLookup({
      categories: cats.data || [],
      brands: brands.data || [],
      colors: colors.data || [],
      sizes: sizes.data || [],
      materials: mats.data || [],
      sizeGuides: sg.data || [],
      careInstructions: ci.data || [],
    });
    return {
      categories: cats.data || [],
      brands: brands.data || [],
      colors: colors.data || [],
      sizes: sizes.data || [],
      materials: mats.data || [],
      sizeGuides: sg.data || [],
      careInstructions: ci.data || [],
    };
  }, []);

  // ── Template download ──────────────────────────────────────
  const downloadTemplate = () => {
    const templateHeaders = SYSTEM_FIELDS.map((f) => f.label);
    const sampleRow = [
      "Summer T-Shirt",
      "",
      "Men",
      "T-Shirts",
      "Poshplex",
      "Comfortable cotton tee",
      "Full description here...",
      "1200",
      "variable",
      "true",
      "false",
      "",
      "",
      "",
      "https://example.com/img1.jpg, https://example.com/img2.jpg",
      "Red",
      "M",
      "Cotton",
      "",
      "1200",
    ];
    const csv = [templateHeaders.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Parse file ─────────────────────────────────────────────
  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const ext = file.name.split(".").pop()?.toLowerCase();
      let parsedHeaders: string[] = [];
      let parsedRows: RowData[] = [];

      if (ext === "csv") {
        const text = await file.text();
        const result = Papa.parse<RowData>(text, {
          header: true,
          skipEmptyLines: true,
        });
        parsedHeaders = result.meta.fields || [];
        parsedRows = result.data;
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<RowData>(ws, { defval: "" });
        if (json.length > 0) {
          parsedHeaders = Object.keys(json[0]);
          parsedRows = json.map((r) => {
            const row: RowData = {};
            parsedHeaders.forEach((h) => (row[h] = String(r[h] ?? "")));
            return row;
          });
        }
      } else {
        toast.error("Unsupported file type. Use CSV or Excel.");
        return;
      }

      if (parsedRows.length === 0) {
        toast.error("File is empty or has no data rows.");
        return;
      }

      setHeaders(parsedHeaders);
      setRows(parsedRows);

      // Auto-map columns by fuzzy match
      const autoMap: Record<string, SystemFieldKey | ""> = {};
      parsedHeaders.forEach((h) => {
        const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = SYSTEM_FIELDS.find((sf) => {
          const sfNorm = sf.label.toLowerCase().replace(/[^a-z0-9]/g, "");
          const keyNorm = sf.key.toLowerCase().replace(/[^a-z0-9]/g, "");
          return sfNorm === norm || keyNorm === norm || norm.includes(sfNorm) || sfNorm.includes(norm);
        });
        autoMap[h] = match?.key || "";
      });
      setMapping(autoMap);

      await fetchLookups();
      setStep("mapping");
    },
    [fetchLookups]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // ── Proceed to review with validation ──────────────────────
  const proceedToReview = useCallback(() => {
    if (!lookup) return;
    const newErrors: CellError[] = [];

    // Check required fields are mapped
    const mappedFields = Object.values(mapping).filter(Boolean);
    const missingRequired = SYSTEM_FIELDS.filter(
      (f) => f.required && !mappedFields.includes(f.key)
    );
    if (missingRequired.length > 0) {
      toast.error(
        `Required fields not mapped: ${missingRequired.map((f) => f.label).join(", ")}`
      );
      return;
    }

    // Reverse map: systemKey → csvHeader
    const reverseMap: Record<string, string> = {};
    Object.entries(mapping).forEach(([csvH, sysK]) => {
      if (sysK) reverseMap[sysK] = csvH;
    });

    rows.forEach((row, ri) => {
      // Validate category
      const catHeader = reverseMap["category"];
      if (catHeader && row[catHeader]?.trim()) {
        const val = row[catHeader].trim();
        const found = lookup.categories.find(
          (c) => c.name.toLowerCase() === val.toLowerCase()
        );
        if (!found) {
          newErrors.push({
            row: ri,
            col: "category",
            message: `Category "${val}" not found`,
            resolved: false,
          });
        }
      }

      // Validate brand
      const brandHeader = reverseMap["brand"];
      if (brandHeader && row[brandHeader]?.trim()) {
        const val = row[brandHeader].trim();
        const found = lookup.brands.find(
          (b) => b.name.toLowerCase() === val.toLowerCase()
        );
        if (!found) {
          newErrors.push({
            row: ri,
            col: "brand",
            message: `Brand "${val}" not found`,
            resolved: false,
          });
        }
      }

      // Validate variant color
      const colorHeader = reverseMap["variant_color"];
      if (colorHeader && row[colorHeader]?.trim()) {
        const val = row[colorHeader].trim();
        const found = lookup.colors.find(
          (c) => c.name.toLowerCase() === val.toLowerCase()
        );
        if (!found) {
          newErrors.push({
            row: ri,
            col: "variant_color",
            message: `Color "${val}" not found`,
            resolved: false,
          });
        }
      }

      // Validate variant size
      const sizeHeader = reverseMap["variant_size"];
      if (sizeHeader && row[sizeHeader]?.trim()) {
        const val = row[sizeHeader].trim();
        const found = lookup.sizes.find(
          (s) => s.label.toLowerCase() === val.toLowerCase()
        );
        if (!found) {
          newErrors.push({
            row: ri,
            col: "variant_size",
            message: `Size "${val}" not found`,
            resolved: false,
          });
        }
      }

      // Validate variant material
      const matHeader = reverseMap["variant_material"];
      if (matHeader && row[matHeader]?.trim()) {
        const val = row[matHeader].trim();
        const found = lookup.materials.find(
          (m) => m.name.toLowerCase() === val.toLowerCase()
        );
        if (!found) {
          newErrors.push({
            row: ri,
            col: "variant_material",
            message: `Material "${val}" not found`,
            resolved: false,
          });
        }
      }

      // Validate size guide
      const sgHeader = reverseMap["size_guide"];
      if (sgHeader && row[sgHeader]?.trim()) {
        const val = row[sgHeader].trim();
        const found = lookup.sizeGuides.find(
          (s) => s.name.toLowerCase() === val.toLowerCase()
        );
        if (!found) {
          newErrors.push({
            row: ri,
            col: "size_guide",
            message: `Size Guide "${val}" not found`,
            resolved: false,
          });
        }
      }

      // Validate care instruction
      const ciHeader = reverseMap["care_instruction"];
      if (ciHeader && row[ciHeader]?.trim()) {
        const val = row[ciHeader].trim();
        const found = lookup.careInstructions.find(
          (c) => c.name.toLowerCase() === val.toLowerCase()
        );
        if (!found) {
          newErrors.push({
            row: ri,
            col: "care_instruction",
            message: `Care Instruction "${val}" not found`,
            resolved: false,
          });
        }
      }

      // Validate price is a number
      const priceHeader = reverseMap["base_price"];
      if (priceHeader) {
        const val = row[priceHeader]?.trim();
        if (!val || isNaN(Number(val))) {
          newErrors.push({
            row: ri,
            col: "base_price",
            message: "Price must be a valid number",
            resolved: false,
          });
        }
      }

      // Validate name
      const nameHeader = reverseMap["name"];
      if (nameHeader && !row[nameHeader]?.trim()) {
        newErrors.push({
          row: ri,
          col: "name",
          message: "Product name is required",
          resolved: false,
        });
      }
    });

    setErrors(newErrors);
    setStep("review");
  }, [mapping, rows, lookup]);

  // ── Resolve error with dropdown ────────────────────────────
  const resolveError = (errIndex: number, value: string) => {
    setErrors((prev) =>
      prev.map((e, i) =>
        i === errIndex ? { ...e, resolved: true, resolvedValue: value } : e
      )
    );
  };

  // ── Get lookup options for a field ─────────────────────────
  const getLookupOptions = (
    col: string
  ): { value: string; label: string }[] => {
    if (!lookup) return [];
    switch (col) {
      case "category":
        return lookup.categories.map((c) => ({ value: c.name, label: c.name }));
      case "brand":
        return lookup.brands.map((b) => ({ value: b.name, label: b.name }));
      case "variant_color":
        return lookup.colors.map((c) => ({ value: c.name, label: c.name }));
      case "variant_size":
        return lookup.sizes.map((s) => ({ value: s.label, label: s.label }));
      case "variant_material":
        return lookup.materials.map((m) => ({
          value: m.name,
          label: m.name,
        }));
      case "size_guide":
        return lookup.sizeGuides.map((s) => ({
          value: s.name,
          label: s.name,
        }));
      case "care_instruction":
        return lookup.careInstructions.map((c) => ({
          value: c.name,
          label: c.name,
        }));
      default:
        return [];
    }
  };

  // ── Edit cell inline ───────────────────────────────────────
  const updateCell = (rowIdx: number, csvHeader: string, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, [csvHeader]: value } : r))
    );
  };

  const deleteRow = (rowIdx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
    setErrors((prev) =>
      prev
        .filter((e) => e.row !== rowIdx)
        .map((e) => (e.row > rowIdx ? { ...e, row: e.row - 1 } : e))
    );
  };

  // ── Import products ────────────────────────────────────────
  const handleImport = async () => {
    if (!lookup) return;
    const unresolvedErrors = errors.filter((e) => !e.resolved);
    if (unresolvedErrors.length > 0) {
      toast.error(
        `${unresolvedErrors.length} unresolved error(s). Fix all before importing.`
      );
      return;
    }

    setStep("importing");
    setImportTotal(rows.length);
    setImportProgress(0);

    // Build reverse map
    const reverseMap: Record<string, string> = {};
    Object.entries(mapping).forEach(([csvH, sysK]) => {
      if (sysK) reverseMap[sysK] = csvH;
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const getVal = (key: string): string => {
          const csvH = reverseMap[key];
          if (!csvH) return "";
          // Check if there's a resolved error for this cell
          const err = errors.find(
            (e) => e.row === i && e.col === key && e.resolved
          );
          if (err?.resolvedValue) return err.resolvedValue;
          return row[csvH]?.trim() || "";
        };

        // Resolve IDs
        const categoryName = getVal("category");
        const subcategoryName = getVal("subcategory");
        let categoryId: string | null = null;
        if (subcategoryName) {
          const parent = lookup.categories.find(
            (c) =>
              c.name.toLowerCase() === categoryName.toLowerCase() &&
              !c.parent_id
          );
          const sub = lookup.categories.find(
            (c) =>
              c.name.toLowerCase() === subcategoryName.toLowerCase() &&
              c.parent_id === parent?.id
          );
          categoryId = sub?.id || parent?.id || null;
        } else if (categoryName) {
          categoryId =
            lookup.categories.find(
              (c) => c.name.toLowerCase() === categoryName.toLowerCase()
            )?.id || null;
        }

        const brandName = getVal("brand");
        const brandId = brandName
          ? lookup.brands.find(
              (b) => b.name.toLowerCase() === brandName.toLowerCase()
            )?.id || null
          : null;

        const sgName = getVal("size_guide");
        const sgId = sgName
          ? lookup.sizeGuides.find(
              (s) => s.name.toLowerCase() === sgName.toLowerCase()
            )?.id || null
          : null;

        const ciName = getVal("care_instruction");
        const ciId = ciName
          ? lookup.careInstructions.find(
              (c) => c.name.toLowerCase() === ciName.toLowerCase()
            )?.id || null
          : null;

        const hasVariantData =
          getVal("variant_color") ||
          getVal("variant_size") ||
          getVal("variant_material");
        const productType = getVal("product_type") || (hasVariantData ? "variable" : "simple");
        const isActive = getVal("is_active").toLowerCase() !== "false";
        const isFeatured = getVal("is_featured").toLowerCase() === "true";

        // Insert product
        const { data: product, error: prodErr } = await supabase
          .from("products")
          .insert({
            name: getVal("name"),
            sku: getVal("sku") || undefined,
            category_id: categoryId,
            brand_id: brandId,
            short_description: getVal("short_description") || null,
            full_description: getVal("full_description") || null,
            base_price: Number(getVal("base_price")) || 0,
            product_type: productType as "simple" | "variable",
            is_active: isActive,
            is_featured: isFeatured,
            youtube_url: getVal("youtube_url") || null,
            size_guide_id: sgId,
            care_instruction_id: ciId,
          })
          .select("id")
          .single();

        if (prodErr) throw prodErr;

        // Insert images
        const imageUrls = getVal("image_urls");
        if (imageUrls && product) {
          const urls = imageUrls
            .split(",")
            .map((u) => u.trim())
            .filter(Boolean);
          for (let j = 0; j < urls.length; j++) {
            await supabase.from("product_images").insert({
              product_id: product.id,
              image_url: urls[j],
              is_main: j === 0,
              sort_order: j,
            });
          }
        }

        // Insert variant if data present
        if (hasVariantData && product) {
          const colorName = getVal("variant_color");
          const sizeName = getVal("variant_size");
          const matName = getVal("variant_material");

          const colorId = colorName
            ? lookup.colors.find(
                (c) => c.name.toLowerCase() === colorName.toLowerCase()
              )?.id || null
            : null;
          const sizeId = sizeName
            ? lookup.sizes.find(
                (s) => s.label.toLowerCase() === sizeName.toLowerCase()
              )?.id || null
            : null;
          const matId = matName
            ? lookup.materials.find(
                (m) => m.name.toLowerCase() === matName.toLowerCase()
              )?.id || null
            : null;

          await supabase.from("product_variants").insert({
            product_id: product.id,
            color_id: colorId,
            size_id: sizeId,
            material_id: matId,
            sku: getVal("variant_sku") || undefined,
            selling_price:
              Number(getVal("variant_price")) ||
              Number(getVal("base_price")) ||
              0,
            purchase_price: 0,
            is_active: true,
          });
        }

        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Row ${i + 1} failed:`, err);
      }
      setImportProgress(i + 1);
    }

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-list"] });
    queryClient.invalidateQueries({ queryKey: ["products-count"] });
    queryClient.invalidateQueries({ queryKey: ["products-optimized"] });

    setStep("done");
    if (failCount === 0) {
      toast.success(`All ${successCount} products imported successfully!`);
    } else {
      toast.warning(
        `${successCount} imported, ${failCount} failed. Check console for details.`
      );
    }
  };

  // ── Reset ──────────────────────────────────────────────────
  const reset = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setErrors([]);
    setEditCell(null);
    setImportProgress(0);
    setImportTotal(0);
  };

  // ── Mapped field keys for the review table ─────────────────
  const reverseMap: Record<string, string> = {};
  Object.entries(mapping).forEach(([csvH, sysK]) => {
    if (sysK) reverseMap[sysK] = csvH;
  });
  const mappedSystemFields = SYSTEM_FIELDS.filter((f) => reverseMap[f.key]);

  const unresolvedCount = errors.filter((e) => !e.resolved).length;

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drop CSV or Excel file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .csv, .xlsx, .xls
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Step: Mapping */}
      {step === "mapping" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName}</span>
              <Badge variant="secondary">{rows.length} rows</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                Cancel
              </Button>
              <Button size="sm" onClick={proceedToReview}>
                Continue to Review
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Map each column from your file to the correct system field. Required
            fields are marked with{" "}
            <span className="text-destructive font-medium">*</span>
          </p>

          <div className="border border-border rounded-lg divide-y divide-border">
            {headers.map((h) => (
              <div
                key={h}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {h}
                </span>
                <Select
                  value={mapping[h] || "___unmapped___"}
                  onValueChange={(v) =>
                    setMapping((prev) => ({
                      ...prev,
                      [h]: v === "___unmapped___" ? "" : (v as SystemFieldKey),
                    }))
                  }
                >
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Skip this column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="___unmapped___">
                      — Skip —
                    </SelectItem>
                    {SYSTEM_FIELDS.map((sf) => (
                      <SelectItem key={sf.key} value={sf.key}>
                        {sf.label}
                        {sf.required ? " *" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{rows.length} products</Badge>
              {unresolvedCount > 0 ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {unresolvedCount} issue{unresolvedCount > 1 ? "s" : ""}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 border-green-500 text-green-700"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  All clear
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("mapping")}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={unresolvedCount > 0}
              >
                Import {rows.length} Products
              </Button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-destructive">
                Resolve all mismatches before importing:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {errors.map((err, ei) => (
                  <div
                    key={ei}
                    className={cn(
                      "flex items-center gap-3 text-sm p-2 rounded",
                      err.resolved
                        ? "bg-green-50 border border-green-200"
                        : "bg-destructive/10 border border-destructive/20"
                    )}
                  >
                    <span className="text-muted-foreground shrink-0">
                      Row {err.row + 1}
                    </span>
                    <span className="truncate">{err.message}</span>
                    {!err.resolved && getLookupOptions(err.col).length > 0 ? (
                      <Select
                        value=""
                        onValueChange={(v) => resolveError(ei, v)}
                      >
                        <SelectTrigger className="w-40 h-8 shrink-0">
                          <SelectValue placeholder="Fix..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getLookupOptions(err.col).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : err.resolved ? (
                      <Badge variant="outline" className="border-green-500 text-green-700 shrink-0">
                        → {err.resolvedValue}
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data preview table */}
          <div className="border border-border rounded-lg overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 sticky left-0 bg-muted/80 z-10">
                    #
                  </TableHead>
                  {mappedSystemFields.map((f) => (
                    <TableHead key={f.key} className="min-w-[120px]">
                      {f.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, ri) => (
                  <TableRow key={ri}>
                    <TableCell className="sticky left-0 bg-background z-10 text-muted-foreground text-xs">
                      {ri + 1}
                    </TableCell>
                    {mappedSystemFields.map((f) => {
                      const csvH = reverseMap[f.key];
                      const cellVal = row[csvH] || "";
                      const hasError = errors.some(
                        (e) => e.row === ri && e.col === f.key && !e.resolved
                      );
                      const resolvedErr = errors.find(
                        (e) => e.row === ri && e.col === f.key && e.resolved
                      );
                      const isEditing =
                        editCell?.row === ri && editCell?.col === f.key;

                      return (
                        <TableCell
                          key={f.key}
                          className={cn(
                            "relative",
                            hasError && "bg-destructive/10",
                            resolvedErr && "bg-green-50"
                          )}
                          onClick={() => setEditCell({ row: ri, col: f.key })}
                        >
                          {isEditing ? (
                            <Input
                              autoFocus
                              className="h-7 text-xs"
                              defaultValue={resolvedErr?.resolvedValue || cellVal}
                              onBlur={(e) => {
                                updateCell(ri, csvH, e.target.value);
                                setEditCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateCell(
                                    ri,
                                    csvH,
                                    (e.target as HTMLInputElement).value
                                  );
                                  setEditCell(null);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xs truncate block max-w-[200px]">
                              {resolvedErr?.resolvedValue || cellVal || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteRow(ri)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium">
            Importing products... {importProgress} / {importTotal}
          </p>
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="text-lg font-medium">Import Complete</p>
          <p className="text-sm text-muted-foreground">
            {importProgress} products processed
          </p>
          <Button onClick={reset}>Upload Another File</Button>
        </div>
      )}
    </div>
  );
};

export default BulkProductUpload;
