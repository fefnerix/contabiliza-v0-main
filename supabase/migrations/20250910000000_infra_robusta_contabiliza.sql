-- =====================================================
-- Sprint 1 — Infra robusta Contabiliza
-- Tabelas: agent_messages, chat_controls, delivery_log, ai_audit
-- (Alinhado ao estado aplicado no projeto Supabase via MCP)
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- poupeja_chat_controls (PK: chat_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_chat_controls (
  chat_id text PRIMARY KEY,
  phone text NOT NULL,
  instance text DEFAULT 'rx-instance'::text,
  status text DEFAULT 'active'::text,
  paused_by text,
  paused_at timestamptz,
  resumed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT poupeja_chat_controls_status_check CHECK (status = ANY (ARRAY['active'::text, 'paused'::text]))
);

-- ---------------------------------------------------------------------------
-- poupeja_delivery_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text,
  message_id text,
  chat_id text,
  phone text,
  instance text,
  reply text,
  status text DEFAULT 'sent'::text,
  attempt integer DEFAULT 0,
  evolution_message_id text,
  status_code integer,
  delivered_at timestamptz DEFAULT now(),
  CONSTRAINT poupeja_delivery_log_status_check CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'rate_limited'::text]))
);

-- ---------------------------------------------------------------------------
-- poupeja_agent_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  message_id text,
  chat_id text NOT NULL,
  phone text NOT NULL,
  instance text DEFAULT 'rx-instance'::text,
  user_id uuid REFERENCES public.poupeja_users(id) ON DELETE SET NULL,
  mensagem_usuario text,
  resposta_agente text,
  intent text,
  risk_level text DEFAULT 'low'::text,
  needs_human boolean DEFAULT false,
  status text DEFAULT 'sent'::text,
  attempt integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT poupeja_agent_messages_event_id_key UNIQUE (event_id),
  CONSTRAINT poupeja_agent_messages_risk_level_check CHECK (risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  CONSTRAINT poupeja_agent_messages_status_check CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'retry'::text, 'dead_letter'::text]))
);

-- ---------------------------------------------------------------------------
-- poupeja_ai_audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_ai_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text,
  message_id text,
  chat_id text,
  phone text,
  instance text,
  user_id uuid REFERENCES public.poupeja_users(id) ON DELETE SET NULL,
  intent text,
  confidence numeric(4,3) DEFAULT 0,
  needs_human boolean DEFAULT false,
  risk_level text DEFAULT 'low'::text,
  next_state text,
  reply text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT poupeja_ai_audit_event_id_key UNIQUE (event_id)
);

-- Índices adicionais (UNIQUE event_id já nas constraints das tabelas)
CREATE INDEX IF NOT EXISTS idx_agent_messages_created ON public.poupeja_agent_messages USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_phone ON public.poupeja_agent_messages USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_agent_messages_user_id ON public.poupeja_agent_messages USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_ai_audit_created ON public.poupeja_ai_audit USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_phone ON public.poupeja_ai_audit USING btree (phone);

CREATE INDEX IF NOT EXISTS idx_delivery_log_created ON public.poupeja_delivery_log USING btree (delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_log_phone ON public.poupeja_delivery_log USING btree (phone);

-- RLS
ALTER TABLE public.poupeja_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_chat_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_ai_audit ENABLE ROW LEVEL SECURITY;

-- Políticas (nomes iguais ao remoto)
DROP POLICY IF EXISTS "Admins leem agent_messages" ON public.poupeja_agent_messages;
DROP POLICY IF EXISTS "Service insere agent_messages" ON public.poupeja_agent_messages;
CREATE POLICY "Admins leem agent_messages" ON public.poupeja_agent_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Service insere agent_messages" ON public.poupeja_agent_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins gerenciam chat_controls" ON public.poupeja_chat_controls;
DROP POLICY IF EXISTS "Service atualiza chat_controls" ON public.poupeja_chat_controls;
DROP POLICY IF EXISTS "Service insere chat_controls" ON public.poupeja_chat_controls;
CREATE POLICY "Admins gerenciam chat_controls" ON public.poupeja_chat_controls USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service atualiza chat_controls" ON public.poupeja_chat_controls FOR UPDATE USING (true);
CREATE POLICY "Service insere chat_controls" ON public.poupeja_chat_controls FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins leem delivery_log" ON public.poupeja_delivery_log;
DROP POLICY IF EXISTS "Service insere delivery_log" ON public.poupeja_delivery_log;
CREATE POLICY "Admins leem delivery_log" ON public.poupeja_delivery_log FOR SELECT USING (public.is_admin());
CREATE POLICY "Service insere delivery_log" ON public.poupeja_delivery_log FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins leem ai_audit" ON public.poupeja_ai_audit;
DROP POLICY IF EXISTS "Service insere ai_audit" ON public.poupeja_ai_audit;
CREATE POLICY "Admins leem ai_audit" ON public.poupeja_ai_audit FOR SELECT USING (public.is_admin());
CREATE POLICY "Service insere ai_audit" ON public.poupeja_ai_audit FOR INSERT WITH CHECK (true);

COMMIT;
