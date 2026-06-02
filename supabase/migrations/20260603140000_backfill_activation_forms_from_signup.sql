-- Recupera rascunhos a partir do cadastro para usuários sem formulário salvo.
-- Idempotente: não sobrescreve envios já confirmados (submitted_at preenchido).

INSERT INTO public.poupeja_activation_forms (
  user_id,
  full_name,
  email,
  phone,
  country,
  currency,
  form_data,
  submitted_at,
  created_at,
  updated_at
)
SELECT
  p.id,
  NULLIF(TRIM(p.name), ''),
  p.email,
  NULLIF(TRIM(p.phone), ''),
  p.country,
  p.currency,
  jsonb_build_object(
    'recovered_from_signup', true,
    'recovered_at', NOW(),
    'recovery_note',
    'Datos recuperados del registro. El usuario debe completar el formulario de activación.',
    'fullName', p.name,
    'email', p.email,
    'whatsapp', p.phone,
    'countryCode', p.country,
    'currencyCode', p.currency
  ),
  NULL,
  COALESCE(p.created_at, NOW()),
  NOW()
FROM public.poupeja_users p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.poupeja_activation_forms f
  WHERE f.user_id = p.id
)
AND LOWER(p.email) NOT IN ('admin@admin.com', 'admin@contabiliza.com');
