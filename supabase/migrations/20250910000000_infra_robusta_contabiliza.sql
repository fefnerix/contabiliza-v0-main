-- =====================================================
-- PRD Técnico — Infraestrutura Robusta Contabiliza
-- FASE 1 — §3.1 (versionamento local = estado aplicado no Supabase)
-- =====================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Tabela: poupeja_agent_messages
-- Log completo de cada conversa do agente.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_agent_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text UNIQUE NOT NULL,
  message_id text,
  chat_id text NOT NULL,
  phone text NOT NULL,
  instance text DEFAULT 'rx-instance',
  user_id uuid REFERENCES public.poupeja_users(id) ON DELETE SET NULL,
  mensagem_usuario text,
  resposta_agente text,
  intent text,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  needs_human boolean DEFAULT false,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'retry', 'dead_letter')),
  attempt integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_phone ON public.poupeja_agent_messages (phone);
CREATE INDEX IF NOT EXISTS idx_agent_messages_user_id ON public.poupeja_agent_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created ON public.poupeja_agent_messages (created_at DESC);

ALTER TABLE public.poupeja_agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem agent_messages" ON public.poupeja_agent_messages;
DROP POLICY IF EXISTS "Service insere agent_messages" ON public.poupeja_agent_messages;
CREATE POLICY "Admins leem agent_messages" ON public.poupeja_agent_messages FOR SELECT USING (is_admin());
CREATE POLICY "Service insere agent_messages" ON public.poupeja_agent_messages FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Tabela: poupeja_chat_controls
-- Controle de pausa do bot por usuário (admin via /admin).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_chat_controls (
  chat_id text PRIMARY KEY,
  phone text NOT NULL,
  instance text DEFAULT 'rx-instance',
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  paused_by text,
  paused_at timestamptz,
  resumed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.poupeja_chat_controls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gerenciam chat_controls" ON public.poupeja_chat_controls;
DROP POLICY IF EXISTS "Service insere chat_controls" ON public.poupeja_chat_controls;
DROP POLICY IF EXISTS "Service atualiza chat_controls" ON public.poupeja_chat_controls;
CREATE POLICY "Admins gerenciam chat_controls" ON public.poupeja_chat_controls FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Service insere chat_controls" ON public.poupeja_chat_controls FOR INSERT WITH CHECK (true);
CREATE POLICY "Service atualiza chat_controls" ON public.poupeja_chat_controls FOR UPDATE USING (true);

-- ---------------------------------------------------------------------------
-- Tabela: poupeja_delivery_log
-- Log de cada tentativa de envio pela Evolution API.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_delivery_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text,
  message_id text,
  chat_id text,
  phone text,
  instance text,
  reply text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'rate_limited')),
  attempt integer DEFAULT 0,
  evolution_message_id text,
  status_code integer,
  delivered_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_log_phone ON public.poupeja_delivery_log (phone);
CREATE INDEX IF NOT EXISTS idx_delivery_log_created ON public.poupeja_delivery_log (delivered_at DESC);

ALTER TABLE public.poupeja_delivery_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem delivery_log" ON public.poupeja_delivery_log;
DROP POLICY IF EXISTS "Service insere delivery_log" ON public.poupeja_delivery_log;
CREATE POLICY "Admins leem delivery_log" ON public.poupeja_delivery_log FOR SELECT USING (is_admin());
CREATE POLICY "Service insere delivery_log" ON public.poupeja_delivery_log FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Tabela: poupeja_ai_audit
-- Log de cada decisão do AI Agent — intent, confidence, resposta.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poupeja_ai_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text UNIQUE,
  message_id text,
  chat_id text,
  phone text,
  instance text,
  user_id uuid REFERENCES public.poupeja_users(id) ON DELETE SET NULL,
  intent text,
  confidence numeric(4, 3) DEFAULT 0,
  needs_human boolean DEFAULT false,
  risk_level text DEFAULT 'low',
  next_state text,
  reply text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_audit_phone ON public.poupeja_ai_audit (phone);
CREATE INDEX IF NOT EXISTS idx_ai_audit_created ON public.poupeja_ai_audit (created_at DESC);

ALTER TABLE public.poupeja_ai_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem ai_audit" ON public.poupeja_ai_audit;
DROP POLICY IF EXISTS "Service insere ai_audit" ON public.poupeja_ai_audit;
CREATE POLICY "Admins leem ai_audit" ON public.poupeja_ai_audit FOR SELECT USING (is_admin());
CREATE POLICY "Service insere ai_audit" ON public.poupeja_ai_audit FOR INSERT WITH CHECK (true);

COMMIT;
