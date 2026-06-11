-- Concede 1 ano de assinatura anual ativa no cadastro (MVP acesso gratuito)

CREATE OR REPLACE FUNCTION public.grant_signup_annual_subscription(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_period_end TIMESTAMPTZ := v_now + INTERVAL '1 year';
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.poupeja_subscriptions (
    user_id,
    status,
    plan_type,
    provider,
    source,
    notes,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    'active',
    'annual',
    'manual',
    'signup_promo',
    'Acceso gratuito 1 año — registro MVP',
    v_now,
    v_period_end,
    FALSE,
    v_now,
    v_now
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'whatsapp', '');

  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = NEW.id;

  INSERT INTO public.poupeja_users (id, email, name, phone, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_name, user_phone, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), poupeja_users.name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), poupeja_users.phone),
    updated_at = NOW();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT DO NOTHING;

  PERFORM public.grant_signup_annual_subscription(NEW.id);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    PERFORM public.grant_signup_annual_subscription(NEW.id);
    RETURN NEW;
  WHEN others THEN
    RAISE WARNING '[AUTH_TRIGGER] ERRO: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Usuários já cadastrados sem assinatura (exceto quem já tem registro)
INSERT INTO public.poupeja_subscriptions (
  user_id,
  status,
  plan_type,
  provider,
  source,
  notes,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
)
SELECT
  u.id,
  'active',
  'annual',
  'manual',
  'signup_promo',
  'Acceso gratuito 1 año — backfill registro MVP',
  NOW(),
  NOW() + INTERVAL '1 year',
  FALSE,
  NOW(),
  NOW()
FROM public.poupeja_users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.poupeja_subscriptions s WHERE s.user_id = u.id
)
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = u.id AND r.role = 'admin'::app_role
);

REVOKE ALL ON FUNCTION public.grant_signup_annual_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_signup_annual_subscription(UUID) TO service_role;
