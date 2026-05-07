import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { target, subject, body_html } = await req.json();

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
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    let query = adminClient.from("poupeja_users").select("id,email,name");
    if (target !== "all") {
      const statuses: Record<string, string[]> = {
        active: ["active"],
        expiring: ["active"],
        trial: ["trialing"],
        expired: ["canceled", "expired"],
      };
      const { data: subs } = await adminClient
        .from("poupeja_subscriptions")
        .select("user_id,status,current_period_end")
        .in("status", statuses[target] ?? ["active"]);
      const ids = (subs ?? []).map((s: { user_id: string }) => s.user_id);
      if (ids.length === 0) return new Response(JSON.stringify({ success: true, sent_count: 0, failed_count: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      query = query.in("id", ids);
    }
    const { data: recipients, error: recError } = await query;
    if (recError) throw recError;

    let sent = 0;
    let failed = 0;
    for (const recipient of (recipients ?? []).slice(0, 50)) {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          template: "welcome",
          to: recipient.email,
          to_user_id: recipient.id,
          data: { name: recipient.name ?? "cliente", app_name: "Contabiliza", custom_html: body_html, subject_override: subject },
        }),
      });
      if (res.ok) sent += 1;
      else failed += 1;
    }

    return new Response(JSON.stringify({ success: true, sent_count: sent, failed_count: failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
