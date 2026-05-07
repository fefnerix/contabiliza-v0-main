import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function scoreCategory(score: number) {
  if (score >= 70) return "healthy";
  if (score >= 40) return "at_risk";
  return "critical";
}

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
    const { data: rows } = await admin
      .from("poupeja_users")
      .select("id,name,email,created_at,poupeja_subscriptions(status,current_period_end)")
      .order("created_at", { ascending: false });

    const now = new Date();
    const result = (rows ?? []).map((u: any) => {
      const sub = u.poupeja_subscriptions?.[0];
      const daysToExpire = sub?.current_period_end ? Math.ceil((new Date(sub.current_period_end).getTime() - now.getTime()) / 86400000) : 0;
      const loginScore = 40;
      const usageScore = 40;
      const goalsScore = 0;
      const expiryScore = daysToExpire > 30 ? 100 : daysToExpire > 7 ? 60 : daysToExpire > 0 ? 20 : 0;
      const score = Math.round(loginScore * 0.35 + usageScore * 0.3 + goalsScore * 0.15 + expiryScore * 0.2);
      return {
        user_id: u.id,
        email: u.email,
        name: u.name,
        score,
        category: scoreCategory(score),
        signals: { login_score: loginScore, usage_score: usageScore, goals_score: goalsScore, expiry_score: expiryScore },
      };
    });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
