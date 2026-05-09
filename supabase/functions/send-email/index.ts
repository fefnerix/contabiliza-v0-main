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
  const planType = String(data.plan_type ?? "activo");
  const expiryDate = String(data.expiry_date ?? "");
  const days = String(data.days ?? "7");
  const rawUrl = String(data.url ?? data.app_url ?? "");
  const url = rawUrl.replace(/\/$/, "");
  const portalUrl = String(data.portal_url ?? url ?? "").replace(/\/$/, "");
  const loginUrl = url ? `${url}/login` : "";

  switch (template) {
    case "welcome":
      return {
        subject: `¡Bienvenido a ${appName}!`,
        body:
          `Hola ${name}, bienvenido a ${appName}. Estamos felices de tenerte.<br/><br/>` +
          `Comienza a registrar tus ingresos y gastos desde WhatsApp o desde la app.<br/><br/>` +
          (url ? `<a href="${url}">Acceder a la app →</a>` : ""),
      };
    case "access_activated":
      return {
        subject: `✅ Tu acceso está activado — ${appName}`,
        body:
          `Hola ${name}, tu plan <b>${planType}</b> está activo hasta <b>${expiryDate}</b>.<br/><br/>` +
          `Ahora puedes usar todas las funciones de ${appName}.<br/><br/>` +
          (url ? `<a href="${url}">Ir a la app →</a>` : ""),
      };
    case "expiring_7d":
      return {
        subject: `⚠️ Tu plan vence en 7 días — ${appName}`,
        body:
          `Hola ${name}, tu plan vence el <b>${expiryDate}</b>.<br/><br/>` +
          `Renueva ahora para no perder el acceso a tu asistente financiero.<br/><br/>` +
          (loginUrl ? `<a href="${loginUrl}">Renovar plan →</a>` : ""),
      };
    case "expiring_1d":
      return {
        subject: `🚨 Tu plan vence mañana — ${appName}`,
        body:
          `Hola ${name}, tu plan vence mañana.<br/><br/>` +
          `Renueva ahora y sigue organizando tus finanzas.<br/><br/>` +
          (loginUrl ? `<a href="${loginUrl}">Renovar ahora →</a>` : ""),
      };
    case "expired":
      return {
        subject: `Tu acceso ha vencido — ${appName}`,
        body:
          `Hola ${name}, tu plan ha vencido.<br/><br/>` +
          `Reactiva tu cuenta para volver a usar ${appName}.<br/><br/>` +
          (loginUrl ? `<a href="${loginUrl}">Reactivar →</a>` : ""),
      };
    case "payment_retry":
      return {
        subject: `🔄 Reintento de cobro en 3 días — ${appName}`,
        body:
          `Hola ${name}, intentaremos procesar tu pago en 3 días.<br/><br/>` +
          `Si deseas actualizar tu método de pago antes:<br/><br/>` +
          (portalUrl ? `<a href="${portalUrl}">Actualizar pago →</a>` : ""),
      };
    case "winback":
      return {
        subject: `¡Te extrañamos! Vuelve a ${appName}`,
        body:
          `Hola ${name}, notamos que tu acceso venció hace un tiempo.<br/><br/>` +
          `Vuelve y retoma el control de tus finanzas.<br/><br/>` +
          (loginUrl ? `<a href="${loginUrl}">Volver a la app →</a>` : ""),
      };
    case "trial_started":
      return {
        subject: `🎉 Tu prueba gratuita comenzó — ${appName}`,
        body:
          `Hola ${name}, tu período de prueba de <b>${days}</b> días comenzó.<br/><br/>` +
          `Aprovecha al máximo todas las funciones de ${appName}.<br/><br/>` +
          (url ? `<a href="${url}">Ir a la app →</a>` : ""),
      };
    case "payment_failed":
      return {
        subject: `❌ Problema con tu pago — ${appName}`,
        body:
          `Hola ${name}, tuvimos un problema procesando tu pago.<br/><br/>` +
          `Por favor actualiza tu método de pago para continuar.<br/><br/>` +
          (portalUrl ? `<a href="${portalUrl}">Actualizar pago →</a>` : ""),
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
          ${companyName} · Soporte: <a href="mailto:${supportEmail}">${supportEmail}</a>
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
      throw new Error("Plantilla no válida");
    }
    if (!to) {
      throw new Error("El campo 'to' es obligatorio");
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
      throw new Error("RESEND_API_KEY no está configurada");
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
    const message = error instanceof Error ? error.message : "Error al enviar el correo";
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
