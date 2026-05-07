CREATE TABLE IF NOT EXISTS public.poupeja_admin_audit (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id     UUID,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  details      JSONB DEFAULT '{}',
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin   ON public.poupeja_admin_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action  ON public.poupeja_admin_audit(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.poupeja_admin_audit(created_at DESC);

ALTER TABLE public.poupeja_admin_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'poupeja_admin_audit'
      AND policyname = 'Admins leem audit'
  ) THEN
    CREATE POLICY "Admins leem audit" ON public.poupeja_admin_audit
      FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'poupeja_admin_audit'
      AND policyname = 'Service role insere audit'
  ) THEN
    CREATE POLICY "Service role insere audit" ON public.poupeja_admin_audit
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
