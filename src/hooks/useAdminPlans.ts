import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAudit } from "@/lib/adminAudit";

export interface PlanItem {
  id: string;
  name: string;
  slug: string;
  price_monthly: number | null;
  price_annual: number | null;
  duration_days: number;
  trial_days: number;
  max_transactions: number;
  features: string[];
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  hotmart_offer_code_monthly: string | null;
  hotmart_offer_code_annual: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CouponItem {
  id: string;
  code: string;
  discount_pct: number | null;
  discount_days: number;
  max_uses: number;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

export const useAdminPlans = () => {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("manage-plan", {
      body: { action: "list" },
    });
    if (error) throw error;
    setPlans((data?.data ?? []).map((p: any) => ({ ...p, features: Array.isArray(p.features) ? p.features : [] })));
  }, []);

  const fetchCoupons = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("poupeja_coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setCoupons(data ?? []);
  }, []);

  const createPlan = useCallback(async (plan: Partial<PlanItem>) => {
    const { error } = await supabase.functions.invoke("manage-plan", { body: { action: "create", plan } });
    if (error) throw error;
    await logAdminAudit({ action: "plan_created", target_type: "plan", target_id: String(plan.id ?? plan.slug ?? ""), details: { plan } });
    await fetchPlans();
  }, [fetchPlans]);

  const updatePlan = useCallback(async (id: string, plan: Partial<PlanItem>) => {
    const { error } = await supabase.functions.invoke("manage-plan", { body: { action: "update", plan: { id, ...plan } } });
    if (error) throw error;
    await logAdminAudit({ action: "plan_updated", target_type: "plan", target_id: id, details: { plan } });
    await fetchPlans();
  }, [fetchPlans]);

  const deletePlan = useCallback(async (id: string) => {
    const { error } = await supabase.functions.invoke("manage-plan", { body: { action: "delete", plan: { id } } });
    if (error) throw error;
    await logAdminAudit({ action: "plan_deleted", target_type: "plan", target_id: id });
    await fetchPlans();
  }, [fetchPlans]);

  const togglePlan = useCallback(async (id: string, active: boolean) => {
    await updatePlan(id, { is_active: active });
  }, [updatePlan]);

  const createCoupon = useCallback(async (coupon: Partial<CouponItem>) => {
    const { error } = await (supabase as any).from("poupeja_coupons").insert(coupon);
    if (error) throw error;
    await logAdminAudit({ action: "coupon_created", target_type: "coupon", target_id: String(coupon.code ?? ""), details: { coupon } });
    await fetchCoupons();
  }, [fetchCoupons]);

  const updateCoupon = useCallback(async (id: string, coupon: Partial<CouponItem>) => {
    const { error } = await (supabase as any).from("poupeja_coupons").update(coupon).eq("id", id);
    if (error) throw error;
    await fetchCoupons();
  }, [fetchCoupons]);

  const deleteCoupon = useCallback(async (id: string) => {
    const { error } = await (supabase as any).from("poupeja_coupons").delete().eq("id", id);
    if (error) throw error;
    await logAdminAudit({ action: "coupon_deleted", target_type: "coupon", target_id: id });
    await fetchCoupons();
  }, [fetchCoupons]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPlans(), fetchCoupons()]);
    } finally {
      setLoading(false);
    }
  }, [fetchCoupons, fetchPlans]);

  const generateCouponCode = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 8; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }, []);

  return {
    plans,
    coupons,
    loading,
    fetchPlans,
    fetchCoupons,
    refresh,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlan,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    generateCouponCode,
  };
};

