import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ServiceStatus = "online" | "offline" | "degraded";

interface ServiceItem {
  name: string;
  status: ServiceStatus;
  checkedAt: string;
  details?: string;
}

export const useAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    newUsersToday: 0,
    activatedToday: 0,
    webhookErrorsToday: 0,
    expiringIn7Days: 0,
    deltas: {
      newUsersToday: 0,
      activatedToday: 0,
      webhookErrorsToday: 0,
      expiringIn7Days: 0,
    },
  });
  const [mrr, setMrr] = useState({ mrr: 0, arr: 0, activeSubscribers: 0 });
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [checkoutToggles, setCheckoutToggles] = useState({
    stripe_enabled: false,
    hotmart_enabled: false,
    generic_enabled: false,
    manual_enabled: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const adminDb = supabase as any;
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        usersTodayRes,
        usersYesterdayRes,
        activatedTodayRes,
        activatedYesterdayRes,
        webhookErrorsRes,
        webhookErrorsYesterdayRes,
        expiringRes,
        expiringYesterdayRes,
        subsRes,
        pricingRes,
        accessLogRes,
        webhookRes,
        latestUsersRes,
        settingsRes,
      ] = await Promise.all([
        adminDb.from("poupeja_users").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`),
        adminDb
          .from("poupeja_users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", `${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}T00:00:00`)
          .lt("created_at", `${today}T00:00:00`),
        adminDb
          .from("poupeja_access_log")
          .select("id", { count: "exact", head: true })
          .eq("action", "activated")
          .gte("created_at", `${today}T00:00:00`),
        adminDb
          .from("poupeja_access_log")
          .select("id", { count: "exact", head: true })
          .eq("action", "activated")
          .gte("created_at", `${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}T00:00:00`)
          .lt("created_at", `${today}T00:00:00`),
        adminDb
          .from("poupeja_webhook_events")
          .select("id", { count: "exact", head: true })
          .not("error", "is", null)
          .gte("created_at", `${today}T00:00:00`),
        adminDb
          .from("poupeja_webhook_events")
          .select("id", { count: "exact", head: true })
          .not("error", "is", null)
          .gte("created_at", `${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}T00:00:00`)
          .lt("created_at", `${today}T00:00:00`),
        adminDb
          .from("poupeja_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .lte("current_period_end", in7),
        adminDb
          .from("poupeja_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .lte("current_period_end", new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()),
        adminDb.from("poupeja_subscriptions").select("plan_type,status,current_period_end").eq("status", "active"),
        adminDb.from("poupeja_settings").select("key,value").eq("category", "pricing"),
        adminDb.from("poupeja_access_log").select("id, action, plan_type, source, created_at").order("created_at", { ascending: false }).limit(10),
        adminDb
          .from("poupeja_webhook_events")
          .select("id, provider, event_type, error, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        adminDb.from("poupeja_users").select("id,email,created_at").order("created_at", { ascending: false }).limit(10),
        adminDb.from("poupeja_settings").select("category,key,value").in("category", ["checkout", "system"]),
      ]);

      const monthPrice = Number((pricingRes.data ?? []).find((x: any) => x.key === "plan_price_monthly")?.value ?? 49.9);
      const annualDisplayMonthly = Number((pricingRes.data ?? []).find((x: any) => x.key === "plan_price_annual")?.value ?? 39.9);
      const activeSubs = (subsRes.data ?? []).filter(
        (s: any) => !s.current_period_end || new Date(s.current_period_end) > new Date() || s.plan_type === "lifetime",
      );
      const mrrValue = activeSubs.reduce((sum: number, sub: any) => {
        if (sub.plan_type === "monthly") return sum + monthPrice;
        if (sub.plan_type === "annual") return sum + annualDisplayMonthly;
        return sum;
      }, 0);

      setKpis({
        newUsersToday: usersTodayRes.count ?? 0,
        activatedToday: activatedTodayRes.count ?? 0,
        webhookErrorsToday: webhookErrorsRes.count ?? 0,
        expiringIn7Days: expiringRes.count ?? 0,
        deltas: {
          newUsersToday: (usersTodayRes.count ?? 0) - (usersYesterdayRes.count ?? 0),
          activatedToday: (activatedTodayRes.count ?? 0) - (activatedYesterdayRes.count ?? 0),
          webhookErrorsToday: (webhookErrorsRes.count ?? 0) - (webhookErrorsYesterdayRes.count ?? 0),
          expiringIn7Days: (expiringRes.count ?? 0) - (expiringYesterdayRes.count ?? 0),
        },
      });
      setMrr({
        mrr: mrrValue,
        arr: mrrValue * 12,
        activeSubscribers: activeSubs.length,
      });

      const settingsMap = new Map((settingsRes.data ?? []).map((s: any) => [`${s.category}.${s.key}`, s.value]));
      setCheckoutToggles({
        stripe_enabled: settingsMap.get("checkout.stripe_enabled") === "true",
        hotmart_enabled: settingsMap.get("checkout.hotmart_enabled") === "true",
        generic_enabled: settingsMap.get("checkout.generic_enabled") === "true",
        manual_enabled: settingsMap.get("checkout.manual_enabled") !== "false",
      });

      const now = new Date().toISOString();
      const serviceChecks: ServiceItem[] = [];

      try {
        const { error } = await adminDb.from("poupeja_settings").select("id").limit(1);
        serviceChecks.push({ name: "Banco de dados", status: error ? "offline" : "online", checkedAt: now });
      } catch {
        serviceChecks.push({ name: "Banco de dados", status: "offline", checkedAt: now });
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-settings`, { method: "POST" });
        serviceChecks.push({ name: "Edge Functions", status: res.ok ? "online" : "offline", checkedAt: now });
      } catch {
        serviceChecks.push({ name: "Edge Functions", status: "offline", checkedAt: now });
      }

      const stripeLast = (webhookRes.data ?? []).find((e: any) => e.provider === "stripe");
      const hotmartLast = (webhookRes.data ?? []).find((e: any) => e.provider === "hotmart");
      serviceChecks.push({ name: "Stripe Webhook", status: stripeLast ? "online" : "degraded", checkedAt: now });
      serviceChecks.push({ name: "Hotmart Webhook", status: hotmartLast ? "online" : "degraded", checkedAt: now });

      const n8nHealth = settingsMap.get("system.n8n_health_url");
      if (n8nHealth) {
        try {
          const res = await fetch(n8nHealth);
          serviceChecks.push({ name: "Agente WhatsApp / n8n", status: res.ok ? "online" : "offline", checkedAt: now });
        } catch {
          serviceChecks.push({ name: "Agente WhatsApp / n8n", status: "offline", checkedAt: now });
        }
      } else {
        serviceChecks.push({ name: "Agente WhatsApp / n8n", status: "degraded", checkedAt: now, details: "URL não configurada" });
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        });
        serviceChecks.push({ name: "PostgREST", status: res.ok ? "online" : "offline", checkedAt: now });
      } catch {
        serviceChecks.push({ name: "PostgREST", status: "offline", checkedAt: now });
      }

      setServices(serviceChecks);

      const mergedActivity = [
        ...(accessLogRes.data ?? []).map((a: any) => ({ type: "access", created_at: a.created_at, data: a })),
        ...(webhookRes.data ?? []).map((w: any) => ({ type: "webhook", created_at: w.created_at, data: w })),
        ...(latestUsersRes.data ?? []).map((u: any) => ({ type: "user", created_at: u.created_at, data: u })),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);
      setRecentActivity(mergedActivity);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCheckoutToggle = useCallback(async (key: "stripe_enabled" | "hotmart_enabled" | "generic_enabled", value: boolean) => {
    const adminDb = supabase as any;
    await adminDb.from("poupeja_settings").upsert(
      {
        category: "checkout",
        key,
        value: value ? "true" : "false",
      },
      { onConflict: "category,key" },
    );
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    const everyMinute = setInterval(refresh, 60 * 1000);
    const every2Min = setInterval(refresh, 120 * 1000);
    return () => {
      clearInterval(everyMinute);
      clearInterval(every2Min);
    };
  }, [refresh]);

  return { loading, kpis, mrr, services, recentActivity, checkoutToggles, refresh, updateCheckoutToggle };
};

