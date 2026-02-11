/**
 * Customer-related type definitions
 * Centralized types for CRM functionality
 */

export interface Division {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Thana {
  id: string;
  name: string;
  division_id: string;
  division?: Division;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  show_on_public_page: boolean;
  show_member_since: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoUsage {
  id: string;
  customer_id: string;
  promo_code: string;
  benefit_type: string | null;
  benefit_amount: number | null;
  used_at: string;
  notes: string | null;
  created_at: string;
}

export interface CustomerAccount {
  id: string;
  auth_user_id: string;
  customer_id: string | null;
  phone: string | null;
  email: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  division_id: string | null;
  thana_id: string | null;
  address: string | null;
  gender: 'male' | 'female' | 'other';
  customer_type_id: string | null;
  notes: string | null;
  is_active: boolean;
  birthdate: string | null;
  created_at: string;
  updated_at: string;
  division?: Division;
  thana?: Thana;
  customer_type?: CustomerType;
  promo_usages?: PromoUsage[];
  promo_usage_count?: number;
  customer_account?: CustomerAccount | null;
  has_account?: boolean;
}

export interface CustomerFilters {
  search?: string;
  gender?: string;
  customer_type_id?: string;
  division_id?: string;
  thana_id?: string;
  min_promo_usage?: number;
  max_promo_usage?: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  email?: string | null;
  gender: 'male' | 'female' | 'other';
  birthdate?: string | null;
  address?: string | null;
  division_id?: string | null;
  thana_id?: string | null;
  customer_type_id?: string | null;
  notes?: string | null;
  is_active?: boolean;
}
