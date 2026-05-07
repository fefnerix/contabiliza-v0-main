-- =====================================================
-- SEED INICIAL: poupeja_settings
-- Executar no Supabase SQL Editor APÓS supabase db push
-- ANTES de fazer login pela primeira vez
-- =====================================================

DELETE FROM public.poupeja_settings WHERE category IN ('branding','contact','app','system','pricing','stripe','hotmart','facebook_pixel');

INSERT INTO public.poupeja_settings (category, key, value) VALUES
('branding', 'company_name',    'Contabiliza'),
('branding', 'theme_color',     '#16a34a'),
('branding', 'company_logo_url',''),
('branding', 'favicon_url',     '/favicon.ico'),
('branding', 'support_message', 'Precisa de ajuda? Fale conosco!'),
('branding', 'terms_url',       ''),
('branding', 'logo_alt_text',   'Contabiliza'),
('contact',  'contact_phone',   ''),
('contact',  'contact_email',   ''),
('contact',  'contact_whatsapp',''),
('system',   'app_status',      'active'),
('system',   'app_name',        'Contabiliza'),
('system',   'app_version',     '1.0.0'),
('pricing',  'plan_price_monthly',      '49.90'),
('pricing',  'plan_price_annual',       '39.90'),
('pricing',  'stripe_price_id_monthly', ''),
('pricing',  'stripe_price_id_annual',  ''),
('stripe',   'stripe_secret_key',       ''),
('stripe',   'stripe_publishable_key',  ''),
('stripe',   'stripe_webhook_secret',   ''),
('hotmart',  'hotmart_client_id',           ''),
('hotmart',  'hotmart_client_secret',       ''),
('hotmart',  'hotmart_webhook_secret',      ''),
('hotmart',  'hotmart_product_id',          ''),
('hotmart',  'hotmart_offer_code_monthly',  ''),
('hotmart',  'hotmart_offer_code_annual',   ''),
('facebook_pixel', 'facebook_pixel_id',      ''),
('facebook_pixel', 'facebook_pixel_enabled', 'false')
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;

SELECT category, key,
  CASE WHEN value = '' THEN '⚠️  configurar no admin'
  ELSE '✅ ok' END AS status
FROM public.poupeja_settings
ORDER BY category, key;

