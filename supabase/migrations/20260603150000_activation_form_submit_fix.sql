-- Corrige falhas no submit do formulário de ativação (casts numéricos e rollback total)

CREATE OR REPLACE FUNCTION public.safe_jsonb_numeric(j JSONB, k TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  t TEXT;
BEGIN
  IF j IS NULL OR k IS NULL THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(j -> k) = 'null' THEN
    RETURN NULL;
  END IF;

  t := NULLIF(trim(COALESCE(j ->> k, '')), '');
  IF t IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN t::NUMERIC;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

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
    public.safe_jsonb_numeric(p_payload, 'monthly_income'),
    public.safe_jsonb_numeric(p_payload, 'goal_amount'),
    COALESCE(public.safe_jsonb_numeric(p_payload, 'total_debt'), 0),
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
  v_form_data JSONB := COALESCE(p_payload->'form_data', '{}'::JSONB);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF v_form_data->>'submittedAt' IS NULL THEN
    v_form_data := v_form_data || jsonb_build_object('submittedAt', to_jsonb(v_submitted_at));
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
    public.safe_jsonb_numeric(p_payload, 'monthly_income'),
    public.safe_jsonb_numeric(p_payload, 'goal_amount'),
    COALESCE(public.safe_jsonb_numeric(p_payload, 'total_debt'), 0),
    v_form_data,
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

  BEGIN
    UPDATE public.poupeja_users SET
      email = COALESCE(NULLIF(p_payload->>'email', ''), email),
      name = COALESCE(NULLIF(p_payload->>'full_name', ''), name),
      phone = COALESCE(NULLIF(p_payload->>'phone', ''), phone),
      country = COALESCE(NULLIF(p_payload->>'country_code', ''), country),
      currency = COALESCE(NULLIF(p_payload->>'currency_code', ''), currency),
      updated_at = NOW()
    WHERE id = v_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'submit_activation_form users update: %', SQLERRM;
  END;

  BEGIN
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
      public.safe_jsonb_numeric(v_fp, 'monthly_income'),
      public.safe_jsonb_numeric(v_fp, 'fixed_expenses'),
      public.safe_jsonb_numeric(v_fp, 'variable_expenses'),
      COALESCE(public.safe_jsonb_numeric(v_fp, 'total_debt'), 0),
      public.safe_jsonb_numeric(v_fp, 'monthly_savings'),
      NULLIF(v_fp->>'goal_12m', ''),
      public.safe_jsonb_numeric(v_fp, 'goal_amount'),
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
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'submit_activation_form financial_profile: %', SQLERRM;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'submitted_at', v_submitted_at,
    'user_id', v_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.safe_jsonb_numeric(JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_jsonb_numeric(JSONB, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.save_activation_form_draft(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_activation_form(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_activation_form_draft(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_activation_form(JSONB) TO authenticated;
