import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAudit } from "@/lib/adminAudit";

export type CustomerStatus = "active" | "expiring" | "expired" | "trial" | "no_access";
export type HealthCategory = "healthy" | "at_risk" | "critical";
export type HealthFilter = "all" | HealthCategory;
export type PlanFilter = "all" | "monthly" | "annual" | "lifetime" | "trial";

export interface AdminCustomer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string | null;
  plan_type: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  source: string | null;
  activated_by: string | null;
  last_sign_in_at: string | null;
}

export interface AccessLogItem {
  id: string;
  action: string;
  plan_type: string | null;
  source: string | null;
  notes: string | null;
  created_at: string | null;
  period_start: string | null;
  period_end: string | null;
  performed_by: string | null;
}

const PAGE_SIZE = 20;
const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase();

export const getCustomerStatus = (customer: AdminCustomer): CustomerStatus => {
  if (!customer.subscription_status) return "no_access";
  if (customer.subscription_status === "trialing") return "trial";
  if (!customer.current_period_end) return "no_access";
  const now = new Date();
  const end = new Date(customer.current_period_end);
  if (end < now || customer.subscription_status === "canceled" || customer.subscription_status === "expired") return "expired";
  const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (days <= 7) return "expiring";
  return "active";
};

export const getHealthScore = (customer: AdminCustomer) => {
  const now = new Date();
  const loginDate = customer.last_sign_in_at ? new Date(customer.last_sign_in_at) : null;
  const loginDays = loginDate ? Math.floor((now.getTime() - loginDate.getTime()) / 86400000) : 999;
  const loginScore = loginDays < 7 ? 100 : loginDays < 14 ? 70 : loginDays < 30 ? 40 : 0;

  let expiryScore = 0;
  if (customer.current_period_end) {
    const d = Math.ceil((new Date(customer.current_period_end).getTime() - now.getTime()) / 86400000);
    expiryScore = d > 30 ? 100 : d > 7 ? 60 : d > 0 ? 20 : 0;
  }
  const statusScore = customer.subscription_status === "active" ? 70 : customer.subscription_status === "trialing" ? 50 : 0;
  const score = Math.round(loginScore * 0.35 + expiryScore * 0.3 + statusScore * 0.35);
  const category: HealthCategory = score >= 70 ? "healthy" : score >= 40 ? "at_risk" : "critical";
  return { score, category };
};

