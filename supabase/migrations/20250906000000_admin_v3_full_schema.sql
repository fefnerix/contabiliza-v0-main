-- Admin v3 full schema

CREATE TABLE IF NOT EXISTS public.poupeja_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC(10,2),
  price_annual NUMERIC(10,2),
  duration_days INTEGER DEFAULT 30,
  trial_days INTEGER DEFAULT 0,
  max_transactions INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  hotmart_offer_code_monthly TEXT,
  hotmart_offer_code_annual TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poupeja_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_pct INTEGER CHECK (discount_pct BETWEEN 1 AND 100),
  discount_days INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.poupeja_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poupeja_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES public.poupeja_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poupeja_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','warning','critical','success')),
  target TEXT DEFAULT 'all' CHECK (target IN ('all','active','expiring','trial','expired')),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.poupeja_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poupeja_email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_user_id UUID REFERENCES public.poupeja_users(id),
  template TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','pending')),
  error TEXT,
  resend_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.poupeja_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','investigating','resolved')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  description TEXT,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.poupeja_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.poupeja_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_incidents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poupeja_plans' AND policyname='Admins manage plans') THEN
    CREATE POLICY "Admins manage plans" ON public.poupeja_plans USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poupeja_coupons' AND policyname='Admins manage coupons') THEN
    CREATE POLICY "Admins manage coupons" ON public.poupeja_coupons USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poupeja_content' AND policyname='Admins manage content') THEN
    CREATE POLICY "Admins manage content" ON public.poupeja_content USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poupeja_announcements' AND policyname='Admins manage announcements') THEN
    CREATE POLICY "Admins manage announcements" ON public.poupeja_announcements USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poupeja_email_log' AND policyname='Admins read email log') THEN
    CREATE POLICY "Admins read email log" ON public.poupeja_email_log FOR SELECT USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poupeja_email_log' AND policyname='Service inserts email log') THEN
    CREATE POLICY "Service inserts email log" ON public.poupeja_email_log FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='poupeja_incidents' AND policyname='Admins manage incidents') THEN
    CREATE POLICY "Admins manage incidents" ON public.poupeja_incidents USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

INSERT INTO public.poupeja_settings (category, key, value) VALUES
('system', 'maintenance_mode',    'false'),
('system', 'maintenance_message', 'Estamos em manutenção. Voltamos em breve.'),
('system', 'global_announcement',         ''),
('system', 'global_announcement_type',    'info'),
('system', 'global_announcement_enabled', 'false'),
('system', 'resend_api_key',   ''),
('system', 'email_from',       ''),
('system', 'email_from_name',  'Contabiliza'),
('system', 'discord_webhook_url', ''),
('system', 'sentry_dsn',          ''),
('system', 'data_retention_days', '730')
ON CONFLICT (category, key) DO NOTHING;
