-- =====================================================
-- RPC: buscar_cadastro_por_email_phone
-- Necessário para o agente n8n identificar usuários pelo WhatsApp
-- =====================================================

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
    u.phone = p_phone
    OR u.phone = '+' || p_phone
    OR REGEXP_REPLACE(u.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_cadastro_por_email_phone(TEXT)
  TO authenticated, service_role, anon;

COMMENT ON FUNCTION public.buscar_cadastro_por_email_phone(TEXT)
  IS 'Busca cadastro e assinatura pelo número WhatsApp (usado pelo agente n8n)';

