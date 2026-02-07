/**
 * Account Service
 * Encapsulates all account and transaction-related database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { 
  Account, 
  AccountFormData, 
  Transaction, 
  TransactionFormData,
  TransactionFilters,
  TransactionCategory,
  OrderPayment 
} from "@/types/accounts";
import { PAGINATION } from "@/constants";

export interface TransactionListResult {
  data: Transaction[];
  count: number;
}

// ============================================================
// ACCOUNTS
// ============================================================

/**
 * Fetch all accounts
 */
export async function fetchAccounts(includeInactive = false): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .order("name");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as Account[];
}

/**
 * Fetch single account by ID
 */
export async function fetchAccountById(accountId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (error) throw error;

  return data as Account;
}

/**
 * Create a new account
 */
export async function createAccount(accountData: AccountFormData): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      ...accountData,
      current_balance: accountData.initial_balance,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Account;
}

/**
 * Update an existing account
 */
export async function updateAccount(
  accountId: string,
  accountData: Partial<AccountFormData>
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .update(accountData)
    .eq("id", accountId)
    .select()
    .single();

  if (error) throw error;

  return data as Account;
}

/**
 * Delete an account
 */
export async function deleteAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId);

  if (error) throw error;
}

// ============================================================
// TRANSACTION CATEGORIES
// ============================================================

/**
 * Fetch transaction categories by type
 */
export async function fetchTransactionCategories(
  type?: "income" | "expense"
): Promise<TransactionCategory[]> {
  let query = supabase
    .from("transaction_categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as TransactionCategory[];
}

/**
 * Create transaction category
 */
export async function createTransactionCategory(
  categoryData: { name: string; type: "income" | "expense"; parent_id?: string }
): Promise<TransactionCategory> {
  const { data, error } = await supabase
    .from("transaction_categories")
    .insert(categoryData)
    .select()
    .single();

  if (error) throw error;

  return data as TransactionCategory;
}

/**
 * Update transaction category
 */
export async function updateTransactionCategory(
  categoryId: string,
  categoryData: Partial<{ name: string; is_active: boolean }>
): Promise<TransactionCategory> {
  const { data, error } = await supabase
    .from("transaction_categories")
    .update(categoryData)
    .eq("id", categoryId)
    .select()
    .single();

  if (error) throw error;

  return data as TransactionCategory;
}

/**
 * Delete transaction category
 */
export async function deleteTransactionCategory(categoryId: string): Promise<void> {
  const { error } = await supabase
    .from("transaction_categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw error;
}

// ============================================================
// TRANSACTIONS
// ============================================================

/**
 * Fetch paginated transactions with optional filters
 */
export async function fetchTransactions(
  filters: TransactionFilters = {},
  page = 1,
  pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  signal?: AbortSignal
): Promise<TransactionListResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("transactions")
    .select(`
      *,
      account:accounts(id, name),
      to_account:accounts(id, name),
      category:transaction_categories(id, name, type),
      order_payments(id, order_id, amount, order:orders(id, order_number, total_amount))
    `, { count: "exact" })
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Apply filters
  if (filters.accountId) {
    query = query.or(`account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`);
  }
  if (filters.type) {
    query = query.eq("type", filters.type);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data, error, count } = await query.abortSignal(signal!);

  if (error) throw error;

  return {
    data: (data || []) as unknown as Transaction[],
    count: count || 0,
  };
}

/**
 * Create a new transaction
 */
export async function createTransaction(transactionData: TransactionFormData): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert(transactionData)
    .select(`
      *,
      account:accounts(id, name),
      to_account:accounts(id, name),
      category:transaction_categories(id, name, type)
    `)
    .single();

  if (error) throw error;

  return data as unknown as Transaction;
}

/**
 * Update an existing transaction
 */
export async function updateTransaction(
  transactionId: string,
  transactionData: Partial<TransactionFormData>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .update(transactionData)
    .eq("id", transactionId)
    .select(`
      *,
      account:accounts(id, name),
      to_account:accounts(id, name),
      category:transaction_categories(id, name, type)
    `)
    .single();

  if (error) throw error;

  return data as unknown as Transaction;
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) throw error;
}

// ============================================================
// ORDER PAYMENTS
// ============================================================

/**
 * Fetch payments for an order
 */
export async function fetchOrderPayments(orderId: string): Promise<OrderPayment[]> {
  const { data, error } = await supabase
    .from("order_payments")
    .select(`
      *,
      account:accounts(id, name)
    `)
    .eq("order_id", orderId)
    .order("recorded_at", { ascending: false });

  if (error) throw error;

  return data as unknown as OrderPayment[];
}

/**
 * Record a payment for an order
 */
export async function recordOrderPayment(paymentData: {
  order_id: string;
  account_id: string;
  amount: number;
  payment_reference?: string;
}): Promise<OrderPayment> {
  // Create transaction for the payment
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      account_id: paymentData.account_id,
      type: "income",
      amount: paymentData.amount,
      date: new Date().toISOString().split("T")[0],
      notes: `Order payment: ${paymentData.payment_reference || "N/A"}`,
    })
    .select()
    .single();

  if (txError) throw txError;

  // Create order payment record
  const { data: payment, error: payError } = await supabase
    .from("order_payments")
    .insert({
      ...paymentData,
      transaction_id: transaction.id,
    })
    .select(`
      *,
      account:accounts(id, name)
    `)
    .single();

  if (payError) throw payError;

  // Update order paid amount
  const { data: existingPayments } = await supabase
    .from("order_payments")
    .select("amount")
    .eq("order_id", paymentData.order_id);

  const totalPaid = (existingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

  await supabase
    .from("orders")
    .update({ paid_amount: totalPaid })
    .eq("id", paymentData.order_id);

  return payment as unknown as OrderPayment;
}
