import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAudit } from "@/lib/adminAudit";

type TemplateSlug =
  | "welcome"
  | "access_activated"
  | "expiring_7d"
  | "expiring_1d"
  | "expired"
  | "payment_failed"
  | "payment_retry"
  | "winback"
  | "trial_started";

const TEMPLATE_SLUGS: TemplateSlug[] = [
  "welcome",
  "access_activated",
  "expiring_7d",
  "expiring_1d",
  "expired",
  "payment_failed",
  "payment_retry",
  "winback",
  "trial_started",
];

const TEMPLATE_DEFAULTS: Record<TemplateSlug, { subject: string; body: string }> = {
  welcome: {
    subject: "Bem-vindo ao {{app_name}}",
    body: "Olá {{nome}},<br/>Sua conta está pronta. Acesse {{app_url}} para começar.",
  },
  access_activated: {
    subject: "Seu acesso foi ativado",
    body: "Olá {{nome}}, seu plano {{plan_type}} está ativo até {{expiry_date}}.",
  },
  expiring_7d: {
    subject: "Seu plano expira em 7 dias",
    body: "Olá {{nome}}, faltam 7 dias para seu plano expirar.",
  },
  expiring_1d: {
    subject: "Seu plano expira amanhã",
    body: "Olá {{nome}}, seu plano expira amanhã.",
  },
  expired: {
    subject: "Seu acesso expirou",
    body: "Olá {{nome}}, seu acesso expirou. Reative em {{app_url}}.",
  },
  payment_failed: {
    subject: "Falha no pagamento",
    body: "Olá {{nome}}, houve um problema com seu pagamento.",
  },
  payment_retry: {
    subject: "Nova tentativa de cobrança",
    body: "Olá {{nome}}, tentaremos cobrar novamente em breve.",
  },
  winback: {
    subject: "Sentimos sua falta",
    body: "Olá {{nome}}, volte para o {{app_name}} com condições especiais.",
  },
  trial_started: {
    subject: "Seu trial começou",
    body: "Olá {{nome}}, seu trial iniciou e vai até {{expiry_date}}.",
  },
};

export const useAdminCommunications = () => {
  const [emailConfig, setEmailConfig] = useState({ from: "", fromName: "", resendKey: "", configured: false });
  const [templates, setTemplates] = useState<Record<string, { subject: string; body: string }>>({});
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({ search: "", template: "all", status: "all" });

  const loadConfig = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("poupeja_settings")
      .select("category,key,value")
      .in("category", ["system", "email_templates"]);
    const rows = data ?? [];
    const map = new Map(rows.map((r: any) => [`${r.category}.${r.key}`, r.value ?? ""]));
    setEmailConfig({
      from: map.get("system.email_from") ?? "",
      fromName: map.get("system.email_from_name") ?? "",
      resendKey: map.get("system.resend_api_key") ?? "",
      configured: Boolean(map.get("system.resend_api_key")),
    });
    const nextTemplates: Record<string, { subject: string; body: string }> = {};
    for (const slug of TEMPLATE_SLUGS) {
      nextTemplates[slug] = {
        subject: map.get(`email_templates.subject_${slug}`) ?? TEMPLATE_DEFAULTS[slug].subject,
        body: map.get(`email_templates.body_${slug}`) ?? TEMPLATE_DEFAULTS[slug].body,
      };
    }
    setTemplates(nextTemplates);
  }, []);

  const saveEmailConfig = useCallback(async (data: { from: string; fromName: string; resendKey: string }) => {
    const adminDb = supabase as any;
    await adminDb.from("poupeja_settings").upsert(
      [
        { category: "system", key: "email_from", value: data.from },
        { category: "system", key: "email_from_name", value: data.fromName },
        { category: "system", key: "resend_api_key", value: data.resendKey },
      ],
      { onConflict: "category,key" },
    );
    await loadConfig();
  }, [loadConfig]);

  const testEmail = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const email = auth?.user?.email;
    if (!email) throw new Error("Usuário sem email");
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { template: "welcome", to: email, data: { name: auth.user?.user_metadata?.name || "Admin", app_name: "Contabiliza" } },
    });
    if (error) throw error;
    return data;
  }, []);

  const saveTemplate = useCallback(async (slug: string, data: { subject: string; body: string }) => {
    const adminDb = supabase as any;
    await adminDb.from("poupeja_settings").upsert(
      [
        { category: "email_templates", key: `subject_${slug}`, value: data.subject },
        { category: "email_templates", key: `body_${slug}`, value: data.body },
      ],
      { onConflict: "category,key" },
    );
    await loadConfig();
  }, [loadConfig]);

  const sendTestTemplate = useCallback(async (slug: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const email = auth?.user?.email;
    if (!email) throw new Error("Usuário sem email");
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { template: slug, to: email, data: { name: auth.user?.user_metadata?.name || "Admin", app_name: "Contabiliza", app_url: window.location.origin } },
    });
    if (error) throw error;
    return data;
  }, []);

  const resetTemplate = useCallback(async (slug: string) => {
    const d = TEMPLATE_DEFAULTS[slug as TemplateSlug];
    if (!d) return;
    await saveTemplate(slug, d);
  }, [saveTemplate]);

  const estimateAudience = useCallback(async (target: string) => {
    const adminDb = supabase as any;
    if (target === "all") {
      const { count } = await adminDb.from("poupeja_users").select("id", { head: true, count: "exact" });
      return count ?? 0;
    }
    if (target === "active") {
      const { count } = await adminDb.from("poupeja_subscriptions").select("id", { head: true, count: "exact" }).eq("status", "active");
      return count ?? 0;
    }
    if (target === "expiring") {
      const in7 = new Date(Date.now() + 7 * 86400000).toISOString();
      const { count } = await adminDb.from("poupeja_subscriptions").select("id", { head: true, count: "exact" }).eq("status", "active").lte("current_period_end", in7);
      return count ?? 0;
    }
    if (target === "trial") {
      const { count } = await adminDb.from("poupeja_subscriptions").select("id", { head: true, count: "exact" }).eq("status", "trialing");
      return count ?? 0;
    }
    if (target === "expired") {
      const { count } = await adminDb.from("poupeja_subscriptions").select("id", { head: true, count: "exact" }).in("status", ["canceled", "expired"]);
      return count ?? 0;
    }
    return 0;
  }, []);

  const sendBroadcast = useCallback(async (params: { target: string; subject: string; body: string }) => {
    const { data, error } = await supabase.functions.invoke("send-broadcast", {
      body: { target: params.target, subject: params.subject, body_html: params.body },
    });
    if (error) throw error;
    await logAdminAudit({
      action: "broadcast_sent",
      target_type: "communications",
      target_id: params.target,
      details: { subject: params.subject, sent: Number(data?.sent_count ?? 0), failed: Number(data?.failed_count ?? 0) },
    });
    return {
      sent: Number(data?.sent_count ?? 0),
      failed: Number(data?.failed_count ?? 0),
    };
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("poupeja_email_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setEmailHistory(data ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, [loadConfig, loadHistory]);

  return {
    emailConfig,
    saveEmailConfig,
    testEmail,
    templates,
    saveTemplate,
    sendTestTemplate,
    resetTemplate,
    estimateAudience,
    sendBroadcast,
    emailHistory,
    historyLoading,
    historyFilters,
    setHistoryFilters,
    refresh: async () => {
      await Promise.all([loadConfig(), loadHistory()]);
    },
  };
};

