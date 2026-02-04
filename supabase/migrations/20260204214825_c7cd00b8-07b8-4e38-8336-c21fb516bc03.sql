-- Add to_account_id column for transfer transactions
ALTER TABLE public.transactions 
ADD COLUMN to_account_id uuid REFERENCES public.accounts(id);

-- Update the trigger function to handle transfers
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Handle regular income/expense
    IF NEW.type IN ('income', 'expense') THEN
      UPDATE public.accounts 
      SET current_balance = current_balance + CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END
      WHERE id = NEW.account_id;
    -- Handle transfer: deduct from source, add to destination
    ELSIF NEW.type = 'transfer' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance - NEW.amount
      WHERE id = NEW.account_id;
      
      UPDATE public.accounts 
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.to_account_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.type IN ('income', 'expense') THEN
      UPDATE public.accounts 
      SET current_balance = current_balance - CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance + OLD.amount
      WHERE id = OLD.account_id;
      
      UPDATE public.accounts 
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.to_account_id;
    END IF;
    
    -- Apply new transaction
    IF NEW.type IN ('income', 'expense') THEN
      UPDATE public.accounts 
      SET current_balance = current_balance + CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance - NEW.amount
      WHERE id = NEW.account_id;
      
      UPDATE public.accounts 
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.to_account_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type IN ('income', 'expense') THEN
      UPDATE public.accounts 
      SET current_balance = current_balance - CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance + OLD.amount
      WHERE id = OLD.account_id;
      
      UPDATE public.accounts 
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.to_account_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recreate the trigger (drop if exists first)
DROP TRIGGER IF EXISTS update_balance_on_transaction ON public.transactions;
CREATE TRIGGER update_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_account_balance();