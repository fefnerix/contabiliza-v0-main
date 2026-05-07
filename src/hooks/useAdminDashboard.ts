import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ServiceState = "online" | "warning" | "offline" | "not_configured";
type CheckoutProvider = "stripe" | "hotmart" | "manual" | "generic";

interface ServiceStatus {
  name: string;
  status: ServiceState;
  checkedAt: string;
}

interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
}

const todayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

const yesterdayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

export const useAdminDashboard = () => {
  const [dayStats, setDayStats] = useState({
    newUsers: 0,
    activatedToday: 0,
    webhookErrors: 0,
    expiringSoon: 0,
    deltas: { newUsers: 0, activatedToday: 0, webhookErrors: 0, expiringSoon: 0 },
  });
  const [revenue, setRevenue] = useState({
    mrr: 0,
    arr: 0,
    activeSubscribers: 0,
    byPlan: { monthly: 0, annual: 0, lifetime: 0 },
  });
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [healthSummary, setHealthSummary] = useState({ healthy: 0, atRisk: 0, critical: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [checkoutToggles, setCheckoutToggles] = useState({ stripe: false, hotmart: false, manual: true, generic: false });
  const [loading, setLoading] = useState({
    dayStats: true,
    revenue: true,
    services: true,
    health: true,
    activity: true,
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchDayStats = useCallback(async () => {
    const adminDb = supabase as any;
    const today = todayRange();
    const yesterday = yesterdayRange();
    const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersToday,
      usersYesterday,
      activatedToday,
      activatedYesterday,
      errorsToday,
      errorsYesterday,
      expiringToday,
      expiringYesterday,
    ] = await Promise.all([
      adminDb.from("poupeja_users").select("id", { count: "exact", head: true }).gte("created_at", today.start).lte("created_at", today.end),
      adminDb.from("poupeja_users").select("id", { count: "exact", head: true }).gte("created_at", yesterday.start).lte("created_at", yesterday.end),
      adminDb.from("poupeja_access_log").select("id", { count: "exact", head: true }).eq("action", "activated").gte("created_at", today.start).lte("created_at", today.end),
      adminDb.from("poupeja_access_log").select("id", { count: "exact", head: true }).eq("action", "activated").gte("created_at", yesterday.start).lte("created_at", yesterday.end),
      adminDb.from("poupeja_webhook_events").select("id", { count: "exact", head: true }).not("error", "is", null).gte("created_at", today.start).lte("created_at", today.end),
      adminDb.from("poupeja_webhook_events").select("id", { count: "exact", head: true }).not("error", "is", null).gte("created_at", yesterday.start).lte("created_at", yesterday.end),
      adminDb.from("poupeja_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active").gte("current_period_end", new Date().toISOString()).lte("current_period_end", in7),
      adminDb.from("poupeja_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active").gte("current_period_end", yesterday.start).lte("current_period_end", new Date(yesterday.end).toISOString()),
    ]);

    setDayStats({
      newUsers: usersToday.count ?? 0,
      activatedToday: activatedToday.count ?? 0,
      webhookErrors: errorsToday.count ?? 0,
      expiringSoon: expiringToday.count ?? 0,
      deltas: {
        newUsers: (usersToday.count ?? 0) - (usersYesterday.count ?? 0),
        activatedToday: (activatedToday.count ?? 0) - (activatedYesterday.count ?? 0),
        webhookErrors: (errorsToday.count ?? 0) - (errorsYesterday.count ?? 0),
        expiringSoon: (expiringToday.count ?? 0) - (expiringYesterday.count ?? 0),
      },
    });
  }, []);

  const fetchRevenue = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("get-analytics");
    if (error) throw error;
    const byPlanList = data?.subscription_by_plan ?? [];
    const byPlan = {
      monthly: byPlanList.find((p: any) => p.plan_type === "monthly")?.count ?? 0,
      annual: byPlanList.find((p: any) => p.plan_type === "annual")?.count ?? 0,
      lifetime: byPlanList.find((p: any) => p.plan_type === "lifetime")?.count ?? 0,
    };
    setRevenue({
      mrr: Number(data?.mrr ?? 0),
      arr: Number(data?.arr ?? Number(data?.mrr ?? 0) * 12),
      activeSubscribers: byPlan.monthly + byPlan.annual + byPlan.lifetime,
      byPlan,
    });
  }, []);

  const fetchCheckoutToggles = useCallback(async () => {
    const adminDb = supabase as any;
    const { data } = await adminDb.from("poupeja_settings").select("category,key,value").eq("category", "checkout");
    const map = new Map((data ?? []).map((row: any) => [row.key, row.value]));
    setCheckoutToggles({
      stripe: map.get("stripe_enabled") === "true",
      hotmart: map.get("hotmart_enabled") === "true",
      manual: true,
      generic: map.get("generic_enabled") === "true",
    });
  }, []);

  const checkServices = useCallback(async () => {
    const adminDb = supabase as any;
    const nowIso = new Date().toISOString();
    const checked: ServiceStatus[] = [];

    const dbCheck = await adminDb.from("poupeja_settings").select("key").limit(1);
    checked.push({ name: "Banco", status: dbCheck.error ? "offline" : "online", checkedAt: nowIso });

    try {
      const edge = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-settings`, { method: "POST" });
      checked.push({ name: "Edge Functions", status: edge.ok ? "online" : "offline", checkedAt: nowIso });
    } catch {
      checked.push({ name: "Edge Functions", status: "offline", checkedAt: nowIso });
    }

    const stripeLatest = await adminDb
      .from("poupeja_webhook_events")
      .select("created_at")
      .eq("provider", "stripe")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!stripeLatest.data?.created_at) checked.push({ name: "Stripe", status: "not_configured", checkedAt: nowIso });
    else {
      const hours = (Date.now() - new Date(stripeLatest.data.created_at).getTime()) / 36e5;
      checked.push({ name: "Stripe", status: hours > 24 ? "warning" : "online", checkedAt: nowIso });
    }

    const hotmartLatest = await adminDb
      .from("poupeja_webhook_events")
      .select("created_at")
      .eq("provider", "hotmart")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!hotmartLatest.data?.created_at) checked.push({ name: "Hotmart", status: "not_configured", checkedAt: nowIso });
    else {
      const hours = (Date.now() - new Date(hotmartLatest.data.created_at).getTime()) / 36e5;
      checked.push({ name: "Hotmart", status: hours > 24 ? "warning" : "online", checkedAt: nowIso });
    }

    const n8nSetting = await adminDb
      .from("poupeja_settings")
      .select("value")
      .eq("category", "system")
      .eq("key", "n8n_health_url")
      .maybeSingle();
    if (!n8nSetting.data?.value) checked.push({ name: "WhatsApp / n8n", status: "not_configured", checkedAt: nowIso });
    else {
      try {
        const n8n = await fetch(n8nSetting.data.value);
        checked.push({ name: "WhatsApp / n8n", status: n8n.ok ? "online" : "offline", checkedAt: nowIso });
      } catch {
        checked.push({ name: "WhatsApp / n8n", status: "offline", checkedAt: nowIso });
      }
    }

    try {
      const pg = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      });
      checked.push({ name: "PostgREST", status: pg.ok ? "online" : "offline", checkedAt: nowIso });
    } catch {
      checked.push({ name: "PostgREST", status: "offline", checkedAt: nowIso });
    }

    setServices(checked);
  }, []);

  const fetchHealthSummary = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("get-health-scores");
    if (error) throw error;
    const list = Array.isArray(data) ? data : [];
    setHealthSummary({
      healthy: list.filter((i: any) => i.category === "healthy").length,
      atRisk: list.filter((i: any) => i.category === "at_risk").length,
      critical: list.filter((i: any) => i.category === "critical").length,
    });
  }, []);

  const fetchActivity = useCallback(async () => {
    const adminDb = supabase as any;
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const [access, webhookErr, users, webhookOk] = await Promise.all([
      adminDb.from("poupeja_access_log").select("id,plan_type,source,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
      adminDb.from("poupeja_webhook_events").select("id,provider,error,created_at").not("error", "is", null).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
      adminDb.from("poupeja_users").select("id,email,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(20),
      adminDb.from("poupeja_webhook_events").select("id,provider,created_at").eq("processed", true).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
    ]);

    const items: ActivityItem[] = [
      ...(access.data ?? []).map((a: any) => ({
        id: `a-${a.id}`,
        message: `✅ plano ${a.plan_type ?? "n/a"} ativado (${a.source ?? "manual"})`,
        timestamp: a.created_at,
      })),
      ...(webhookErr.data ?? []).map((w: any) => ({
        id: `we-${w.id}`,
        message: `❌ Webhook ${w.provider}: ${String(w.error ?? "").slice(0, 80)}`,
        timestamp: w.created_at,
      })),
      ...(users.data ?? []).map((u: any) => ({
        id: `u-${u.id}`,
        message: `👤 ${u.email} se cadastrou`,
        timestamp: u.created_at,
      })),
      ...(webhookOk.data ?? []).map((w: any) => ({
        id: `wo-${w.id}`,
        message: `💳 Pagamento ${w.provider} OK`,
        timestamp: w.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
    setActivity(items);
  }, []);

  const refresh = useCallback(async () => {
    setLoading({ dayStats: true, revenue: true, services: true, health: true, activity: true });
    await Promise.all([
      fetchDayStats().finally(() => setLoading((prev) => ({ ...prev, dayStats: false }))),
      fetchRevenue().finally(() => setLoading((prev) => ({ ...prev, revenue: false }))),
      checkServices().finally(() => setLoading((prev) => ({ ...prev, services: false }))),
      fetchHealthSummary().finally(() => setLoading((prev) => ({ ...prev, health: false }))),
      fetchActivity().finally(() => setLoading((prev) => ({ ...prev, activity: false }))),
      fetchCheckoutToggles(),
    ]);
    setLastRefresh(new Date());
  }, [checkServices, fetchActivity, fetchCheckoutToggles, fetchDayStats, fetchHealthSummary, fetchRevenue]);

  const toggleCheckout = useCallback(
    async (provider: CheckoutProvider, enabled: boolean) => {
      if (provider === "manual") return;
      const key = `${provider}_enabled`;
      const adminDb = supabase as any;
      await adminDb
        .from("poupeja_settings")
        .upsert({ category: "checkout", key, value: enabled ? "true" : "false" }, { onConflict: "category,key" });
      await fetchCheckoutToggles();
    },
    [fetchCheckoutToggles],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const servicesTimer = setInterval(checkServices, 120000);
    return () => clearInterval(servicesTimer);
  }, [checkServices]);

  useEffect(() => {
    const activityTimer = setInterval(fetchActivity, 60000);
    return () => clearInterval(activityTimer);
  }, [fetchActivity]);

  return {
    dayStats,
    revenue,
    services,
    healthSummary,
    activity,
    checkoutToggles,
    loading,
    lastRefresh,
    refresh,
    checkServices,
    toggleCheckout,
  };
};

