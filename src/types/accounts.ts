/**
 * Financial account and transaction type definitions
 * Centralized types for ERP accounting
 */

export interface Account {
  id: string;
  name: string;
  description: string | null;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  name: string;
  description?: string | null;
  initial_balance: number;
  is_active?: boolean;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account?: Account;
  to_account?: Account;
  category?: TransactionCategory;
  order_payments?: OrderPaymentLink[];
}

export interface OrderPaymentLink {
  id: string;
  order_id: string;
  amount: number;
  order?: {
    id: string;
    order_number: string;
    total_amount: number;
  };
}

export interface TransactionFilters {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionFormData {
  account_id: string;
  to_account_id?: string | null;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  account_id: string;
  transaction_id: string | null;
  amount: number;
  payment_reference: string | null;
  recorded_at: string;
  recorded_by: string | null;
  created_at: string;
  account?: Account;
  order?: {
    id: string;
    order_number: string;
    total_amount: number;
    paid_amount: number;
  };
}
