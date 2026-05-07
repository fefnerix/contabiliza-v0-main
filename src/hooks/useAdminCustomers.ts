import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CustomerStatus = "active" | "expiring" | "expired" | "trial" | "no_access";

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
  last_sign_in_at?: string | null;
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

const getCustomerStatus = (customer: AdminCustomer): CustomerStatus => {
  if (!customer.subscription_status || !customer.current_period_end) return "no_access";

  if (customer.subscription_status === "trialing") return "trial";

  const end = new Date(customer.current_period_end);
  const now = new Date();
  if (Number.isNaN(end.getTime())) return "no_access";

  if (end < now || customer.subscription_status === "canceled") return "expired";

  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return "expiring";

  return "active";
};

export const useAdminCustomers = () => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = useCallback(
    async (search: string, statusFilter: "all" | CustomerStatus, page: number) => {
      setLoading(true);
      try {
        const adminDb = supabase as any;

        const { data: users, error: usersError } = await adminDb
          .from("poupeja_users")
          .select("id, name, email, phone, created_at")
          .order("created_at", { ascending: false });

        if (usersError) throw usersError;

        const userIds = (users ?? []).map((u: { id: string }) => u.id);
        let subsByUser = new Map<string, any>();

        if (userIds.length > 0) {
          const { data: subs, error: subsError } = await adminDb
            .from("poupeja_subscriptions")
            .select("user_id, status, plan_type, current_period_end, source")
            .in("user_id", userIds);

          if (subsError) throw subsError;
          subsByUser = new Map((subs ?? []).map((sub: any) => [sub.user_id, sub]));
        }

        const merged: AdminCustomer[] = (users ?? []).map((user: any) => {
          const sub = subsByUser.get(user.id);
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
            last_sign_in_at: null,
          };
        });

        const query = normalize(search);
        const filtered = merged.filter((customer) => {
          const textMatch =
            !query ||
            normalize(customer.name).includes(query) ||
            normalize(customer.email).includes(query) ||
            normalize(customer.phone).includes(query);

          if (!textMatch) return false;
          if (statusFilter === "all") return true;
          return getCustomerStatus(customer) === statusFilter;
        });

        const start = page * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        setCustomers(filtered.slice(start, end));
        setTotalCount(filtered.length);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const grantAccess = useCallback(
    async (payload: { action: "activate" | "revoke" | "extend"; user_id: string; plan_type?: string; days?: number; notes?: string }) => {
      const { data, error } = await supabase.functions.invoke("grant-access", { body: payload });
      if (error) throw error;
      return data;
    },
    [],
  );

  const fetchAccessHistory = useCallback(async (userId: string): Promise<AccessLogItem[]> => {
    const adminDb = supabase as any;
    const { data, error } = await adminDb
      .from("poupeja_access_log")
      .select("id, action, plan_type, source, notes, created_at, period_start, period_end, performed_by")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }, []);

  const fetchCustomerFinance = useCallback(async (userId: string) => {
    const adminDb = supabase as any;
    const [{ data: transactions }, { data: goals }] = await Promise.all([
      adminDb
        .from("poupeja_transactions")
        .select("id, amount, type, description, date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(10),
      adminDb.from("poupeja_goals").select("id, current_amount, target_amount").eq("user_id", userId),
    ]);

    const txs = transactions ?? [];
    const income = txs.filter((tx: any) => tx.type === "income").reduce((sum: number, tx: any) => sum + Number(tx.amount ?? 0), 0);
    const expenses = txs.filter((tx: any) => tx.type === "expense").reduce((sum: number, tx: any) => sum + Number(tx.amount ?? 0), 0);

    return {
      transactions: txs,
      activeGoals: (goals ?? []).length,
      income,
      expenses,
      balance: income - expenses,
    };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const adminApi = (supabase as any).auth?.admin;
    if (adminApi?.generateLink) {
      const result = await adminApi.generateLink({
        type: "recovery",
        email,
      });
      if (result.error) throw result.error;
      return result.data?.properties?.action_link ?? null;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return null;
  }, []);

  const impersonateUser = useCallback(async (email: string) => {
    const adminApi = (supabase as any).auth?.admin;
    if (adminApi?.generateLink) {
      const result = await adminApi.generateLink({
        type: "magiclink",
        email,
      });
      if (result.error) throw result.error;
      return result.data?.properties?.action_link ?? null;
    }

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return null;
  }, []);

  const exportCSV = useCallback(async (search: string, statusFilter: "all" | CustomerStatus) => {
    await fetchCustomers(search, statusFilter, 0);

    const adminDb = supabase as any;
    const { data: users } = await adminDb
      .from("poupeja_users")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false });

    const rows: string[] = ["nome,email,telefone,plano,status,expira_em,cadastrado_em"];
    (users ?? []).forEach((user: any) => {
      rows.push(
        `"${user.name ?? ""}","${user.email}","${user.phone ?? ""}","","","",` +
          `"${user.created_at ?? ""}"`,
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "admin-clientes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fetchCustomers]);

  return {
    loading,
    customers,
    totalCount,
    pageSize: PAGE_SIZE,
    getCustomerStatus,
    fetchCustomers,
    grantAccess,
    fetchAccessHistory,
    fetchCustomerFinance,
    resetPassword,
    impersonateUser,
    exportCSV,
    totalPages: useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]),
  };
};

