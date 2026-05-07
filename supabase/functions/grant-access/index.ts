import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { alertDiscord } from "../_shared/alert.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verificar se quem chama é admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(jwt);

    if (authError || !user) throw new Error("Unauthorized");

    const { data: isAdmin, error: adminError } = await userClient.rpc("is_admin");
    if (adminError || !isAdmin) throw new Error("Forbidden: admin only");

    const { action, user_id, plan_type, days, notes } = await req.json();

    if (!action || !user_id) throw new Error("action e user_id são obrigatórios");

    const now = new Date();
    const period_start = now.toISOString();
    let period_end: string;
    let status: string;

    if (action === "activate") {
      if (!plan_type) throw new Error("plan_type obrigatório para ativação");

      if (plan_type === "lifetime") {
        period_end = "2099-12-31T23:59:59Z";
        status = "active";
      } else if (plan_type === "trial") {
        const trialDays = days || 7;
        const end = new Date(now);
        end.setDate(end.getDate() + trialDays);
        period_end = end.toISOString();
        status = "trialing";
      } else if (plan_type === "monthly") {
        const end = new Date(now);
        end.setDate(end.getDate() + 30);
        period_end = end.toISOString();
        status = "active";
      } else if (plan_type === "annual") {
        const end = new Date(now);
        end.setFullYear(end.getFullYear() + 1);
        period_end = end.toISOString();
        status = "active";
      } else {
        if (!days) throw new Error("days obrigatório para plan_type custom");
        const end = new Date(now);
        end.setDate(end.getDate() + days);
        period_end = end.toISOString();
        status = "active";
      }

      const { error: upsertError } = await adminClient.from("poupeja_subscriptions").upsert(
        {
          user_id,
          status,
          plan_type,
          source: "manual",
          notes: notes || null,
          activated_by: user.id,
          current_period_start: period_start,
          current_period_end: period_end,
          cancel_at_period_end: false,
        },
        { onConflict: "user_id" },
      );

      if (upsertError) throw upsertError;

      const { data: userProfile } = await adminClient
        .from("poupeja_users")
        .select("name,email")
        .eq("id", user_id)
        .maybeSingle();

      if (userProfile?.email) {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            template: "access_activated",
            to: userProfile.email,
            data: {
              name: userProfile.name || "cliente",
              plan_type,
              expiry_date: new Date(period_end).toLocaleDateString("pt-BR"),
              app_name: "Contabiliza",
            },
          }),
        });
      }
    } else if (action === "revoke") {
      const { error: revokeError } = await adminClient
        .from("poupeja_subscriptions")
        .update({ status: "canceled", cancel_at_period_end: true })
        .eq("user_id", user_id);

      if (revokeError) throw revokeError;
      status = "canceled";
      period_end = now.toISOString();

      await alertDiscord("info", "Acesso Revogado", `user_id: ${user_id}`, {
        performed_by: user.email ?? user.id,
      });
    } else if (action === "extend") {
      if (!days) throw new Error("days obrigatório para extend");

      const { data: current, error: currentError } = await adminClient
        .from("poupeja_subscriptions")
        .select("current_period_end")
        .eq("user_id", user_id)
        .single();

      if (currentError && currentError.code !== "PGRST116") throw currentError;

      const base = current?.current_period_end ? new Date(current.current_period_end) : now;
      const end = new Date(base);
      end.setDate(end.getDate() + days);
      period_end = end.toISOString();

      const { error: extendError } = await adminClient
        .from("poupeja_subscriptions")
        .update({ current_period_end: period_end, status: "active" })
        .eq("user_id", user_id);

      if (extendError) throw extendError;
      status = "extended";
    } else {
      throw new Error("action inválido: use activate | revoke | extend");
    }

    // Log da operação
    const { error: logError } = await adminClient.from("poupeja_access_log").insert({
      user_id,
      action: action === "activate" ? "activated" : action === "revoke" ? "revoked" : "extended",
      plan_type: plan_type || null,
      source: "manual",
      performed_by: user.id,
      notes: notes || null,
      period_start,
      period_end,
    });

    if (logError) throw logError;

    return new Response(JSON.stringify({ success: true, action, user_id, status, period_end }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: message.includes("Unauthorized") ? 401 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

