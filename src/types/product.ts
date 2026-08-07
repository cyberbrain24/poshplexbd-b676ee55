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

export interface SizeGuide {
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
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  product_type: 'simple' | 'variable';
  category_id: string | null;
  short_description: string | null;
  full_description: string | null;
  base_price: number;
  youtube_url: string | null;
  youtube_autoplay: boolean;
  youtube_mute: boolean;
  size_guide_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  featured_sort_order?: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  size_guide?: SizeGuide | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  thumb_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
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
  sku: string;
  purchase_price: number;
  selling_price: number;
  is_active: boolean;
  image_url: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
  color?: Color | null;
  size?: Size | null;
}

export interface ProductFormData {
  name: string;
  sku: string;
  product_type: 'simple' | 'variable';
  category_id: string | null;
  short_description: string;
  full_description: string;
  base_price: number;
  youtube_url: string;
  youtube_autoplay: boolean;
  youtube_mute: boolean;
  size_guide_id: string | null;
  is_active: boolean;
  is_featured: boolean;
}

export interface VariantFormData {
  id?: string;
  color_id: string | null;
  size_id: string | null;
  sku: string;
  purchase_price: number;
  selling_price: number;
  is_active: boolean;
  image_url: string | null;
}
