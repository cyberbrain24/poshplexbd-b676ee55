CREATE OR REPLACE FUNCTION public.record_order_payment_atomic(
  p_order_id uuid,
  p_amount numeric,
  p_account_id uuid,
  p_payment_reference text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
  v_paid numeric;
  v_remaining numeric;
  v_new_paid numeric;
  v_new_status payment_status;
  v_prev_status text;
  v_transaction_id uuid;
  v_existing uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than 0';
  END IF;

  -- Idempotency guard
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing FROM public.order_payments WHERE idempotency_key = p_idempotency_key LIMIT 1;
    IF v_existing IS NOT NULL THEN
      RAISE EXCEPTION 'This payment has already been recorded';
    END IF;
  END IF;

  -- Lock the order row to avoid concurrent overpayments
  SELECT total_amount, paid_amount
    INTO v_total, v_paid
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_total IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  v_remaining := v_total - COALESCE(v_paid, 0);
  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Payment amount cannot exceed remaining balance of %', v_remaining;
  END IF;

  -- 1. Create income transaction (account balance trigger handles balance update)
  INSERT INTO public.transactions (account_id, type, amount, notes, date)
  VALUES (
    p_account_id,
    'income',
    p_amount,
    'Payment for order - Ref: ' || COALESCE(NULLIF(p_payment_reference, ''), 'N/A'),
    CURRENT_DATE
  )
  RETURNING id INTO v_transaction_id;

  -- 2. Insert order payment record
  INSERT INTO public.order_payments (
    order_id, amount, account_id, transaction_id, payment_reference, idempotency_key
  ) VALUES (
    p_order_id, p_amount, p_account_id, v_transaction_id, NULLIF(p_payment_reference, ''), p_idempotency_key
  );

  -- 3. Update order paid_amount + payment_status
  v_new_paid := COALESCE(v_paid, 0) + p_amount;
  v_new_status := CASE WHEN v_new_paid >= v_total THEN 'paid'::payment_status ELSE 'partially_paid'::payment_status END;
  v_prev_status := CASE WHEN COALESCE(v_paid, 0) > 0 THEN 'partially_paid' ELSE 'unpaid' END;

  UPDATE public.orders
  SET paid_amount = v_new_paid,
      payment_status = v_new_status,
      payment_verified_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE payment_verified_at END
  WHERE id = p_order_id;

  -- 4. Status history
  INSERT INTO public.order_status_history (
    order_id, previous_status, new_status, status_type, notes, metadata
  ) VALUES (
    p_order_id,
    v_prev_status,
    v_new_status::text,
    'payment',
    'Payment of ' || p_amount::text || ' recorded.' || CASE WHEN COALESCE(p_payment_reference,'') <> '' THEN ' Ref: ' || p_payment_reference ELSE '' END,
    jsonb_build_object('amount', p_amount, 'account_id', p_account_id, 'transaction_id', v_transaction_id)
  );

  RETURN jsonb_build_object(
    'new_paid_amount', v_new_paid,
    'new_payment_status', v_new_status,
    'transaction_id', v_transaction_id
  );
END;
$$;