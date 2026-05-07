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

    const { action, plan } = await req.json();
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    if (action === "list") {
      const { data, error } = await admin.from("poupeja_plans").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "create") {
      const { data, error } = await admin.from("poupeja_plans").insert(plan).select("*").single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "update") {
      const { data, error } = await admin.from("poupeja_plans").update(plan).eq("id", plan.id).select("*").single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (action === "delete") {
      const { error } = await admin.from("poupeja_plans").delete().eq("id", plan.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Ação inválida");
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
