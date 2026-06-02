import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { flattenActivationFormData } from "@/lib/activationFormLabels";
import { logAdminAudit } from "@/lib/adminAudit";

export interface ActivationFormRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  currency: string | null;
  monthly_income: number | null;
  goal_amount: number | null;
  total_debt: number | null;
  submitted_at: string | null;
  created_at: string | null;
  form_data: Record<string, unknown>;
}

export interface ActivationFormStats {
  total: number;
  today: number;
  last7Days: number;
}

const PAGE_SIZE = 20;

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const downloadBlob = (filename: string, content: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const useAdminActivationForms = () => {
  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState<ActivationFormRow[]>([]);
  const [allForms, setAllForms] = useState<ActivationFormRow[]>([]);
  const [stats, setStats] = useState<ActivationFormStats>({ total: 0, today: 0, last7Days: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ActivationFormRow | null>(null);

  const applySearch = useCallback((items: ActivationFormRow[], q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((row) => {
      const hay = [row.full_name, row.email, row.phone, row.country, row.currency]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, []);

  const fetchStats = useCallback(async () => {
    const adminDb = supabase as any;
    const { start, end } = todayRange();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, todayRes, weekRes] = await Promise.all([
      adminDb.from("poupeja_activation_forms").select("user_id", { count: "exact", head: true }),
      adminDb
        .from("poupeja_activation_forms")
        .select("user_id", { count: "exact", head: true })
        .not("submitted_at", "is", null)
        .gte("submitted_at", start)
        .lte("submitted_at", end),
      adminDb
        .from("poupeja_activation_forms")
        .select("user_id", { count: "exact", head: true })
        .not("submitted_at", "is", null)
        .gte("submitted_at", weekAgo),
    ]);

    setStats({
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      last7Days: weekRes.count ?? 0,
    });
  }, []);

  const fetchForms = useCallback(
    async (overrideSearch?: string, overridePage?: number) => {
      setLoading(true);
      const q = overrideSearch ?? search;
      const currentPage = overridePage ?? page;
      try {
        const adminDb = supabase as any;
        const { data, error } = await adminDb
          .from("poupeja_activation_forms")
          .select(
            "user_id, full_name, email, phone, country, currency, monthly_income, goal_amount, total_debt, submitted_at, created_at, form_data"
          )
          .order("submitted_at", { ascending: false, nullsFirst: false });

        if (error) throw error;

        const mapped: ActivationFormRow[] = (data ?? []).map((row: any) => ({
          ...row,
          form_data: (row.form_data ?? {}) as Record<string, unknown>,
        }));

        setAllForms(mapped);
        const filtered = applySearch(mapped, q);
        setForms(filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE));
        setSearch(q);
        setPage(currentPage);
      } finally {
        setLoading(false);
      }
    },
    [applySearch, page, search]
  );

  const refresh = useCallback(async () => {
    await Promise.all([fetchStats(), fetchForms()]);
  }, [fetchForms, fetchStats]);

  const fetchByUserId = useCallback(async (userId: string): Promise<ActivationFormRow | null> => {
    const adminDb = supabase as any;
    const { data, error } = await adminDb
      .from("poupeja_activation_forms")
      .select(
        "user_id, full_name, email, phone, country, currency, monthly_income, goal_amount, total_debt, submitted_at, created_at, form_data"
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, form_data: (data.form_data ?? {}) as Record<string, unknown> };
  }, []);

  const exportCSV = useCallback(
    async (rows?: ActivationFormRow[]) => {
      const source = rows ?? applySearch(allForms, search);
      const flatRows = source.map((row) => ({
        user_id: row.user_id,
        full_name: row.full_name ?? "",
        email: row.email ?? "",
        phone: row.phone ?? "",
        country: row.country ?? "",
        currency: row.currency ?? "",
        monthly_income: row.monthly_income ?? "",
        goal_amount: row.goal_amount ?? "",
        total_debt: row.total_debt ?? "",
        submitted_at: row.submitted_at ?? "",
        ...flattenActivationFormData(row.form_data),
      }));

      const keys = Array.from(new Set(flatRows.flatMap((r) => Object.keys(r))));
      const header = keys.join(",");
      const body = flatRows.map((row) => keys.map((k) => escapeCsv(String((row as Record<string, string>)[k] ?? ""))).join(","));
      downloadBlob("formularios_activacion.csv", [header, ...body].join("\n"), "text/csv;charset=utf-8;");
      await logAdminAudit({
        action: "activation_forms_export_csv",
        target_type: "activation_forms",
        details: { count: source.length },
      });
    },
    [allForms, applySearch, search]
  );

  const exportJSON = useCallback(
    async (rows?: ActivationFormRow[]) => {
      const source = rows ?? applySearch(allForms, search);
      downloadBlob(
        "formularios_activacion.json",
        JSON.stringify(source, null, 2),
        "application/json;charset=utf-8;"
      );
      await logAdminAudit({
        action: "activation_forms_export_json",
        target_type: "activation_forms",
        details: { count: source.length },
      });
    },
    [allForms, applySearch, search]
  );

  const totalCount = useMemo(() => applySearch(allForms, search).length, [allForms, applySearch, search]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  return {
    forms,
    allForms,
    loading,
    stats,
    search,
    setSearch,
    page,
    setPage,
    selected,
    setSelected,
    fetchForms,
    fetchStats,
    refresh,
    fetchByUserId,
    exportCSV,
    exportJSON,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  };
};
