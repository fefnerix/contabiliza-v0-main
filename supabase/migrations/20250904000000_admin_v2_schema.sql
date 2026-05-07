-- =====================================================
-- ADMIN v2: access_log + webhook_events + subscription extras
-- =====================================================

-- Tabela de log de ativações/revogações manuais
CREATE TABLE IF NOT EXISTS public.poupeja_access_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.poupeja_users(id) ON DELETE CASCADE,
  action       TEXT NOT NULL CHECK (action IN ('activated','revoked','extended','expired','trial_started')),
  plan_type    TEXT,
  source       TEXT NOT NULL DEFAULT 'manual',
  performed_by UUID REFERENCES public.poupeja_users(id),
  notes        TEXT,
  period_start TIMESTAMPTZ,
  period_end   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_log_user_id   ON public.poupeja_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_action    ON public.poupeja_access_log(action);
CREATE INDEX IF NOT EXISTS idx_access_log_created   ON public.poupeja_access_log(created_at DESC);

ALTER TABLE public.poupeja_access_log ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'poupeja_access_log'
      AND policyname = 'Admins gerenciam access_log'
  ) THEN
    CREATE POLICY "Admins gerenciam access_log" ON public.poupeja_access_log
      USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- Tabela de eventos de webhook recebidos
CREATE TABLE IF NOT EXISTS public.poupeja_webhook_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider     TEXT NOT NULL CHECK (provider IN ('stripe','hotmart','generic')),
  event_type   TEXT NOT NULL,
  external_id  TEXT,
  payload      JSONB NOT NULL DEFAULT '{}',
  processed    BOOLEAN DEFAULT FALSE,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider  ON public.poupeja_webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.poupeja_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created   ON public.poupeja_webhook_events(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_external_id
  ON public.poupeja_webhook_events(provider, external_id) WHERE external_id IS NOT NULL;

ALTER TABLE public.poupeja_webhook_events ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'poupeja_webhook_events'
      AND policyname = 'Admins gerenciam webhook_events'
  ) THEN
    CREATE POLICY "Admins gerenciam webhook_events" ON public.poupeja_webhook_events
      USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- Campos adicionais em poupeja_subscriptions
ALTER TABLE public.poupeja_subscriptions
  ADD COLUMN IF NOT EXISTS source        TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS notes         TEXT,
  ADD COLUMN IF NOT EXISTS activated_by  UUID REFERENCES public.poupeja_users(id);

-- Settings para controle de checkouts (provider toggles)
INSERT INTO public.poupeja_settings (category, key, value) VALUES
  ('checkout', 'stripe_enabled',    'false'),
  ('checkout', 'hotmart_enabled',   'false'),
  ('checkout', 'generic_enabled',   'false'),
  ('checkout', 'generic_webhook_token', ''),
  ('checkout', 'manual_enabled',    'true'),
  ('system',   'trial_days',        '0'),
  ('system',   'grace_period_days', '0'),
  ('system',   'debug_mode',        'false')
ON CONFLICT (category, key) DO NOTHING;

