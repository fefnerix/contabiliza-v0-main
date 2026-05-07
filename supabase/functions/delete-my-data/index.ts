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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const jwt = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(jwt);
    if (userError || !user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: activeSubscription, error: subscriptionError } = await adminClient
      .from("poupeja_subscriptions")
      .select("id,status,plan_type,current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;
    if (activeSubscription) {
      throw new Error("Você possui assinatura ativa. Cancele antes de excluir sua conta.");
    }

    await adminClient.from("poupeja_transactions").delete().eq("user_id", user.id);
    await adminClient.from("poupeja_goals").delete().eq("user_id", user.id);
    await adminClient.from("poupeja_categories").delete().eq("user_id", user.id).eq("is_default", false);
    await adminClient
      .from("poupeja_subscriptions")
      .update({ status: "canceled", cancel_at_period_end: true, notes: "Conta removida pelo usuário" })
      .eq("user_id", user.id);

    const timestamp = Date.now();
    await adminClient
      .from("poupeja_users")
      .update({
        email: `deleted_${timestamp}@deleted.com`,
        phone: "",
        name: "Usuário Removido",
      })
      .eq("id", user.id);

    await adminClient.from("poupeja_admin_audit").insert({
      admin_id: user.id,
      action: "self_delete_account",
      target_type: "user",
      target_id: user.id,
      details: { source: "delete-my-data" },
      ip_address: req.headers.get("x-forwarded-for") || null,
    });

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteAuthError) throw deleteAuthError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: message.includes("Unauthorized") ? 401 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
