# Product Module - Complete System Documentation

> A complete reference for recreating this product management system in a new project.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [TypeScript Types](#typescript-types)
4. [React Query Hooks](#react-query-hooks)
5. [Admin Components](#admin-components)
6. [Storefront Components](#storefront-components)
7. [Performance Utilities](#performance-utilities)
8. [Implementation Prompts](#implementation-prompts)

---

## Architecture Overview

### System Design
```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCT MODULE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Products   │────▶│   Variants   │────▶│   Inventory  │    │
│  │   (Parent)   │     │ (Color/Size) │     │   (Stock)    │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                                  │
│         ▼                    ▼                                  │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │    Images    │     │ Master Data  │                         │
│  │ (Galleries)  │     │ Colors/Sizes │                         │
│  └──────────────┘     └──────────────┘                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Patterns
- **Simple vs Variable Products**: Simple products have one price/stock; Variable products have multiple variants (color/size/material combinations)
- **Slim-Query Pattern**: List views fetch only essential columns; detail views fetch full relations
- **Server-Side Pagination**: Large datasets paginated at database level
- **Tiered Caching**: Reference data (colors, sizes) cached longer than transactional data
- **Optimistic Cache Invalidation**: React Query invalidates related queries on mutations

---

## Database Schema

### Core Tables

```sql
-- Products Table (Parent)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL DEFAULT 'simple', -- 'simple' | 'variable'
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  short_description TEXT,
  full_description TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  youtube_url TEXT,
  youtube_autoplay BOOLEAN DEFAULT false,
  youtube_mute BOOLEAN DEFAULT true,
  size_guide_id UUID REFERENCES size_guides(id),
  care_instruction_id UUID REFERENCES care_instructions(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Variants (for Variable products)
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_id UUID REFERENCES colors(id),
  size_id UUID REFERENCES sizes(id),
  material_id UUID REFERENCES materials(id),
  sku TEXT NOT NULL UNIQUE,
  purchase_price NUMERIC DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  available_stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Images
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT false,
  color_id UUID REFERENCES colors(id), -- For color-specific images
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories (Hierarchical)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id), -- Self-referencing for hierarchy
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brands / Collections
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Master Data Tables

```sql
-- Colors
CREATE TABLE public.colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hex_code TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sizes
CREATE TABLE public.sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  fit_type TEXT, -- 'regular', 'slim', 'relaxed'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Materials
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gsm TEXT, -- Grams per square meter
  season TEXT, -- 'summer', 'winter', 'all-season'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Size Guides
CREATE TABLE public.size_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML or markdown content
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Care Instructions
CREATE TABLE public.care_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

```sql
-- Products: Public read, Admin write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products" ON products
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE USING (is_admin());

-- Similar policies for all related tables
-- Reference data (colors, sizes, etc.): Public read, Admin write
```

---

## TypeScript Types

```typescript
// src/types/product.ts

export interface Color {
  id: string;
  name: string;
  hex_code: string;
  created_at: string;
  updated_at: string;
}

export interface Size {
  id: string;
  label: string;
  fit_type: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  gsm: string | null;
  season: string | null;
  created_at: string;
  updated_at: string;
}

export interface SizeGuide {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CareInstruction {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  product_type: 'simple' | 'variable';
  category_id: string | null;
  brand_id: string | null;
  short_description: string | null;
  full_description: string | null;
  base_price: number;
  youtube_url: string | null;
  youtube_autoplay: boolean;
  youtube_mute: boolean;
  size_guide_id: string | null;
  care_instruction_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category | null;
  brand?: Brand | null;
  size_guide?: SizeGuide | null;
  care_instruction?: CareInstruction | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_main: boolean;
  color_id: string | null;
  created_at: string;
  color?: Color | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color_id: string | null;
  size_id: string | null;
  material_id: string | null;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  color?: Color | null;
  size?: Size | null;
  material?: Material | null;
}

export interface ProductFormData {
  name: string;
  sku: string;
  product_type: 'simple' | 'variable';
  category_id: string | null;
  brand_id: string | null;
  short_description: string;
  full_description: string;
  base_price: number;
  youtube_url: string;
  youtube_autoplay: boolean;
  youtube_mute: boolean;
  size_guide_id: string | null;
  care_instruction_id: string | null;
  is_active: boolean;
}

export interface VariantFormData {
  id?: string;
  color_id: string | null;
  size_id: string | null;
  material_id: string | null;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  is_active: boolean;
}
```

---

## React Query Hooks

### Products Hook (src/hooks/useProducts.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// SLIM QUERY - For list views (admin table, category pages)
export const useProductsList = () => {
  return useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          product_type,
          base_price,
          is_active,
          created_at,
          category:categories(id, name),
          brand:brands(id, name),
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5,
  });
};

// FULL QUERY - For product detail and edit modal
export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          size_guide:size_guides(*),
          care_instruction:care_instructions(*),
          images:product_images(*, color:colors(*)),
          variants:product_variants(
            *,
            color:colors(*),
            size:sizes(*),
            material:materials(*)
          )
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

// MUTATIONS
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: productData.name,
          sku: productData.sku || undefined,
          product_type: productData.product_type,
          category_id: productData.category_id || null,
          brand_id: productData.brand_id || null,
          short_description: productData.short_description || null,
          full_description: productData.full_description || null,
          base_price: productData.base_price,
          is_active: productData.is_active,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const { data: result, error } = await supabase
        .from("products")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
    },
  });
};

// IMAGE UPLOAD UTILITY
export const uploadProductImage = async (file: File, productId: string): Promise<string> => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5MB limit');
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const fileName = `${productId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
  return data.publicUrl;
};
```

### Master Data Hook (src/hooks/useMasterData.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Cache configuration - master data rarely changes
const MASTER_DATA_STALE_TIME = 1000 * 60 * 5; // 5 minutes
const MASTER_DATA_GC_TIME = 1000 * 60 * 10;   // 10 minutes

// Colors
export const useColors = () => {
  return useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colors")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateColor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (colorData: { name: string; hex_code: string }) => {
      const { data, error } = await supabase
        .from("colors")
        .insert(colorData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colors"] }),
  });
};

// Sizes (with sort_order)
export const useSizes = () => {
  return useQuery({
    queryKey: ["sizes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sizes")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

// Categories (with hierarchy support)
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

// Brands
export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

// Similar patterns for: Materials, SizeGuides, CareInstructions
// Each has: useX, useCreateX, useUpdateX, useDeleteX
```

### Optimized Products Hook (Server-Side Pagination)

```typescript
// src/hooks/useOptimizedProducts.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePagination, useDebounce } from "@/utils/performance";

export const useOptimizedProducts = (
  search?: string,
  categoryId?: string,
  activeOnly = false
) => {
  const pagination = usePagination(50); // 50 items per page
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "products-optimized",
      debouncedSearch,
      categoryId,
      activeOnly,
      pagination.page,
      pagination.pageSize,
    ],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id, name, sku, product_type, base_price, is_active, created_at,
          category:categories(id, name),
          brand:brands(id, name),
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .order("created_at", { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.pageSize - 1);

      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      if (debouncedSearch) {
        const filter = `name.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`;
        query = query.or(filter);
        countQuery = countQuery.or(filter);
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
        countQuery = countQuery.eq("category_id", categoryId);
      }

      if (activeOnly) {
        query = query.eq("is_active", true);
        countQuery = countQuery.eq("is_active", true);
      }

      const [dataResult, countResult] = await Promise.all([query, countQuery]);
      if (dataResult.error) throw dataResult.error;

      return {
        products: dataResult.data,
        totalCount: countResult.count || 0,
      };
    },
  });

  return {
    products: data?.products || [],
    isLoading,
    error,
    pagination,
    totalCount: data?.totalCount || 0,
  };
};
```

---

## Performance Utilities

```typescript
// src/utils/performance.ts

// Debounce hook for search inputs
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Pagination hook for server-side pagination
export function usePagination(initialPageSize = 50, initialPage = 1) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  const offset = (page - 1) * pageSize;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page, pageSize, totalCount, offset, totalPages,
    hasNextPage, hasPrevPage,
    setPage, setPageSize, setTotalCount,
    nextPage: () => hasNextPage && setPage(p => p + 1),
    prevPage: () => hasPrevPage && setPage(p => p - 1),
    reset: () => setPage(1),
    range: {
      from: totalCount === 0 ? 0 : offset + 1,
      to: Math.min(offset + pageSize, totalCount),
    },
  };
}

// Query configuration presets
export const QUERY_CONFIG = {
  referenceData: {
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  },
  listView: {
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  },
  liveData: {
    staleTime: 1000 * 30, // 30 sec
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  },
};
```

---

## Implementation Prompts

Use these prompts to recreate the product module in a new project:

### Prompt 1: Database Schema
```
Create a product management database with Supabase:

1. Products table with:
   - Simple and Variable product types
   - Category and Brand relations
   - Short/Full descriptions
   - YouTube video embed support
   - Size guide and care instruction links

2. Product Variants table with:
   - Color, Size, Material combinations
   - Individual SKUs per variant
   - Purchase and Selling prices
   - Stock tracking

3. Product Images table with:
   - Multiple images per product
   - Main image flag
   - Sort order
   - Color-specific image assignment

4. Master data tables: Colors (with hex), Sizes (with sort order), Materials (with GSM/season), Categories (hierarchical), Brands

5. RLS: Public can read active products, Admins can CRUD all
```

### Prompt 2: React Query Hooks
```
Create React Query hooks for product management:

1. useProductsList - Slim query for list views (id, name, sku, price, main image, category name)
2. useProduct(id) - Full query with all relations for detail/edit views
3. useCreateProduct, useUpdateProduct, useDeleteProduct mutations
4. useAddProductImage, useDeleteProductImage for gallery management
5. useAddProductVariant, useUpdateProductVariant, useDeleteProductVariant for variants
6. uploadProductImage utility for Supabase storage

Key patterns:
- Separate slim vs full queries
- Tiered caching (reference data: 10min, list views: 2min)
- Invalidate related queries on mutations
- File validation before upload (type, size)
```

### Prompt 3: Admin Product Modal
```
Create a tabbed product management modal with:

Tab 1 - Product Info:
- Name, SKU (auto-generate if empty)
- Product Type toggle (Simple/Variable)
- Base Price
- Category and Brand dropdowns
- Short and Full description textareas
- Active toggle

Tab 2 - Media:
- Drag-and-drop image upload
- Image gallery with main image selection
- Delete images
- YouTube video URL with preview
- Autoplay/Mute toggles
- Color-specific image assignment

Tab 3 - Variants (only for Variable products):
- Table with Color/Size/Material dropdowns
- Purchase Price, Selling Price, Stock per variant
- Auto-generate combinations button
- Add/Remove variant rows
- Individual SKU per variant

Tab 4 - Guides:
- Size Guide dropdown with preview
- Care Instructions dropdown with preview

Use slide-in drawer from right, sticky header/footer
```

### Prompt 4: Storefront Product Detail
```
Create a product detail page with:

1. Breadcrumb navigation (Home > Category > Product)
2. Two-column layout:
   - Left: Image gallery with thumbnails
   - Right: Product info (sticky on scroll)
   
3. Product Info section:
   - Product name and price
   - Variant selectors (color swatches, size buttons)
   - Price updates based on selected variant
   - Stock status indicator
   - Add to Cart button
   - Size Guide accordion
   - Care Instructions accordion
   
4. Product Description section below
5. Related products carousel
6. SEO meta tags
```

### Prompt 5: Category/Collection Page
```
Create a category listing page with:

1. Category header with name and item count
2. Filter/Sort bar:
   - Filters panel (colors, sizes, price range)
   - Sort dropdown (newest, price low-high, price high-low)
   
3. Product grid:
   - Responsive grid (4 cols desktop, 2 mobile)
   - Product card with: image, name, price, quick-add
   - Hover effects for image swap
   
4. Server-side pagination for performance
5. URL-based filtering (persist filters in URL)
```

---

## File Structure

```
src/
├── types/
│   └── product.ts              # All product-related types
├── hooks/
│   ├── useProducts.ts          # Product CRUD hooks
│   ├── useMasterData.ts        # Colors, Sizes, etc.
│   └── useOptimizedProducts.ts # Server-side pagination
├── utils/
│   └── performance.ts          # Debounce, pagination utilities
├── pages/
│   ├── ProductDetail.tsx       # Storefront detail page
│   ├── Category.tsx            # Category listing page
│   └── admin/
│       └── AdminProducts.tsx   # Admin product list
├── components/
│   ├── admin/
│   │   └── ProductModal.tsx    # Product create/edit modal
│   ├── product/
│   │   ├── ProductImageGallery.tsx
│   │   ├── ProductInfo.tsx
│   │   ├── ProductDescription.tsx
│   │   └── VariantSelector.tsx
│   └── category/
│       ├── ProductGrid.tsx
│       ├── FilterSortBar.tsx
│       └── Pagination.tsx
```

---

## Storage Setup

```sql
-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND is_admin());
```

---

## Key Features Summary

| Feature | Description |
|---------|-------------|
| Simple/Variable Products | Single-price products vs multi-variant with color/size/material |
| Hierarchical Categories | Parent-child category structure for navigation |
| Color-Specific Images | Assign product images to specific color variants |
| Server-Side Pagination | Handle 10k+ products efficiently |
| Tiered Caching | Reference data cached longer than transactional |
| YouTube Embeds | Product videos with autoplay/mute options |
| Size Guides | Reusable size guide templates |
| Care Instructions | Reusable care instruction templates |
| Stock Management | Per-variant inventory tracking |
| Image Gallery | Multiple images with sort order and main flag |
