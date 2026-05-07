-- Migration: Public Marketing Settings RLS
-- Permite que usuários não autenticados leiam configurações de marketing

CREATE POLICY "Public can view marketing settings" ON public.poupeja_settings
  FOR SELECT USING (category = 'marketing');
