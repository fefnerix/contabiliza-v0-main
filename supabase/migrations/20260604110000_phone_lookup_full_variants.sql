-- Lookup WhatsApp: variantes BR/LATAM (DDI 55, zero tronco, 9º dígito celular).
-- Canoniza telefone armazenado e corrige cadastro do Lucas Domith.

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT REGEXP_REPLACE(COALESCE(p_input, ''), '[^0-9]', '', 'g');
$$;

-- E.164 sem '+' para BR celular: 55 + DDD(2) + 9 dígitos
CREATE OR REPLACE FUNCTION public.canonical_phone_br(p_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
  nacional text;
  ddd text;
  mobile text;
BEGIN
  d := public.normalize_phone_digits(p_input);
  IF d = '' THEN
    RETURN NULL;
  END IF;

  WHILE d LIKE '0%' AND length(d) > 10 LOOP
    d := substring(d, 2);
  END LOOP;

  IF d LIKE '55%' AND length(d) >= 12 THEN
    nacional := substring(d, 3);
  ELSE
    nacional := d;
  END IF;

  WHILE nacional LIKE '0%' AND length(nacional) > 8 LOOP
    nacional := substring(nacional, 2);
  END LOOP;

  IF length(nacional) < 10 THEN
    RETURN d;
  END IF;

  ddd := substring(nacional, 1, 2);
  mobile := substring(nacional, 3);

  IF length(mobile) = 8 THEN
    mobile := '9' || mobile;
  ELSIF length(mobile) = 9 AND substring(mobile, 1, 1) <> '9' THEN
    mobile := '9' || mobile;
  END IF;

  RETURN '55' || ddd || mobile;
END;
$$;

CREATE OR REPLACE FUNCTION public.phone_lookup_variants(p_input text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
  raw text;
  nacional text;
  ddd text;
  mobile text;
  mobile_with9 text;
  mobile_without9 text;
  v text[] := '{}';
  cand text;
BEGIN
  raw := public.normalize_phone_digits(p_input);
  IF raw = '' THEN
    RETURN ARRAY[]::text[];
  END IF;

  v := v || raw;

  d := raw;
  WHILE d LIKE '0%' AND length(d) > 10 LOOP
    d := substring(d, 2);
    v := v || d;
  END LOOP;

  IF d LIKE '55%' AND length(d) >= 12 THEN
    nacional := substring(d, 3);
    v := v || nacional;
    v := v || ('55' || nacional);
  ELSE
    nacional := d;
    IF length(nacional) >= 10 THEN
      v := v || ('55' || nacional);
    END IF;
  END IF;

  WHILE nacional LIKE '0%' AND length(nacional) > 8 LOOP
    nacional := substring(nacional, 2);
    v := v || nacional;
    v := v || ('0' || nacional);
    v := v || ('55' || nacional);
  END LOOP;

  IF length(nacional) < 10 THEN
    RETURN (
      SELECT COALESCE(array_agg(DISTINCT x), ARRAY[]::text[])
      FROM unnest(v) AS x
      WHERE x IS NOT NULL AND x <> ''
    );
  END IF;

  ddd := substring(nacional, 1, 2);
  mobile := substring(nacional, 3);

  IF length(mobile) = 8 THEN
    mobile_with9 := '9' || mobile;
    mobile_without9 := mobile;
  ELSIF length(mobile) = 9 AND substring(mobile, 1, 1) = '9' THEN
    mobile_with9 := mobile;
    mobile_without9 := substring(mobile, 2);
  ELSE
    mobile_with9 := mobile;
    mobile_without9 := mobile;
  END IF;

  FOREACH cand IN ARRAY ARRAY[
    '55' || ddd || mobile_with9,
    '55' || ddd || mobile_without9,
    ddd || mobile_with9,
    ddd || mobile_without9,
    '0' || ddd || mobile_with9,
    '0' || ddd || mobile_without9,
    ddd || mobile_without9,
    ddd || mobile_with9
  ] LOOP
    IF cand IS NOT NULL AND cand <> '' THEN
      v := v || cand;
    END IF;
  END LOOP;

  RETURN (
    SELECT COALESCE(array_agg(DISTINCT x), ARRAY[]::text[])
    FROM unnest(v) AS x
    WHERE x IS NOT NULL AND x <> ''
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.buscar_cadastro_por_email_phone(p_phone text)
RETURNS TABLE(
  user_id uuid,
  email text,
  phone text,
  subscription_status text,
  plan_type text,
  current_period_end timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email,
    u.phone,
    s.status AS subscription_status,
    s.plan_type,
    s.current_period_end
  FROM public.poupeja_users u
  LEFT JOIN public.poupeja_subscriptions s
    ON u.id = s.user_id AND s.status = 'active'
  WHERE
    u.phone IS NOT NULL
    AND u.phone <> ''
    AND (
      u.phone = p_phone
      OR u.phone = '+' || public.normalize_phone_digits(p_phone)
      OR EXISTS (
        SELECT 1
        FROM unnest(public.phone_lookup_variants(u.phone)) AS stored(v)
        INNER JOIN unnest(public.phone_lookup_variants(p_phone)) AS incoming(v)
          ON stored.v = incoming.v
      )
    );
END;
$$;

-- Canoniza Lucas (e qualquer BR com phone preenchido que difira do canônico)
UPDATE public.poupeja_users
SET
  phone = public.canonical_phone_br(phone),
  updated_at = NOW()
WHERE id = 'c6ca67cc-8b39-491a-b8a1-b98d953d1484'
  AND phone IS NOT NULL;

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'phone', (SELECT phone FROM public.poupeja_users WHERE id = 'c6ca67cc-8b39-491a-b8a1-b98d953d1484'),
  'whatsapp', (SELECT phone FROM public.poupeja_users WHERE id = 'c6ca67cc-8b39-491a-b8a1-b98d953d1484')
)
WHERE id = 'c6ca67cc-8b39-491a-b8a1-b98d953d1484';

UPDATE public.poupeja_activation_forms
SET form_data = jsonb_set(
  COALESCE(form_data, '{}'::jsonb),
  '{whatsapp}',
  to_jsonb((SELECT phone FROM public.poupeja_users WHERE id = 'c6ca67cc-8b39-491a-b8a1-b98d953d1484')),
  true
)
WHERE user_id = 'c6ca67cc-8b39-491a-b8a1-b98d953d1484';

GRANT EXECUTE ON FUNCTION public.normalize_phone_digits(text) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.canonical_phone_br(text) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.phone_lookup_variants(text) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.buscar_cadastro_por_email_phone(text)
  TO authenticated, service_role, anon;

COMMENT ON FUNCTION public.canonical_phone_br(text)
  IS 'Telefone BR canônico E.164 sem +: 55 + DDD + celular com 9';

COMMENT ON FUNCTION public.phone_lookup_variants(text)
  IS 'Variantes para match WhatsApp: DDI, zero tronco, com/sem 9º dígito (BR)';

COMMENT ON FUNCTION public.buscar_cadastro_por_email_phone(text)
  IS 'Busca cadastro/assinatura por WhatsApp com match flexível de variantes';
