-- Respostas completas do formulário de ativação (1 registro por usuário)
CREATE TABLE IF NOT EXISTS public.poupeja_activation_forms (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  currency TEXT,
  monthly_income NUMERIC,
  goal_amount NUMERIC,
  total_debt NUMERIC,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.poupeja_activation_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own activation form" ON public.poupeja_activation_forms;
CREATE POLICY "Users manage own activation form"
  ON public.poupeja_activation_forms
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
