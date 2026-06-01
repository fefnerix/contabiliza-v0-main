-- Perfil financeiro do onboarding (1 registro por usuário)
CREATE TABLE IF NOT EXISTS public.poupeja_financial_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  monthly_income NUMERIC,
  fixed_expenses NUMERIC,
  variable_expenses NUMERIC,
  total_debt NUMERIC,
  monthly_savings NUMERIC,
  goal_12m TEXT,
  goal_amount NUMERIC,
  biggest_challenge TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.poupeja_financial_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own financial profile" ON public.poupeja_financial_profile;
CREATE POLICY "Users manage own financial profile"
  ON public.poupeja_financial_profile
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
