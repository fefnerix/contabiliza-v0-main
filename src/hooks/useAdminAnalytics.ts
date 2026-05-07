import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsState {
  kpis: { mrr: number; arr: number; churnRate: number; nrr: number; arpu: number; ltv: number };
  counts: { activeSubscribers: number; byPlan: Record<string, number>; trialsTotal: number; converted: number };
  planDistribution: Array<{ plan_type: string; count: number; mrr: number }>;
  mrrHistory: Array<{ month: string; mrr: number; count: number }>;
  engagement: { dau: number; mau: number; ratio: number };
}

const initialState: AnalyticsState = {
  kpis: { mrr: 0, arr: 0, churnRate: 0, nrr: 0, arpu: 0, ltv: 0 },
  counts: { activeSubscribers: 0, byPlan: {}, trialsTotal: 0, converted: 0 },
  planDistribution: [],
  mrrHistory: [],
  engagement: { dau: 0, mau: 0, ratio: 0 },
};

export const useAdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [data, setData] = useState<AnalyticsState>(initialState);
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [healthLoading, setHealthLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: raw, error: fnError } = await supabase.functions.invoke("get-analytics", { method: "GET" });
      if (fnError) throw fnError;

      const kpis = raw?.kpis
        ? {
            mrr: Number(raw.kpis.mrr ?? 0),
            arr: Number(raw.kpis.arr ?? 0),
            churnRate: Number(raw.kpis.churnRate ?? 0),
            nrr: Number(raw.kpis.nrr ?? 0),
            arpu: Number(raw.kpis.arpu ?? 0),
            ltv: Number(raw.kpis.ltv ?? 0),
          }
        : {
            mrr: Number(raw?.mrr ?? 0),
            arr: Number(raw?.arr ?? Number(raw?.mrr ?? 0) * 12),
            churnRate: Number(raw?.churn_rate ?? 0),
            nrr: Number(raw?.nrr ?? 0),
            arpu: Number(raw?.arpu ?? 0),
            ltv: Number(raw?.ltv ?? 0),
          };

      const planDistribution = (raw?.planDistribution ?? raw?.subscription_by_plan ?? []).map((p: any) => ({
        plan_type: String(p.plan_type ?? "unknown"),
        count: Number(p.count ?? 0),
        mrr: Number(p.mrr ?? 0),
      }));
      const byPlan = planDistribution.reduce((acc: Record<string, number>, row) => {
        acc[row.plan_type] = row.count;
        return acc;
      }, {});

      const counts = raw?.counts
        ? {
            activeSubscribers: Number(raw.counts.activeSubscribers ?? 0),
            byPlan: raw.counts.byPlan ?? byPlan,
            trialsTotal: Number(raw.counts.trialsTotal ?? 0),
            converted: Number(raw.counts.converted ?? 0),
          }
        : {
            activeSubscribers: planDistribution.reduce((sum, p) => sum + p.count, 0),
            byPlan,
            trialsTotal: Number(raw?.trials_total ?? byPlan.trial ?? 0),
            converted: Number(raw?.trials_converted ?? 0),
          };

      const mrrHistory = (raw?.mrrHistory ?? raw?.mrr_history ?? []).map((r: any) => ({
        month: String(r.month ?? ""),
        mrr: Number(r.mrr ?? 0),
        count: Number(r.count ?? r.subscribers ?? 0),
      }));
      const engagement = raw?.engagement
        ? {
            dau: Number(raw.engagement.dau ?? 0),
            mau: Number(raw.engagement.mau ?? 0),
            ratio: Number(raw.engagement.ratio ?? 0),
          }
        : {
            dau: Number(raw?.dau ?? 0),
            mau: Number(raw?.mau ?? 0),
            ratio: Number(raw?.mau ? (raw.dau / raw.mau) * 100 : 0),
          };

      setData({ kpis, counts, planDistribution, mrrHistory, engagement });
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-health-scores", { method: "GET" });
      if (error) throw error;
      const list = Array.isArray(data) ? data : [];
      setHealthScores(list.sort((a: any, b: any) => Number(a.score ?? 0) - Number(b.score ?? 0)).slice(0, 10));
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchAnalytics();
    fetchHealth();
  }, [fetchAnalytics, fetchHealth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...data,
    healthScores,
    healthLoading,
    loading,
    error,
    lastRefresh,
    fetchAnalytics,
    refresh,
  };
};

