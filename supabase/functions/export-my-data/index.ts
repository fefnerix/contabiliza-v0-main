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
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [profile, transactions, goals, categories, subscriptions] = await Promise.all([
      adminClient.from("poupeja_users").select("*").eq("id", user.id).maybeSingle(),
      adminClient.from("poupeja_transactions").select("*").eq("user_id", user.id).gte("date", oneYearAgo.toISOString().slice(0, 10)),
      adminClient.from("poupeja_goals").select("*").eq("user_id", user.id),
      adminClient.from("poupeja_categories").select("*").eq("user_id", user.id),
      adminClient.from("poupeja_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (profile.error) throw profile.error;
    if (transactions.error) throw transactions.error;
    if (goals.error) throw goals.error;
    if (categories.error) throw categories.error;
    if (subscriptions.error) throw subscriptions.error;

    return new Response(
      JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          user_id: user.id,
          profile: profile.data,
          transactions_last_12_months: transactions.data ?? [],
          goals: goals.data ?? [],
          custom_categories: categories.data ?? [],
          subscriptions: subscriptions.data ?? [],
        },
        null,
        2,
      ),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: message.includes("Unauthorized") ? 401 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
