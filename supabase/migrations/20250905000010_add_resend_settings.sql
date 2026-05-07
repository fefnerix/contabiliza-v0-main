INSERT INTO public.poupeja_settings (category, key, value) VALUES
  ('system', 'resend_api_key', ''),
  ('system', 'email_from', 'noreply@seudominio.com'),
  ('system', 'email_from_name', 'Contabiliza')
ON CONFLICT (category, key) DO NOTHING;
