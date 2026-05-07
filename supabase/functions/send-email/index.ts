import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailTemplate =
  | "welcome"
  | "access_activated"
  | "expiring_7d"
  | "expiring_1d"
  | "expired"
  | "payment_failed"
  | "payment_retry"
  | "winback"
  | "trial_started";

type SettingsMap = Record<string, string>;

const supportedTemplates: EmailTemplate[] = [
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

function getTemplateContent(template: EmailTemplate, data: Record<string, unknown>, appName: string) {
  const name = String(data.name ?? "cliente");
  const planType = String(data.plan_type ?? "ativo");
  const expiryDate = String(data.expiry_date ?? "");
  const days = String(data.days ?? "");
  const url = String(data.url ?? data.app_url ?? "");
  const portalUrl = String(data.portal_url ?? url ?? "");

  switch (template) {
    case "welcome":
      return {
        subject: `Bem-vindo ao ${appName}!`,
        body: `Olá ${name},<br/><br/>Bem-vindo ao ${appName}! Sua conta foi criada com sucesso.<br/>Para começar, acesse o app e registre sua primeira transação.`,
      };
    case "access_activated":
      return {
        subject: "Seu acesso foi ativado",
        body: `Olá ${name},<br/><br/>Seu acesso foi ativado com sucesso.<br/>Plano: <b>${planType}</b><br/>Válido até: <b>${expiryDate}</b>.`,
      };
    case "expiring_7d":
      return {
        subject: "Seu plano está expirando",
        body: `Olá ${name},<br/><br/>Seu plano expira em 7 dias.<br/>Renove agora para manter seu acesso.`,
      };
    case "expiring_1d":
      return {
        subject: "Seu plano expira amanhã",
        body: `Olá ${name},<br/><br/>Seu plano expira amanhã.<br/>Evite interrupção do acesso renovando agora.`,
      };
    case "expired":
      return {
        subject: "Seu acesso expirou",
        body: `Olá ${name},<br/><br/>Seu acesso expirou.<br/>Reative sua assinatura em: <a href="${url}">${url}</a>.`,
      };
    case "payment_retry":
      return {
        subject: "Nova tentativa de cobrança em 3 dias",
        body: `Olá ${name},<br/><br/>Vamos tentar novamente processar seu pagamento em 3 dias.<br/>Atualize seus dados para evitar bloqueio.`,
      };
    case "winback":
      return {
        subject: "Sentimos sua falta",
        body: `Olá ${name},<br/><br/>Sentimos sua falta no ${appName}.<br/>Volte e aproveite uma oferta especial.`,
      };
    case "trial_started":
      return {
        subject: "Seu trial começou",
        body: `Olá ${name},<br/><br/>Seu trial de ${days || "7"} dias começou.<br/>Aproveite para explorar todos os recursos.`,
      };
    case "payment_failed":
      return {
        subject: "Problema no seu pagamento",
        body: `Olá ${name},<br/><br/>Houve um problema com seu pagamento.<br/>Atualize sua forma de pagamento em: <a href="${portalUrl}">${portalUrl}</a>.`,
      };
  }
}

function wrapEmailHtml(
  content: { subject: string; body: string },
  settings: SettingsMap,
  appName: string,
  supportEmail: string,
) {
  const companyName = settings["branding.company_name"] || appName;
  const logo = settings["branding.company_logo_url"] || "";
  const themeColor = settings["branding.theme_color"] || "#16a34a";

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <div style="padding:20px;background:${themeColor};color:#fff;">
          ${logo ? `<img src="${logo}" alt="${companyName}" style="max-height:36px;display:block;margin-bottom:8px;" />` : ""}
          <h1 style="margin:0;font-size:20px;">${content.subject}</h1>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:15px;line-height:1.6;">
          ${content.body}
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
          ${companyName} · suporte: <a href="mailto:${supportEmail}">${supportEmail}</a>
        </div>
      </div>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!serviceRoleKey || token !== serviceRoleKey) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { template, to, to_user_id, data = {} } = await req.json();

    if (!supportedTemplates.includes(template)) {
      throw new Error("Template inválido");
    }
    if (!to) {
      throw new Error("Campo 'to' obrigatório");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: settingsRows, error: settingsError } = await adminClient
      .from("poupeja_settings")
      .select("category,key,value")
      .in("category", ["branding", "contact", "system"]);

    if (settingsError) throw settingsError;

    const settings = (settingsRows ?? []).reduce((acc: SettingsMap, row: { category: string; key: string; value: string }) => {
      acc[`${row.category}.${row.key}`] = row.value ?? "";
      return acc;
    }, {});

    const appName = String(data.app_name ?? settings["system.app_name"] ?? "Contabiliza");
    const supportEmail = settings["contact.contact_email"] || "suporte@contabiliza.com";
    const fromEmail = settings["system.email_from"] || "noreply@seudominio.com";
    const fromName = settings["system.email_from_name"] || appName;
    const apiKey = Deno.env.get("RESEND_API_KEY") ?? settings["system.resend_api_key"] ?? "";

    if (!apiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const resend = new Resend(apiKey);
    const content = getTemplateContent(template, data, appName);
    const html = wrapEmailHtml(content, settings, appName, supportEmail);

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [String(to)],
      subject: content.subject,
      html,
    });

    await adminClient.from("poupeja_email_log").insert({
      to_email: String(to),
      to_user_id: to_user_id ?? null,
      template,
      subject: content.subject,
      status: "sent",
      resend_id: result?.data?.id ?? null,
    });

    return new Response(JSON.stringify({ success: true, resend_id: result?.data?.id ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao enviar email";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
      await adminClient.from("poupeja_email_log").insert({
        to_email: "unknown",
        template: "unknown",
        status: "failed",
        error: message,
      });
    } catch {
      // noop
    }
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
