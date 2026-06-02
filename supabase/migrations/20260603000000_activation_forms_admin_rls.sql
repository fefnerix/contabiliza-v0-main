-- Admin pode ler formulários de ativação e perfis financeiros (somente SELECT)
DROP POLICY IF EXISTS "Admins read activation forms" ON public.poupeja_activation_forms;
CREATE POLICY "Admins read activation forms"
  ON public.poupeja_activation_forms
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read financial profile" ON public.poupeja_financial_profile;
CREATE POLICY "Admins read financial profile"
  ON public.poupeja_financial_profile
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_activation_forms_submitted_at
  ON public.poupeja_activation_forms (submitted_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_activation_forms_email
  ON public.poupeja_activation_forms (email);
