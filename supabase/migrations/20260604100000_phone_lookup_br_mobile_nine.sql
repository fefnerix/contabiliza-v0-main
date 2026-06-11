-- Normaliza telefone BR (55 + DDD) com e sem o 9º dígito do celular.
-- WhatsApp/Evolution podem enviar 553288551926 enquanto o cadastro tem 5532988551926.

CREATE OR REPLACE FUNCTION public.phone_lookup_variants(p_input text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d text;
  v text[];
  with_nine text;
  without_nine text;
BEGIN
  d := REGEXP_REPLACE(COALESCE(p_input, ''), '[^0-9]', '', 'g');
  IF d = '' THEN
    RETURN ARRAY[]::text[];
  END IF;

  v := ARRAY[d];

  IF d LIKE '55%' AND length(d) = 12 THEN
    with_nine := substring(d, 1, 4) || '9' || substring(d, 5);
    IF with_nine <> d THEN
      v := v || with_nine;
    END IF;
  ELSIF d LIKE '55%' AND length(d) = 13 AND substring(d, 5, 1) = '9' THEN
    without_nine := substring(d, 1, 4) || substring(d, 6);
    IF without_nine <> d THEN
      v := v || without_nine;
    END IF;
  END IF;

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
      OR u.phone = '+' || REGEXP_REPLACE(COALESCE(p_phone, ''), '[^0-9]', '', 'g')
      OR EXISTS (
        SELECT 1
        FROM unnest(public.phone_lookup_variants(u.phone)) AS stored(v)
        INNER JOIN unnest(public.phone_lookup_variants(p_phone)) AS incoming(v)
          ON stored.v = incoming.v
      )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.phone_lookup_variants(text) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.buscar_cadastro_por_email_phone(text)
  TO authenticated, service_role, anon;

COMMENT ON FUNCTION public.phone_lookup_variants(text)
  IS 'Variantes de dígitos para lookup WhatsApp (BR: com/sem 9 do celular)';

COMMENT ON FUNCTION public.buscar_cadastro_por_email_phone(text)
  IS 'Busca cadastro e assinatura pelo WhatsApp; aceita JID e BR com ou sem 9º dígito';