export const useAdminCustomers = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminCustomer | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | CustomerStatus,
    health: "all" as HealthFilter,
    plan: "all" as PlanFilter,
  });

  const applyFilters = useCallback((items: AdminCustomer[], currentFilters = filters) => {
    return items.filter((customer) => {
      const q = normalize(currentFilters.search);
      const textMatch = !q || normalize(customer.email).includes(q) || normalize(customer.name).includes(q) || normalize(customer.phone).includes(q);
      if (!textMatch) return false;
      if (currentFilters.status !== "all" && getCustomerStatus(customer) !== currentFilters.status) return false;
      if (currentFilters.plan !== "all" && (customer.plan_type ?? "") !== currentFilters.plan) return false;
      if (currentFilters.health !== "all" && getHealthScore(customer).category !== currentFilters.health) return false;
      return true;
    });
  }, [filters]);

  const fetchCustomers = useCallback(async (overrideFilters?: Partial<typeof filters>, overridePage?: number) => {
    setLoading(true);
    const currentFilters = { ...filters, ...overrideFilters };
    const currentPage = overridePage ?? page;
    try {
      const adminDb = supabase as any;
      let usersQuery = adminDb
        .from("poupeja_users")
        .select("id, name, email, phone, created_at, poupeja_subscriptions(status, plan_type, current_period_end, source, activated_by)");
      if (currentFilters.search) {
        usersQuery = usersQuery.or(`email.ilike.%${currentFilters.search}%,name.ilike.%${currentFilters.search}%,phone.ilike.%${currentFilters.search}%`);
      }
      const { data: users, error } = await usersQuery.order("created_at", { ascending: false });
      if (error) throw error;

      const merged: AdminCustomer[] = await Promise.all((users ?? []).map(async (user: any) => {
        const sub = user.poupeja_subscriptions?.[0];
        let lastSignInAt: string | null = null;
        try {
          const adminAuth = (supabase as any).auth?.admin;
          if (adminAuth?.getUserById) {
            const authRes = await adminAuth.getUserById(user.id);
            lastSignInAt = authRes?.data?.user?.last_sign_in_at ?? null;
          }
        } catch {
          lastSignInAt = null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at,
          plan_type: sub?.plan_type ?? null,
          subscription_status: sub?.status ?? null,
          current_period_end: sub?.current_period_end ?? null,
          source: sub?.source ?? null,
          activated_by: sub?.activated_by ?? null,
          last_sign_in_at: lastSignInAt,
        };
      }));

      const filtered = applyFilters(merged, currentFilters);
      setTotalCount(filtered.length);
      setCustomers(filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE));
      setFilters(currentFilters);
      setPage(currentPage);
    } finally {
      setLoading(false);
    }
  }, [applyFilters, filters, page]);

  const openDrawer = useCallback((userId: string) => {
    setSelectedUser(customers.find((c) => c.id === userId) ?? null);
  }, [customers]);
  const closeDrawer = useCallback(() => setSelectedUser(null), []);

  const grantAccess = useCallback(async (userId: string, params: { plan_type: string; days?: number; notes?: string }) => {
    const { data, error } = await supabase.functions.invoke("grant-access", { body: { action: "activate", user_id: userId, ...params } });
    if (error) throw error;
    await logAdminAudit({
      action: "access_granted",
      target_type: "user",
      target_id: userId,
      details: { plan_type: params.plan_type, days: params.days ?? null, notes: params.notes ?? null },
    });
    return data;
  }, []);

  const revokeAccess = useCallback(async (userId: string) => {
    const { data, error } = await supabase.functions.invoke("grant-access", { body: { action: "revoke", user_id: userId } });
    if (error) throw error;
    await logAdminAudit({ action: "access_revoked", target_type: "user", target_id: userId });
    return data;
  }, []);

  const extendAccess = useCallback(async (userId: string, days: number) => {
    const { data, error } = await supabase.functions.invoke("grant-access", { body: { action: "extend", user_id: userId, days } });
    if (error) throw error;
    await logAdminAudit({ action: "access_extended", target_type: "user", target_id: userId, details: { days } });
    return data;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const adminAuth = (supabase as any).auth?.admin;
    const res = await adminAuth.generateLink({ type: "recovery", email });
    if (res.error) throw res.error;
    return { link: res?.data?.properties?.action_link || "" };
  }, []);

  const generateMagicLink = useCallback(async (email: string) => {
    const adminAuth = (supabase as any).auth?.admin;
    const res = await adminAuth.generateLink({ type: "magiclink", email });
    if (res.error) throw res.error;
    return { link: res?.data?.properties?.action_link || "" };
  }, []);

  const editUser = useCallback(async (userId: string, data: { name?: string; phone?: string; email?: string }) => {
    if (data.name !== undefined || data.phone !== undefined) {
      const { error } = await (supabase as any).from("poupeja_users").update({ name: data.name, phone: data.phone }).eq("id", userId);
      if (error) throw error;
    }
    if (data.email && selectedUser?.email !== data.email) {
      const { error } = await supabase.functions.invoke("update-user-email", { body: { user_id: userId, email: data.email } });
      if (error) throw error;
    }
  }, [selectedUser?.email]);

  const deleteUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase.functions.invoke("delete-my-data", { body: { user_id: userId } });
    if (error) throw error;
    await logAdminAudit({ action: "user_deleted", target_type: "user", target_id: userId });
    return data;
  }, []);

  const sendEmail = useCallback(async (userId: string, email: string, template: string) => {
    const { data, error } = await supabase.functions.invoke("send-email", { body: { to_user_id: userId, to: email, template, data: { name: email } } });
    if (error) throw error;
    return data;
  }, []);

  const fetchAccessHistory = useCallback(async (userId: string): Promise<AccessLogItem[]> => {
    const { data, error } = await (supabase as any)
      .from("poupeja_access_log")
      .select("id, action, plan_type, source, notes, created_at, period_start, period_end, performed_by")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, []);

  const fetchFinance = useCallback(async (userId: string) => {
    const adminDb = supabase as any;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const [tx, goals, categories] = await Promise.all([
      adminDb.from("poupeja_transactions").select("id, date, description, amount, type, category_id, poupeja_categories(name)").eq("user_id", userId).order("date", { ascending: false }).limit(10),
      adminDb.from("poupeja_goals").select("id").eq("user_id", userId),
      adminDb.from("poupeja_categories").select("id").eq("user_id", userId),
    ]);
    const monthTx = (tx.data ?? []).filter((r: any) => r.date >= monthStart);
    const income = monthTx.filter((r: any) => r.type === "income").reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const expense = monthTx.filter((r: any) => r.type === "expense").reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    return {
      transactions: tx.data ?? [],
      totals: { income, expense, balance: income - expense },
      counters: { goals: goals.data?.length ?? 0, categories: categories.data?.length ?? 0 },
    };
  }, []);

  const fetchEmailHistory = useCallback(async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from("poupeja_email_log")
      .select("id, template, subject, status, created_at")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  }, []);

  const exportCSV = useCallback(async () => {
    const adminDb = supabase as any;
    const { data } = await adminDb
      .from("poupeja_users")
      .select("id, name, email, phone, created_at, poupeja_subscriptions(status, plan_type, current_period_end, source, activated_by)")
      .order("created_at", { ascending: false });
    const rows = applyFilters((data ?? []).map((u: any) => {
      const sub = u.poupeja_subscriptions?.[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        created_at: u.created_at,
        plan_type: sub?.plan_type ?? null,
        subscription_status: sub?.status ?? null,
        current_period_end: sub?.current_period_end ?? null,
        source: sub?.source ?? null,
        activated_by: sub?.activated_by ?? null,
        last_sign_in_at: null,
      } as AdminCustomer;
    }));
    const header = "nome,email,telefone,plano,status,expira_em,health,cadastrado_em";
    const body = rows.map((r) => {
      const health = getHealthScore(r);
      return `"${r.name ?? ""}","${r.email}","${r.phone ?? ""}","${r.plan_type ?? ""}","${getCustomerStatus(r)}","${r.current_period_end ?? ""}","${health.score}","${r.created_at ?? ""}"`;
    });
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes_admin.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [applyFilters]);

  return {
    customers,
    totalCount,
    loading,
    page,
    filters,
    setFilters,
    setPage,
    fetchCustomers,
    selectedUser,
    openDrawer,
    closeDrawer,
    grantAccess,
    revokeAccess,
    extendAccess,
    resetPassword,
    generateMagicLink,
    editUser,
    deleteUser,
    sendEmail,
    fetchAccessHistory,
    fetchFinance,
    fetchEmailHistory,
    exportCSV,
    pageSize: PAGE_SIZE,
    totalPages: useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]),
  };
};

