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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SystemField = {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
};

// ── System fields ────────────────────────────────────────────
const SYSTEM_FIELDS: SystemField[] = [
  { key: "name", label: "Product Name", required: true, aliases: ["productname"] },
  { key: "sku", label: "SKU", required: false, aliases: [] },
  { key: "category", label: "Category", required: false, aliases: [] },
  { key: "subcategory", label: "Subcategory", required: false, aliases: [] },
  { key: "brand", label: "Brand", required: false, aliases: [] },
  { key: "short_description", label: "Short Description", required: false, aliases: ["shortdescription"] },
  { key: "full_description", label: "Description", required: false, aliases: ["description", "fulldescription"] },
  { key: "base_price", label: "Base Price", required: true, aliases: ["price", "baseprice"] },
  { key: "product_type", label: "Product Type", required: false, aliases: ["producttype", "type"] },
  { key: "image_urls", label: "image url", required: false, aliases: ["imageurl", "imageurls", "productimages"] },
  { key: "variant_sku", label: "Variant SKU", required: false, aliases: ["variantsku"] },
  { key: "variant_image_url", label: "Variant Image Url", required: false, aliases: ["variantimageurl", "variantimageurls"] },
  { key: "variant_price", label: "Variant Price", required: false, aliases: ["variantprice", "variantsellingprice"] },
  { key: "variant_size", label: "Variant Size", required: false, aliases: ["variantsize"] },
  { key: "variant_color", label: "Variant Color", required: false, aliases: ["variantcolor"] },
  // Legacy / optional fields kept for backward-compatible uploads
  { key: "is_active", label: "Active", required: false, aliases: [] },
  { key: "is_featured", label: "Featured", required: false, aliases: [] },
  { key: "youtube_url", label: "YouTube Video", required: false, aliases: [] },
  { key: "size_guide", label: "Size Guide", required: false, aliases: [] },
  { key: "care_instruction", label: "Care & Cleaning", required: false, aliases: [] },
  { key: "variant_material", label: "Variant Material", required: false, aliases: [] },
];

type SystemFieldKey = (typeof SYSTEM_FIELDS)[number]["key"];

// Refined template fields shown in the downloaded template
const TEMPLATE_FIELDS: SystemFieldKey[] = [
  "name",
  "sku",
  "product_type",
  "short_description",
  "full_description",
  "base_price",
  "category",
  "subcategory",
  "brand",
  "image_urls",
  "variant_sku",
  "variant_image_url",
  "variant_price",
  "variant_size",
  "variant_color",
];

// Fields where comma = multiple values (variants / images)
const COMMA_FIELDS = new Set<string>([
  "image_urls",
  "variant_color",
  "variant_size",
  "variant_material",
  "variant_sku",
  "variant_image_url",
  "variant_price",
]);

interface RowData {
  [key: string]: string;
}

