import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { alertDiscord } from "../_shared/alert.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-hotmart-hottok",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const hottok =
    new URL(req.url).searchParams.get("hottok") ||
    req.headers.get("x-hotmart-hottok");

  const { data: tokenSetting } = await supabase
    .from("poupeja_settings")
    .select("value")
    .eq("category", "hotmart")
    .eq("key", "hotmart_webhook_secret")
    .single();

  if (!hottok || !tokenSetting?.value || hottok !== tokenSetting.value) {
    await alertDiscord("warn", "Hotmart Webhook — Token Inválido", 
      `Tentativa com hottok: ${hottok?.slice(0,8)}...`, { ip: req.headers.get("cf-connecting-ip") || "unknown" });
    return new Response(JSON.stringify({ error: "Invalid hottok" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const event_type = payload?.event || "UNKNOWN";
  const external_id =
    payload?.id || payload?.data?.purchase?.transaction || null;

  const { data: enabledSetting } = await supabase
    .from("poupeja_settings")
    .select("value")
    .eq("category", "checkout")
    .eq("key", "hotmart_enabled")
    .single();

  const enabled = enabledSetting?.value === "true";

  const { data: eventLog } = await supabase
    .from("poupeja_webhook_events")
    .insert({ provider: "hotmart", event_type, external_id, payload, processed: false })
    .select()
    .single();

  if (!enabled) {
    await supabase
      .from("poupeja_webhook_events")
      .update({ error: "provider_disabled" })
      .eq("id", eventLog?.id);
    return new Response(
      JSON.stringify({ received: true, processed: false, reason: "hotmart_disabled" }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  try {
    const email = payload?.data?.buyer?.email;
    if (!email) throw new Error("buyer.email ausente no payload");

    const { data: userData } = await supabase.auth.admin.listUsers();
    const authUser = userData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!authUser) throw new Error(`Usuário não encontrado: ${email}`);

    const offer_code = payload?.data?.offer?.code || "";

    const { data: monthlySetting } = await supabase
      .from("poupeja_settings")
      .select("value")
      .eq("category", "hotmart")
      .eq("key", "hotmart_offer_code_monthly")
      .single();

    const { data: annualSetting } = await supabase
      .from("poupeja_settings")
      .select("value")
      .eq("category", "hotmart")
      .eq("key", "hotmart_offer_code_annual")
      .single();

    const plan_type =
      offer_code === annualSetting?.value
        ? "annual"
        : offer_code === monthlySetting?.value
        ? "monthly"
        : "monthly";

    if (["PURCHASE_APPROVED", "PURCHASE_COMPLETE"].includes(event_type)) {
      const end = new Date();
      end.setDate(end.getDate() + (plan_type === "annual" ? 365 : 30));

      await supabase.from("poupeja_subscriptions").upsert(
        {
          user_id: authUser.id,
          status: "active",
          plan_type,
          source: "hotmart",
          current_period_start: new Date().toISOString(),
          current_period_end: end.toISOString(),
          cancel_at_period_end: false,
        },
        { onConflict: "user_id" }
      );

      await supabase.from("poupeja_access_log").insert({
        user_id: authUser.id,
        action: "activated",
        plan_type,
        source: "hotmart",
        period_start: new Date().toISOString(),
        period_end: end.toISOString(),
      });

      await alertDiscord("info", "Hotmart — Compra Aprovada",
        `${email} → plano ${plan_type}`, { event_type, offer_code });

    } else if (
      ["PURCHASE_CANCELED", "PURCHASE_REFUNDED", "SUBSCRIPTION_CANCELLATION"].includes(event_type)
    ) {
      await supabase
        .from("poupeja_subscriptions")
        .update({ status: "canceled", cancel_at_period_end: true })
        .eq("user_id", authUser.id);

      await supabase.from("poupeja_access_log").insert({
        user_id: authUser.id,
        action: "revoked",
        source: "hotmart",
      });

      await alertDiscord("warn", "Hotmart — Assinatura Cancelada",
        `${email} cancelou`, { event_type });
    }

    await supabase
      .from("poupeja_webhook_events")
      .update({ processed: true })
      .eq("id", eventLog?.id);

    return new Response(
      JSON.stringify({ received: true, processed: true, event_type }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    await supabase
      .from("poupeja_webhook_events")
      .update({ error: err.message })
      .eq("id", eventLog?.id);

    await alertDiscord("error", "Hotmart Webhook — Erro de Processamento",
      err.message, { event_type, external_id: external_id || "N/A" });

    return new Response(
      JSON.stringify({ received: true, processed: false, error: err.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
