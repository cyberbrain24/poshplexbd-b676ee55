import { supabase } from "@/integrations/supabase/client";
import { downloadCSV } from "./csvExport";

export const EXPORT_PRODUCT_HEADERS = [
  "Product Name",
  "SKU",
  "Product Type",
  "Short Description",
  "Description",
  "Base Price",
  "Category",
  "Subcategory",
  "Brand",
  "image url",
  "Variant SKU",
  "Variant Image Url",
  "Variant Price",
  "Variant Size",
  "Variant Color",
];

export async function exportProductsCSV(filename?: string): Promise<number> {
  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from("categories").select("id, name, parent_id"),
    supabase
      .from("products")
      .select(
        `
        id, name, sku, product_type, short_description, full_description, base_price, category_id, brand_id,
        brand:brands(id, name),
        images:product_images(id, image_url, is_main),
        variants:product_variants(id, sku, selling_price, image_url, color:colors(id, name), size:sizes(id, label))
      `
      )
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (productsResult.error) throw productsResult.error;

  const categoryMap = new Map((categoriesResult.data || []).map((c) => [c.id, c]));
  const allProducts = productsResult.data || [];

  const extractFileName = (url: string | null | undefined): string => {
    if (!url) return "";
    try {
      const clean = url.split("?")[0].split("#")[0];
      const parts = clean.split("/");
      return decodeURIComponent(parts[parts.length - 1] || "");
    } catch {
      return url;
    }
  };

  const rows = allProducts.map((product: any) => {
    const category = product.category_id ? categoryMap.get(product.category_id) : null;
    const parentCategory = category?.parent_id ? categoryMap.get(category.parent_id) : null;
    const categoryName = parentCategory?.name || category?.name || "";
    const subcategoryName = parentCategory ? category?.name || "" : "";
    const mainImage =
      product.images?.find((img: any) => img.is_main)?.image_url ||
      product.images?.[0]?.image_url ||
      "";

    return {
      "Product Name": product.name,
      SKU: product.sku,
      "Product Type": product.product_type,
      "Short Description": product.short_description || "",
      Description: product.full_description || "",
      "Base Price": product.base_price,
      Category: categoryName,
      Subcategory: subcategoryName,
      Brand: product.brand?.name || "",
      "image url": extractFileName(mainImage),
      "Variant SKU": product.variants?.map((v: any) => v.sku || "").filter(Boolean).join(", ") || "",
      "Variant Image Url":
        product.variants?.map((v: any) => extractFileName(v.image_url)).filter(Boolean).join(", ") || "",
      "Variant Price": product.variants?.map((v: any) => v.selling_price).join(", ") || "",
      "Variant Size":
        product.variants?.map((v: any) => v.size?.label || "").filter(Boolean).join(", ") || "",
      "Variant Color":
        product.variants?.map((v: any) => v.color?.name || "").filter(Boolean).join(", ") || "",
    };
  });


  downloadCSV(
    filename || `products-${new Date().toISOString().slice(0, 10)}.csv`,
    EXPORT_PRODUCT_HEADERS.map((header) => ({ header, accessor: (row: any) => row[header] })),
    rows
  );

  return rows.length;
}
