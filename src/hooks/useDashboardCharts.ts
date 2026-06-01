import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/contexts/AppContext";
import { resolveAppDateRange, toRpcDateString } from "@/utils/dateRange";

export interface SpendingByCategoryRow {
  category_name: string;
  total_amount: number;
  transaction_count: number;
  avg_amount: number;
}

export interface SpendingSummaryRow {
  category_name: string;
  type: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
}

export function useDashboardCharts() {
  const {
    user,
    timeRange,
    customStartDate,
    customEndDate,
    isLoading: appLoading,
  } = useAppContext();

  const [spendingByCategory, setSpendingByCategory] = useState<SpendingByCategoryRow[]>(
    []
  );
  const [summaryData, setSummaryData] = useState<SpendingSummaryRow[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(
    () => resolveAppDateRange(timeRange, customStartDate, customEndDate),
    [timeRange, customStartDate, customEndDate]
  );

  const dateRangeKey = dateRange
    ? `${toRpcDateString(dateRange.start)}_${toRpcDateString(dateRange.end)}`
    : "";

  useEffect(() => {
    if (!user?.id || !dateRange) {
      setSpendingByCategory([]);
      setSummaryData([]);
      return;
    }

    let cancelled = false;

    const fetchCharts = async () => {
      setChartsLoading(true);
      setError(null);

      const p_date_from = toRpcDateString(dateRange.start);
      const p_date_to = toRpcDateString(dateRange.end);

      try {
        const [categoryRes, summaryRes] = await Promise.all([
          supabase.rpc("get_spending_by_category", {
            p_user_id: user.id,
            p_category_name: null,
            p_date_from,
            p_date_to,
            p_type: "expense",
          }),
          supabase.rpc("get_spending_summary", {
            p_user_id: user.id,
            p_date_from,
            p_date_to,
          }),
        ]);

        if (cancelled) return;

        if (categoryRes.error) {
          console.warn("get_spending_by_category:", categoryRes.error);
        }
        if (summaryRes.error) {
          console.warn("get_spending_summary:", summaryRes.error);
        }

        setSpendingByCategory(
          (categoryRes.data ?? []).map((row) => ({
            category_name: row.category_name ?? "Sin categoría",
            total_amount: Number(row.total_amount) || 0,
            transaction_count: Number(row.transaction_count) || 0,
            avg_amount: Number(row.avg_amount) || 0,
          }))
        );

        setSummaryData(
          (summaryRes.data ?? []).map((row) => ({
            category_name: row.category_name ?? "",
            type: row.type ?? "",
            total_amount: Number(row.total_amount) || 0,
            percentage: Number(row.percentage) || 0,
            transaction_count: Number(row.transaction_count) || 0,
          }))
        );

        if (categoryRes.error && summaryRes.error) {
          setError(categoryRes.error.message);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Error desconocido";
          setError(message);
          setSpendingByCategory([]);
          setSummaryData([]);
        }
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    };

    void fetchCharts();

    return () => {
      cancelled = true;
    };
  }, [user?.id, dateRangeKey]);

  return {
    spendingByCategory,
    summaryData,
    isLoading: appLoading || chartsLoading,
    error,
  };
}
