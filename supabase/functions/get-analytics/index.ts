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
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: subs } = await admin.from("poupeja_subscriptions").select("status,plan_type,current_period_end,created_at");
    const active = (subs ?? []).filter((s: any) => s.status === "active" || s.status === "trialing");
    const monthly = active.filter((s: any) => s.plan_type === "monthly").length;
    const annual = active.filter((s: any) => s.plan_type === "annual").length;
    const lifetime = active.filter((s: any) => s.plan_type === "lifetime").length;
    const trial = active.filter((s: any) => s.plan_type === "trial").length;
    const mrr = monthly * 49.9 + annual * 39.9 + lifetime * 0 + trial * 0;
    const arr = mrr * 12;
    const paying = monthly + annual + lifetime;
    const canceledMonth = (subs ?? []).filter((s: any) => s.status === "canceled").length;
    const churnRate = paying > 0 ? (canceledMonth / paying) * 100 : 0;
    const arpu = paying > 0 ? mrr / paying : 0;
    const ltv = churnRate > 0 ? arpu / (churnRate / 100) : 0;

    return new Response(
      JSON.stringify({
        success: true,
        mrr,
        arr,
        churn_rate: churnRate,
        nrr: 100,
        arpu,
        ltv,
        trial_conversion_rate: 0,
        dau: 0,
        mau: 0,
        mrr_history: [],
        cohort_retention: [],
        subscription_by_plan: [
          { plan_type: "monthly", count: monthly, mrr: monthly * 49.9 },
          { plan_type: "annual", count: annual, mrr: annual * 39.9 },
          { plan_type: "lifetime", count: lifetime, mrr: 0 },
          { plan_type: "trial", count: trial, mrr: 0 },
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
