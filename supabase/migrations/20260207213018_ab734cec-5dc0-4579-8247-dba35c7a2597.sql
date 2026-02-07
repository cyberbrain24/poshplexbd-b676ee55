-- Update the trigger function to use SECURITY DEFINER so it can bypass RLS
CREATE OR REPLACE FUNCTION public.update_customer_risk_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if there's a customer_id
  IF NEW.customer_id IS NOT NULL THEN
    INSERT INTO public.customer_risk_profiles (customer_id, total_orders, last_order_at)
    VALUES (NEW.customer_id, 1, NOW())
    ON CONFLICT (customer_id) DO UPDATE SET
      total_orders = customer_risk_profiles.total_orders + 1,
      last_order_at = NOW(),
      active_cod_orders = CASE 
        WHEN NEW.payment_method_type = 'cod' AND NEW.order_status = 'pending'
        THEN customer_risk_profiles.active_cod_orders + 1 
        ELSE customer_risk_profiles.active_cod_orders 
      END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$;