interface CellError {
  row: number;
  col: string;
  /** index inside comma-separated list, or -1 for the whole cell */
  idx: number;
  value: string;
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

/** Split a cell by comma, trim each, filter empty */
const splitComma = (v: string): string[] =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const BulkProductUpload = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [mapping, setMapping] = useState<Record<string, SystemFieldKey | "">>({});
  const [errors, setErrors] = useState<CellError[]>([]);
  const [editCell, setEditCell] = useState<{ row: number; col: string } | null>(null);
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
    const data: LookupData = {
      categories: cats.data || [],
      brands: brands.data || [],
      colors: colors.data || [],
      sizes: sizes.data || [],
      materials: mats.data || [],
      sizeGuides: sg.data || [],
      careInstructions: ci.data || [],
    };
    setLookup(data);
    return data;
  }, []);

  // ── Template download ──────────────────────────────────────
  const downloadTemplate = () => {
    const templateHeaders = TEMPLATE_FIELDS.map(
      (k) => SYSTEM_FIELDS.find((f) => f.key === k)!.label
    );

    // Row 1: Variable product with 4 variants (comma-separated)
    const row1 = [
      "Solid Drop Shoulder T-Shirt",             // Product Name
      "DRP-001",                                 // SKU
      "variable",                                // Product Type
      "Premium oversized drop shoulder tee",     // Short Description
      "Made with 100% cotton fabric for ultimate comfort. Features a relaxed oversized fit with drop shoulder design.", // Description
      "1290",                                    // Base Price
      "Upper Wear",                              // Category
      "Solid Drop",                              // Subcategory
      "Poshplex",                                // Brand
      "https://example.com/drp-black.jpg, https://example.com/drp-white.jpg, https://example.com/drp-cream.jpg, https://example.com/drp-maroon.jpg", // image url
      "DRP-001-BK, DRP-001-WH, DRP-001-CR, DRP-001-MR", // Variant SKU
      "https://example.com/drp-black.jpg, https://example.com/drp-white.jpg, https://example.com/drp-cream.jpg, https://example.com/drp-maroon.jpg", // Variant Image Url
      "1290, 1290, 1290, 1290",                  // Variant Price
      "M, L, XL, XXL",                           // Variant Size
      "Black, White, Cream, Maroon",             // Variant Color
    ];

    // Row 2: Another variable product with 3 variants
    const row2 = [
      "Printed Baggy Joggers",                   // Product Name
      "BGJ-001",                                 // SKU
      "variable",                                // Product Type
      "Streetwear baggy joggers with print",     // Short Description
      "High-quality printed baggy joggers with elastic waistband and cuffed ankles. Perfect for street style.", // Description
      "1490",                                    // Base Price
      "Bottom Wear",                             // Category
      "Printed Baggy Joggers",                   // Subcategory
      "Poshplex",                                // Brand
      "https://example.com/bgj-black.jpg, https://example.com/bgj-coffee.jpg", // image url
      "BGJ-001-BK, BGJ-001-CF, BGJ-001-BG",     // Variant SKU
      "https://example.com/bgj-black.jpg, https://example.com/bgj-coffee.jpg, https://example.com/bgj-bottle.jpg", // Variant Image Url
      "1490, 1490, 1490",                        // Variant Price
      "M, L, XL",                                // Variant Size
      "Black, Coffee, Bottle Green",             // Variant Color
    ];

    // Row 3: Simple product (no variants)
    const row3 = [
      "Premium Bandana",                         // Product Name
      "BND-001",                                 // SKU
      "simple",                                  // Product Type
      "Classic cotton bandana",                  // Short Description
      "Versatile bandana made from soft cotton. Can be worn as headwear, neck accessory, or wrist wrap.", // Description
      "390",                                     // Base Price
      "Accessories",                             // Category
      "Bandana",                                 // Subcategory
      "Poshplex",                                // Brand
      "https://example.com/bandana.jpg",         // image url
      "",                                        // Variant SKU
      "",                                        // Variant Image Url
      "",                                        // Variant Price
      "",                                        // Variant Size
      "",                                        // Variant Color
    ];

    const csvContent = [templateHeaders, row1, row2, row3]
      .map((r) =>
        r.map((cell) => {
          if (cell.includes(",")) return `"${cell}"`;
          return cell;
        }).join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
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
      // Reset all state for fresh upload
      setErrors([]);
      setEditCell(null);
      setImportProgress(0);
      setImportTotal(0);
      setFileName(file.name);
      const ext = file.name.split(".").pop()?.toLowerCase();
      let parsedHeaders: string[] = [];
      let parsedRows: RowData[] = [];

      if (ext === "csv") {
        const text = await file.text();
        const result = Papa.parse<RowData>(text, { header: true, skipEmptyLines: true });
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

      // Auto-map columns by fuzzy match (label, key, or aliases)
      const autoMap: Record<string, SystemFieldKey | ""> = {};
      parsedHeaders.forEach((h) => {
        const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = SYSTEM_FIELDS.find((sf) => {
          const sfNorm = sf.label.toLowerCase().replace(/[^a-z0-9]/g, "");
          const keyNorm = sf.key.toLowerCase().replace(/[^a-z0-9]/g, "");
          const aliasNorms = sf.aliases.map((a) => a.toLowerCase().replace(/[^a-z0-9]/g, ""));
          return (
            sfNorm === norm ||
            keyNorm === norm ||
            norm.includes(sfNorm) ||
            sfNorm.includes(norm) ||
            aliasNorms.includes(norm)
          );
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

  // ── Validate a lookup value (single) ───────────────────────
  const validateLookup = (
    value: string,
    col: string,
    lk: LookupData
  ): boolean => {
    const v = value.toLowerCase();
    switch (col) {
      case "category":
        return lk.categories.some((c) => c.name.toLowerCase() === v);
      case "brand":
        return lk.brands.some((b) => b.name.toLowerCase() === v);
      case "variant_color":
        return lk.colors.some((c) => c.name.toLowerCase() === v);
      case "variant_size":
        return lk.sizes.some((s) => s.label.toLowerCase() === v);
      case "variant_material":
        return lk.materials.some((m) => m.name.toLowerCase() === v);
      case "size_guide":
        return lk.sizeGuides.some((s) => s.name.toLowerCase() === v);
      case "care_instruction":
        return lk.careInstructions.some((c) => c.name.toLowerCase() === v);
      default:
        return true;
    }
  };

  const LOOKUP_FIELDS = new Set([
    "category",
    "brand",
    "variant_color",
    "variant_size",
    "variant_material",
    "size_guide",
    "care_instruction",
  ]);

  const fieldLabel: Record<string, string> = {
    category: "Category",
    brand: "Brand",
    variant_color: "Color",
    variant_size: "Size",
    variant_material: "Material",
    size_guide: "Size Guide",
    care_instruction: "Care Instruction",
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
      toast.error(`Required fields not mapped: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }

    // Reverse map: systemKey → csvHeader
    const rMap: Record<string, string> = {};
    Object.entries(mapping).forEach(([csvH, sysK]) => {
      if (sysK) rMap[sysK] = csvH;
    });

    rows.forEach((row, ri) => {
      // Validate name
      const nameH = rMap["name"];
      if (nameH && !row[nameH]?.trim()) {
        newErrors.push({ row: ri, col: "name", idx: -1, value: "", message: "Product name is required", resolved: false });
      }

      // Validate price
      const priceH = rMap["base_price"];
      if (priceH) {
        const val = row[priceH]?.trim();
        if (!val || isNaN(Number(val))) {
          newErrors.push({ row: ri, col: "base_price", idx: -1, value: val || "", message: "Price must be a valid number", resolved: false });
        }
      }

      // Validate lookup fields (some are comma-separated)
      for (const field of LOOKUP_FIELDS) {
        const csvH = rMap[field];
        if (!csvH) continue;
        const raw = row[csvH]?.trim();
        if (!raw) continue;

        if (COMMA_FIELDS.has(field)) {
          // Comma-separated: validate each item
          const items = splitComma(raw);
          items.forEach((item, idx) => {
            if (!validateLookup(item, field, lookup)) {
              newErrors.push({
                row: ri,
                col: field,
                idx,
                value: item,
                message: `${fieldLabel[field] || field} "${item}" not found`,
                resolved: false,
              });
            }
          });
        } else {
          // Single value
          if (!validateLookup(raw, field, lookup)) {
            newErrors.push({
              row: ri,
              col: field,
              idx: -1,
              value: raw,
              message: `${fieldLabel[field] || field} "${raw}" not found`,
              resolved: false,
            });
          }
        }
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
  const getLookupOptions = (col: string): { value: string; label: string }[] => {
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
        return lookup.materials.map((m) => ({ value: m.name, label: m.name }));
      case "size_guide":
        return lookup.sizeGuides.map((s) => ({ value: s.name, label: s.name }));
      case "care_instruction":
        return lookup.careInstructions.map((c) => ({ value: c.name, label: c.name }));
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
      toast.error(`${unresolvedErrors.length} unresolved error(s). Fix all before importing.`);
      return;
    }

    setStep("importing");
    setImportTotal(rows.length);
    setImportProgress(0);

    // Build reverse map
    const rMap: Record<string, string> = {};
    Object.entries(mapping).forEach(([csvH, sysK]) => {
      if (sysK) rMap[sysK] = csvH;
    });

    /** Get cell value, applying resolved error overrides for single-value fields */
    const getVal = (row: RowData, rowIdx: number, key: string): string => {
      const csvH = rMap[key];
      if (!csvH) return "";
      // For single-value fields, check resolved error
      const err = errors.find((e) => e.row === rowIdx && e.col === key && e.idx === -1 && e.resolved);
      if (err?.resolvedValue) return err.resolvedValue;
      return row[csvH]?.trim() || "";
    };

    /** Get comma-separated values, applying resolved error overrides per index */
    const getCommaVal = (row: RowData, rowIdx: number, key: string): string[] => {
      const csvH = rMap[key];
      if (!csvH) return [];
      const raw = row[csvH]?.trim() || "";
      if (!raw) return [];
      const items = splitComma(raw);
      // Apply per-index resolved errors
      return items.map((item, idx) => {
        const err = errors.find((e) => e.row === rowIdx && e.col === key && e.idx === idx && e.resolved);
        return err?.resolvedValue || item;
      });
    };

    // Helper to resolve category ID
    const resolveCategoryId = (categoryName: string, subcategoryName: string): string | null => {
      if (subcategoryName) {
        const parent = lookup.categories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase() && !c.parent_id
        );
        const sub = lookup.categories.find(
          (c) => c.name.toLowerCase() === subcategoryName.toLowerCase() && c.parent_id === parent?.id
        );
        return sub?.id || parent?.id || null;
      }
      if (categoryName) {
        return lookup.categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())?.id || null;
      }
      return null;
    };

    let successCount = 0;
    let failCount = 0;

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      try {
        const categoryId = resolveCategoryId(getVal(row, ri, "category"), getVal(row, ri, "subcategory"));
        const brandName = getVal(row, ri, "brand");
        const brandId = brandName
          ? lookup.brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase())?.id || null
          : null;
        const sgName = getVal(row, ri, "size_guide");
        const sgId = sgName
          ? lookup.sizeGuides.find((s) => s.name.toLowerCase() === sgName.toLowerCase())?.id || null
          : null;
        const ciName = getVal(row, ri, "care_instruction");
        const ciId = ciName
          ? lookup.careInstructions.find((c) => c.name.toLowerCase() === ciName.toLowerCase())?.id || null
          : null;

        // Determine product type from comma-separated variant fields
        const colors = getCommaVal(row, ri, "variant_color");
        const sizes = getCommaVal(row, ri, "variant_size");
        const materials = getCommaVal(row, ri, "variant_material");
        const variantSkus = getCommaVal(row, ri, "variant_sku");
        const variantImageUrls = getCommaVal(row, ri, "variant_image_url");
        const variantPrices = getCommaVal(row, ri, "variant_price");

        const hasVariants =
          colors.length > 0 ||
          sizes.length > 0 ||
          materials.length > 0 ||
          variantSkus.length > 0 ||
          variantImageUrls.length > 0 ||
          variantPrices.length > 0;

        const explicitType = getVal(row, ri, "product_type");
        const productType = explicitType || (hasVariants ? "variable" : "simple");
        const isActive = getVal(row, ri, "is_active").toLowerCase() !== "false";
        const isFeatured = getVal(row, ri, "is_featured").toLowerCase() === "true";

        // Insert product
        const { data: product, error: prodErr } = await supabase
          .from("products")
          .insert({
            name: getVal(row, ri, "name"),
            sku: getVal(row, ri, "sku") || "",
            category_id: categoryId,
            brand_id: brandId,
            short_description: getVal(row, ri, "short_description") || null,
            full_description: getVal(row, ri, "full_description") || null,
            base_price: Number(getVal(row, ri, "base_price")) || 0,
            product_type: productType as "simple" | "variable",
            is_active: isActive,
            is_featured: isFeatured,
            youtube_url: getVal(row, ri, "youtube_url") || null,
            size_guide_id: sgId,
            care_instruction_id: ciId,
          })
          .select("id")
          .single();

        if (prodErr) throw prodErr;

        // Insert into product_categories junction table for multi-category support
        if (categoryId) {
          await supabase.from("product_categories").insert({
            product_id: product.id,
            category_id: categoryId,
          });
        }

        // Insert images (comma-separated URLs)
        const imageUrls = getCommaVal(row, ri, "image_urls");
        for (let imgIdx = 0; imgIdx < imageUrls.length; imgIdx++) {
          const { error: imgErr } = await supabase.from("product_images").insert({
            product_id: product.id,
            image_url: imageUrls[imgIdx],
            is_main: imgIdx === 0,
            sort_order: imgIdx,
          });
          if (imgErr) console.error(`Image ${imgIdx + 1} for row ${ri + 1} failed:`, imgErr);
        }

        // Insert variants by index
        // The number of variants = max length among variant columns
        if (hasVariants) {
          const variantCount = Math.max(
            colors.length,
            sizes.length,
            materials.length,
            variantSkus.length,
            variantImageUrls.length,
            variantPrices.length
          );
          for (let vi = 0; vi < variantCount; vi++) {
            const colorName = colors[vi] || "";
            const sizeName = sizes[vi] || "";
            const matName = materials[vi] || "";

            const colorId = colorName
              ? lookup.colors.find((c) => c.name.toLowerCase() === colorName.toLowerCase())?.id || null
              : null;
            const sizeId = sizeName
              ? lookup.sizes.find((s) => s.label.toLowerCase() === sizeName.toLowerCase())?.id || null
              : null;
            const matId = matName
              ? lookup.materials.find((m) => m.name.toLowerCase() === matName.toLowerCase())?.id || null
              : null;

            const vSku = variantSkus[vi] || "";
            const vPriceRaw = variantPrices[vi] || "";
            const vPrice = vPriceRaw ? Number(vPriceRaw) : Number(getVal(row, ri, "base_price")) || 0;
            const vImageUrl = variantImageUrls[vi] || "";

            const { error: varErr } = await supabase.from("product_variants").insert({
              product_id: product.id,
              color_id: colorId,
              size_id: sizeId,
              material_id: matId,
              sku: vSku,
              selling_price: vPrice,
              purchase_price: 0,
              image_url: vImageUrl || null,
              is_active: true,
            });
            if (varErr) {
              console.error(`Variant ${vi + 1} for row ${ri + 1} failed:`, varErr);
            }
          }
        }

        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Row ${ri + 1} failed:`, err);
      }

      setImportProgress(ri + 1);
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
      toast.warning(`${successCount} imported, ${failCount} failed. Check console for details.`);
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

  // Count variant info per row for display
  const getVariantCount = (row: RowData, ri: number): number => {
    const colors = reverseMap["variant_color"] ? splitComma(row[reverseMap["variant_color"]] || "").length : 0;
    const sizes = reverseMap["variant_size"] ? splitComma(row[reverseMap["variant_size"]] || "").length : 0;
    const materials = reverseMap["variant_material"] ? splitComma(row[reverseMap["variant_material"]] || "").length : 0;
    return Math.max(colors, sizes, materials);
  };

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
            <p className="text-sm font-medium">Drop CSV or Excel file here, or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Tip:</span> Use commas within cells for multiple variants
              (e.g. Colors: "Red, Blue, Black")
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
              <Badge variant="secondary">{rows.length} products</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset}>Cancel</Button>
              <Button size="sm" onClick={proceedToReview}>Continue to Review</Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Map each column from your file to the correct system field. Required fields are marked with{" "}
            <span className="text-destructive font-medium">*</span>
          </p>

          <div className="bg-accent/30 border border-border rounded-lg p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">One row = one product.</span>{" "}
            For variable products, use commas within cells for variant data. Example: Color cell = "Red, Blue, Black" creates 3 variants.
          </div>

          <div className="border border-border rounded-lg divide-y divide-border">
            {headers.map((h) => {
              const isSkipped = !mapping[h];
              return (
                <div
                  key={h}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 gap-3",
                    isSkipped && "bg-muted/40 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={!isSkipped}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          setMapping((prev) => ({ ...prev, [h]: "" }));
                        } else {
                          // Re-auto-map on uncheck
                          const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
                          const match = SYSTEM_FIELDS.find((sf) => {
                            const sfNorm = sf.label.toLowerCase().replace(/[^a-z0-9]/g, "");
                            const keyNorm = sf.key.toLowerCase().replace(/[^a-z0-9]/g, "");
                            return sfNorm === norm || keyNorm === norm || norm.includes(sfNorm) || sfNorm.includes(norm);
                          });
                          setMapping((prev) => ({ ...prev, [h]: match?.key || "" }));
                        }
                      }}
                    />
                    <span className={cn("text-sm font-medium truncate max-w-[200px]", isSkipped && "line-through")}>{h}</span>
                    {isSkipped && (
                      <Badge variant="secondary" className="gap-1 text-[10px] shrink-0">
                        <Ban className="h-3 w-3" />
                        Skipped
                      </Badge>
                    )}
                  </div>
                  <Select
                    value={mapping[h] || "___unmapped___"}
                    onValueChange={(v) =>
                      setMapping((prev) => ({
                        ...prev,
                        [h]: v === "___unmapped___" ? "" : (v as SystemFieldKey),
                      }))
                    }
                  >
                    <SelectTrigger className={cn("w-52", isSkipped && "border-dashed")}>
                      <SelectValue placeholder="Skip this column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="___unmapped___">— Skip (leave empty) —</SelectItem>
                      {SYSTEM_FIELDS.map((sf) => (
                        <SelectItem key={sf.key} value={sf.key}>
                          {sf.label}{sf.required ? " *" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* Skip summary */}
          {(() => {
            const skippedCount = headers.filter((h) => !mapping[h]).length;
            return skippedCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                <Ban className="h-3 w-3 inline mr-1" />
                {skippedCount} column{skippedCount > 1 ? "s" : ""} skipped — those fields will be left empty on imported products.
              </p>
            ) : null;
          })()}
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary">{rows.length} products</Badge>
              {(() => {
                const variableCount = rows.filter((r, ri) => getVariantCount(r, ri) > 0).length;
                return variableCount > 0 ? (
                  <Badge variant="outline">{variableCount} variable, {rows.length - variableCount} simple</Badge>
                ) : null;
              })()}
              {unresolvedCount > 0 ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {unresolvedCount} issue{unresolvedCount > 1 ? "s" : ""}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  All clear
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("mapping")}>Back</Button>
              <Button size="sm" onClick={handleImport} disabled={unresolvedCount > 0}>
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
                    <span className="text-muted-foreground shrink-0">Row {err.row + 1}</span>
                    <span className="truncate">{err.message}</span>
                    {!err.resolved && getLookupOptions(err.col).length > 0 ? (
                      <Select value="" onValueChange={(v) => resolveError(ei, v)}>
                        <SelectTrigger className="w-40 h-8 shrink-0">
                          <SelectValue placeholder="Fix..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getLookupOptions(err.col).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                  <TableHead className="w-10 sticky left-0 bg-muted/80 z-10">#</TableHead>
                  {mappedSystemFields.map((f) => (
                    <TableHead key={f.key} className="min-w-[120px]">
                      <div className="flex items-center gap-1">
                        {f.label}
                        {COMMA_FIELDS.has(f.key) && (
                          <span className="text-[10px] px-1 rounded bg-primary/10 text-primary font-medium">CSV</span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-20">Variants</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, ri) => {
                  const vc = getVariantCount(row, ri);
                  return (
                    <TableRow key={ri}>
                      <TableCell className="sticky left-0 bg-background z-10 text-muted-foreground text-xs">
                        {ri + 1}
                      </TableCell>
                      {mappedSystemFields.map((f) => {
                        const csvH = reverseMap[f.key];
                        const cellVal = row[csvH] || "";
                        const hasError = errors.some((e) => e.row === ri && e.col === f.key && !e.resolved);
                        const resolvedErr = errors.find((e) => e.row === ri && e.col === f.key && e.resolved);
                        const isEditing = editCell?.row === ri && editCell?.col === f.key;
                        const isCommaField = COMMA_FIELDS.has(f.key);

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
                                defaultValue={cellVal}
                                onBlur={(e) => {
                                  updateCell(ri, csvH, e.target.value);
                                  setEditCell(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateCell(ri, csvH, (e.target as HTMLInputElement).value);
                                    setEditCell(null);
                                  }
                                }}
                              />
                            ) : isCommaField && cellVal ? (
                              <div className="flex flex-wrap gap-1 max-w-[250px]">
                                {splitComma(cellVal).map((item, idx) => {
                                  const itemErr = errors.find(
                                    (e) => e.row === ri && e.col === f.key && e.idx === idx && !e.resolved
                                  );
                                  const itemResolved = errors.find(
                                    (e) => e.row === ri && e.col === f.key && e.idx === idx && e.resolved
                                  );
                                  return (
                                    <span
                                      key={idx}
                                      className={cn(
                                        "text-[11px] px-1.5 py-0.5 rounded",
                                        itemErr
                                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                                          : itemResolved
                                          ? "bg-green-100 text-green-800 border border-green-300"
                                          : "bg-muted text-muted-foreground"
                                      )}
                                    >
                                      {itemResolved?.resolvedValue || item}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-xs truncate block max-w-[200px]">
                                {cellVal || <span className="text-muted-foreground">—</span>}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        {vc > 0 ? (
                          <Badge variant="outline" className="text-[10px]">{vc} variants</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Simple</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteRow(ri)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium">Importing products... {importProgress} / {importTotal}</p>
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${importTotal > 0 ? (importProgress / importTotal) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="text-lg font-medium">Import Complete</p>
          <p className="text-sm text-muted-foreground">{importProgress} products processed</p>
          <Button onClick={reset}>Upload Another File</Button>
        </div>
      )}
    </div>
  );
};

export default BulkProductUpload;
