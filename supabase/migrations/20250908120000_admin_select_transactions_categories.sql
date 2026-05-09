-- Permite que admins consultem todas as transações e categorias (painel operacional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'poupeja_transactions'
      AND policyname = 'Admins read all transactions'
  ) THEN
    CREATE POLICY "Admins read all transactions" ON public.poupeja_transactions
      FOR SELECT USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'poupeja_categories'
      AND policyname = 'Admins read all categories'
  ) THEN
    CREATE POLICY "Admins read all categories" ON public.poupeja_categories
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;
