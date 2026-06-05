export interface ProductAttribute {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  values?: ProductAttributeValue[];
}

export interface ProductAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAppliedAttribute {
  id: string;
  product_id: string;
  attribute_id: string;
  sort_order: number;
}
