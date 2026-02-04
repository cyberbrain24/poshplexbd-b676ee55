-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction categories table (supports both income and expense with sub-categories)
CREATE TABLE public.transaction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  parent_id UUID REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for accounts
CREATE POLICY "Anyone can view accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert accounts" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete accounts" ON public.accounts FOR DELETE USING (true);

-- RLS policies for transaction_categories
CREATE POLICY "Anyone can view transaction_categories" ON public.transaction_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert transaction_categories" ON public.transaction_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update transaction_categories" ON public.transaction_categories FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete transaction_categories" ON public.transaction_categories FOR DELETE USING (true);

-- RLS policies for transactions
CREATE POLICY "Anyone can view transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete transactions" ON public.transactions FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transaction_categories_updated_at BEFORE UPDATE ON public.transaction_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update account balance after transaction changes
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.accounts 
    SET current_balance = current_balance + CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END
    WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    UPDATE public.accounts 
    SET current_balance = current_balance - CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END
    WHERE id = OLD.account_id;
    -- Apply new transaction
    UPDATE public.accounts 
    SET current_balance = current_balance + CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END
    WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.accounts 
    SET current_balance = current_balance - CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END
    WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update account balance
CREATE TRIGGER update_balance_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();