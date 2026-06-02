-- Salvamento atômico do formulário de ativação (transação única, fonte de verdade no Postgres)

CREATE OR REPLACE FUNCTION public.save_activation_form_draft(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.poupeja_activation_forms (
    user_id,
    full_name,
    email,
    phone,
    country,
    currency,
    monthly_income,
    goal_amount,
    total_debt,
    form_data,
    updated_at
  )
  VALUES (
    v_user_id,
    NULLIF(p_payload->>'full_name', ''),
    NULLIF(p_payload->>'email', ''),
    NULLIF(p_payload->>'phone', ''),
    NULLIF(p_payload->>'country', ''),
    NULLIF(p_payload->>'currency', ''),
    NULLIF(p_payload->>'monthly_income', '')::NUMERIC,
    NULLIF(p_payload->>'goal_amount', '')::NUMERIC,
    COALESCE(NULLIF(p_payload->>'total_debt', '')::NUMERIC, 0),
    COALESCE(p_payload->'form_data', '{}'::JSONB),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    country = EXCLUDED.country,
    currency = EXCLUDED.currency,
    monthly_income = EXCLUDED.monthly_income,
    goal_amount = EXCLUDED.goal_amount,
    total_debt = EXCLUDED.total_debt,
    form_data = EXCLUDED.form_data,
    updated_at = NOW()
  WHERE public.poupeja_activation_forms.submitted_at IS NULL;

  RETURN jsonb_build_object('success', true, 'draft', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_activation_form(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_submitted_at TIMESTAMPTZ := NOW();
  v_fp JSONB := COALESCE(p_payload->'financial_profile', '{}'::JSONB);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.poupeja_activation_forms (
    user_id,
    full_name,
    email,
    phone,
    country,
    currency,
    monthly_income,
    goal_amount,
    total_debt,
    form_data,
    submitted_at,
    updated_at
  )
  VALUES (
    v_user_id,
    NULLIF(p_payload->>'full_name', ''),
    NULLIF(p_payload->>'email', ''),
    NULLIF(p_payload->>'phone', ''),
    NULLIF(p_payload->>'country', ''),
    NULLIF(p_payload->>'currency', ''),
    NULLIF(p_payload->>'monthly_income', '')::NUMERIC,
    NULLIF(p_payload->>'goal_amount', '')::NUMERIC,
    COALESCE(NULLIF(p_payload->>'total_debt', '')::NUMERIC, 0),
    COALESCE(p_payload->'form_data', '{}'::JSONB),
    v_submitted_at,
    v_submitted_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    country = EXCLUDED.country,
    currency = EXCLUDED.currency,
    monthly_income = EXCLUDED.monthly_income,
    goal_amount = EXCLUDED.goal_amount,
    total_debt = EXCLUDED.total_debt,
    form_data = EXCLUDED.form_data,
    submitted_at = v_submitted_at,
    updated_at = v_submitted_at;

  UPDATE public.poupeja_users SET
    email = COALESCE(NULLIF(p_payload->>'email', ''), email),
    name = COALESCE(NULLIF(p_payload->>'full_name', ''), name),
    phone = COALESCE(NULLIF(p_payload->>'phone', ''), phone),
    country = COALESCE(NULLIF(p_payload->>'country_code', ''), country),
    currency = COALESCE(NULLIF(p_payload->>'currency_code', ''), currency),
    updated_at = NOW()
  WHERE id = v_user_id;

  INSERT INTO public.poupeja_financial_profile (
    user_id,
    monthly_income,
    fixed_expenses,
    variable_expenses,
    total_debt,
    monthly_savings,
    goal_12m,
    goal_amount,
    biggest_challenge,
    completed_at,
    updated_at
  )
  VALUES (
    v_user_id,
    NULLIF(v_fp->>'monthly_income', '')::NUMERIC,
    NULLIF(v_fp->>'fixed_expenses', '')::NUMERIC,
    NULLIF(v_fp->>'variable_expenses', '')::NUMERIC,
    COALESCE(NULLIF(v_fp->>'total_debt', '')::NUMERIC, 0),
    NULLIF(v_fp->>'monthly_savings', '')::NUMERIC,
    NULLIF(v_fp->>'goal_12m', ''),
    NULLIF(v_fp->>'goal_amount', '')::NUMERIC,
    NULLIF(v_fp->>'biggest_challenge', ''),
    v_submitted_at,
    v_submitted_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_income = EXCLUDED.monthly_income,
    fixed_expenses = EXCLUDED.fixed_expenses,
    variable_expenses = EXCLUDED.variable_expenses,
    total_debt = EXCLUDED.total_debt,
    monthly_savings = EXCLUDED.monthly_savings,
    goal_12m = EXCLUDED.goal_12m,
    goal_amount = EXCLUDED.goal_amount,
    biggest_challenge = EXCLUDED.biggest_challenge,
    completed_at = v_submitted_at,
    updated_at = v_submitted_at;

  RETURN jsonb_build_object(
    'success', true,
    'submitted_at', v_submitted_at,
    'user_id', v_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_activation_form_draft(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_activation_form(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_activation_form_draft(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_activation_form(JSONB) TO authenticated;
