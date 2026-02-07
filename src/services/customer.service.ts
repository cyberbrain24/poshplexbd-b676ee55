/**
 * Customer Service
 * Encapsulates all customer-related database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { Customer, CustomerFilters, CustomerFormData } from "@/types/customers";
import { PAGINATION } from "@/constants";

export interface CustomerListResult {
  data: Customer[];
  count: number;
}

/**
 * Fetch paginated customers with optional filters
 */
export async function fetchCustomers(
  filters: CustomerFilters = {},
  page = 1,
  pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  signal?: AbortSignal
): Promise<CustomerListResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select(`
      *,
      division:divisions(id, name),
      thana:thanas(id, name),
      customer_type:customer_types(id, name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }
  if (filters.customer_type_id) {
    query = query.eq("customer_type_id", filters.customer_type_id);
  }
  if (filters.division_id) {
    query = query.eq("division_id", filters.division_id);
  }

  const { data, error, count } = await query.abortSignal(signal!);

  if (error) throw error;

  return {
    data: (data || []) as unknown as Customer[],
    count: count || 0,
  };
}

/**
 * Fetch single customer by ID
 */
export async function fetchCustomerById(customerId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      *,
      division:divisions(id, name),
      thana:thanas(id, name),
      customer_type:customer_types(id, name)
    `)
    .eq("id", customerId)
    .single();

  if (error) throw error;

  return data as unknown as Customer;
}

/**
 * Find customer by phone number
 */
export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      *,
      division:divisions(id, name),
      thana:thanas(id, name)
    `)
    .eq("phone", phone)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return data as unknown as Customer | null;
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData: CustomerFormData): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert(customerData)
    .select(`
      *,
      division:divisions(id, name),
      thana:thanas(id, name),
      customer_type:customer_types(id, name)
    `)
    .single();

  if (error) throw error;

  return data as unknown as Customer;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: string,
  customerData: Partial<CustomerFormData>
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update(customerData)
    .eq("id", customerId)
    .select(`
      *,
      division:divisions(id, name),
      thana:thanas(id, name),
      customer_type:customer_types(id, name)
    `)
    .single();

  if (error) throw error;

  return data as unknown as Customer;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) throw error;
}

/**
 * Upsert customer (create or update by phone)
 */
export async function upsertCustomerByPhone(customerData: CustomerFormData): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .upsert(customerData, { onConflict: "phone" })
    .select(`
      *,
      division:divisions(id, name),
      thana:thanas(id, name)
    `)
    .single();

  if (error) throw error;

  return data as unknown as Customer;
}

/**
 * Fetch customer orders
 */
export async function fetchCustomerOrders(customerId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, order_status, payment_status, total_amount, created_at,
      items:order_items(id, product_name, quantity, line_total)
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * Fetch customer risk profile
 */
export async function fetchCustomerRiskProfile(customerId: string) {
  const { data, error } = await supabase
    .from("customer_risk_profiles")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return data;
}

/**
 * Fetch divisions (active only for public)
 */
export async function fetchDivisions(includeInactive = false) {
  let query = supabase.from("divisions").select("*").order("name");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

/**
 * Fetch thanas by division (active only for public)
 */
export async function fetchThanas(divisionId?: string, includeInactive = false) {
  let query = supabase.from("thanas").select("*").order("name");

  if (divisionId) {
    query = query.eq("division_id", divisionId);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
}
