import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAudit } from "@/lib/adminAudit";

type AdminRow = {
  user_id: string;
  created_at: string | null;
  name: string;
  email: string;
  profile_image: string | null;
};

export const useAdminSettings = () => {
  const [branding, setBranding] = useState({
    company_name: "",
    logo_url: "",
    theme_color: "#16a34a",
    favicon_url: "",
    logo_alt_text: "",
    support_message: "",
    terms_url: "",
  });
  const [systemConfig, setSystemConfig] = useState({
    maintenance_mode: false,
    maintenance_message: "",
    trial_days: 0,
    grace_period_days: 0,
    debug_mode: false,
    discord_webhook_url: "",
    n8n_health_url: "",
    data_retention_days: 730,
    email_from: "",
    resend_api_key: "",
  });
  const [integrations, setIntegrations] = useState({
    facebook_pixel_id: "",
    facebook_pixel_enabled: false,
    contact_whatsapp: "",
    contact_email: "",
    contact_phone: "",
    n8n_health_url: "",
  });
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [lgpdStatus, setLgpdStatus] = useState({
    privacyPublished: false,
    termsPublished: false,
    emailConfigured: false,
    resendConfigured: false,
  });
  const [loading, setLoading] = useState({
    branding: false,
    system: false,
    integrations: false,
    admins: false,
    lgpd: false,
  });

  const loadSettingsByCategories = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("poupeja_settings")
      .select("category,key,value")
      .in("category", ["branding", "system", "facebook_pixel", "contact"]);
    if (error) throw error;
    const map = new Map((data ?? []).map((row: any) => [`${row.category}.${row.key}`, row.value ?? ""]));

    setBranding({
      company_name: map.get("branding.company_name") ?? "",
      logo_url: map.get("branding.logo_url") ?? "",
      theme_color: map.get("branding.theme_color") ?? "#16a34a",
      favicon_url: map.get("branding.favicon_url") ?? "",
      logo_alt_text: map.get("branding.logo_alt_text") ?? "",
      support_message: map.get("branding.support_message") ?? "",
      terms_url: map.get("branding.terms_url") ?? "",
    });

    setSystemConfig({
      maintenance_mode: (map.get("system.maintenance_mode") ?? "false") === "true",
      maintenance_message: map.get("system.maintenance_message") ?? "",
      trial_days: Number(map.get("system.trial_days") ?? 0),
      grace_period_days: Number(map.get("system.grace_period_days") ?? 0),
      debug_mode: (map.get("system.debug_mode") ?? "false") === "true",
      discord_webhook_url: map.get("system.discord_webhook_url") ?? "",
      n8n_health_url: map.get("system.n8n_health_url") ?? "",
      data_retention_days: Number(map.get("system.data_retention_days") ?? 730),
      email_from: map.get("system.email_from") ?? "",
      resend_api_key: map.get("system.resend_api_key") ?? "",
    });

    setIntegrations({
      facebook_pixel_id: map.get("facebook_pixel.facebook_pixel_id") ?? "",
      facebook_pixel_enabled: (map.get("facebook_pixel.facebook_pixel_enabled") ?? "false") === "true",
      contact_whatsapp: map.get("contact.contact_whatsapp") ?? "",
      contact_email: map.get("contact.contact_email") ?? "",
      contact_phone: map.get("contact.contact_phone") ?? "",
      n8n_health_url: map.get("system.n8n_health_url") ?? "",
    });
  }, []);

  const fetchAdmins = useCallback(async () => {
    setLoading((prev) => ({ ...prev, admins: true }));
    try {
      const { data: roles, error: rolesError } = await (supabase as any)
        .from("user_roles")
        .select("user_id,created_at")
        .eq("role", "admin");
      if (rolesError) throw rolesError;
      const userIds = (roles ?? []).map((r: any) => r.user_id).filter(Boolean);
      if (userIds.length === 0) {
        setAdmins([]);
        return;
      }
      const { data: users, error: usersError } = await (supabase as any)
        .from("poupeja_users")
        .select("id,name,email,profile_image")
        .in("id", userIds);
      if (usersError) throw usersError;
      const result = userIds
        .map((userId: string) => {
          const roleRow = (roles ?? []).find((r: any) => r.user_id === userId);
          const user = (users ?? []).find((u: any) => u.id === userId);
          if (!user) return null;
          return {
            user_id: userId,
            created_at: roleRow?.created_at ?? null,
            name: user.name ?? "Sem nome",
            email: user.email ?? "",
            profile_image: user.profile_image ?? null,
          };
        })
        .filter(Boolean) as AdminRow[];
      setAdmins(result);
    } finally {
      setLoading((prev) => ({ ...prev, admins: false }));
    }
  }, []);

  const fetchLgpdStatus = useCallback(async () => {
    setLoading((prev) => ({ ...prev, lgpd: true }));
    try {
      const { data: contentRows } = await (supabase as any)
        .from("poupeja_content")
        .select("slug,is_published")
        .in("slug", ["privacy", "terms"]);
      const privacyPublished = !!(contentRows ?? []).find((row: any) => row.slug === "privacy" && row.is_published);
      const termsPublished = !!(contentRows ?? []).find((row: any) => row.slug === "terms" && row.is_published);
      setLgpdStatus({
        privacyPublished,
        termsPublished,
        emailConfigured: !!systemConfig.email_from,
        resendConfigured: !!systemConfig.resend_api_key,
      });
    } finally {
      setLoading((prev) => ({ ...prev, lgpd: false }));
    }
  }, [systemConfig.email_from, systemConfig.resend_api_key]);

  const upsertSettings = useCallback(async (rows: { category: string; key: string; value: string }[]) => {
    const { error } = await (supabase as any).from("poupeja_settings").upsert(rows, { onConflict: "category,key" });
    if (error) throw error;
  }, []);

  const saveBranding = useCallback(
    async (data: typeof branding) => {
      setLoading((prev) => ({ ...prev, branding: true }));
      try {
        await upsertSettings(
          Object.entries(data).map(([key, value]) => ({ category: "branding", key, value: String(value ?? "") })),
        );
        await logAdminAudit({ action: "settings_updated", target_type: "settings", target_id: "branding", details: { category: "branding" } });
        await loadSettingsByCategories();
      } finally {
        setLoading((prev) => ({ ...prev, branding: false }));
      }
    },
    [loadSettingsByCategories, upsertSettings, branding],
  );

  const saveSystem = useCallback(
    async (data: Partial<typeof systemConfig>) => {
      setLoading((prev) => ({ ...prev, system: true }));
      try {
        const merged = { ...systemConfig, ...data };
        await upsertSettings([
          { category: "system", key: "maintenance_mode", value: String(merged.maintenance_mode) },
          { category: "system", key: "maintenance_message", value: merged.maintenance_message },
          { category: "system", key: "trial_days", value: String(merged.trial_days) },
          { category: "system", key: "grace_period_days", value: String(merged.grace_period_days) },
          { category: "system", key: "debug_mode", value: String(merged.debug_mode) },
          { category: "system", key: "discord_webhook_url", value: merged.discord_webhook_url },
          { category: "system", key: "n8n_health_url", value: merged.n8n_health_url },
          { category: "system", key: "data_retention_days", value: String(merged.data_retention_days) },
        ]);
        await logAdminAudit({ action: "settings_updated", target_type: "settings", target_id: "system", details: { category: "system" } });
        await loadSettingsByCategories();
      } finally {
        setLoading((prev) => ({ ...prev, system: false }));
      }
    },
    [loadSettingsByCategories, systemConfig, upsertSettings],
  );

  const saveIntegrations = useCallback(
    async (data: Partial<typeof integrations>) => {
      setLoading((prev) => ({ ...prev, integrations: true }));
      try {
        const merged = { ...integrations, ...data };
        await upsertSettings([
          { category: "facebook_pixel", key: "facebook_pixel_id", value: merged.facebook_pixel_id },
          { category: "facebook_pixel", key: "facebook_pixel_enabled", value: String(merged.facebook_pixel_enabled) },
          { category: "contact", key: "contact_whatsapp", value: merged.contact_whatsapp },
          { category: "contact", key: "contact_email", value: merged.contact_email },
          { category: "contact", key: "contact_phone", value: merged.contact_phone },
          { category: "system", key: "n8n_health_url", value: merged.n8n_health_url },
        ]);
        await logAdminAudit({ action: "settings_updated", target_type: "settings", target_id: "integrations", details: { category: "integrations" } });
        await loadSettingsByCategories();
      } finally {
        setLoading((prev) => ({ ...prev, integrations: false }));
      }
    },
    [integrations, loadSettingsByCategories, upsertSettings],
  );

  const toggleMaintenance = useCallback(
    async (enabled: boolean, message?: string) => {
      await saveSystem({ maintenance_mode: enabled, maintenance_message: message ?? systemConfig.maintenance_message });
      await logAdminAudit({ action: "maintenance_toggled", target_type: "settings", target_id: "maintenance", details: { enabled } });
    },
    [saveSystem, systemConfig.maintenance_message],
  );

  const testDiscord = useCallback(async (): Promise<{ ok: boolean; status: number }> => {
    if (!systemConfig.discord_webhook_url) return { ok: false, status: 0 };
    try {
      const response = await fetch(systemConfig.discord_webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Teste de webhook do painel admin Contabiliza." }),
      });
      return { ok: response.ok, status: response.status };
    } catch {
      return { ok: false, status: 0 };
    }
  }, [systemConfig.discord_webhook_url]);

  const testN8n = useCallback(async (): Promise<{ ok: boolean; status: number }> => {
    const url = integrations.n8n_health_url || systemConfig.n8n_health_url;
    if (!url) return { ok: false, status: 0 };
    try {
      const response = await fetch(url, { method: "GET" });
      return { ok: response.ok, status: response.status };
    } catch {
      return { ok: false, status: 0 };
    }
  }, [integrations.n8n_health_url, systemConfig.n8n_health_url]);

  const promoteToAdmin = useCallback(
    async (email: string) => {
      const normalized = email.trim().toLowerCase();
      const { data: users, error: userError } = await (supabase as any)
        .from("poupeja_users")
        .select("id,email")
        .ilike("email", normalized)
        .limit(1);
      if (userError) throw userError;
      const user = users?.[0];
      if (!user?.id) throw new Error("Usuário não encontrado");
      const { error } = await (supabase as any).from("user_roles").insert({ user_id: user.id, role: "admin" });
      if (error) throw error;
      await logAdminAudit({ action: "admin_promoted", target_type: "user", target_id: user.id, details: { email: user.email } });
      await fetchAdmins();
    },
    [fetchAdmins],
  );

  const revokeAdmin = useCallback(
    async (userId: string) => {
      const { error } = await (supabase as any).from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) throw error;
      await logAdminAudit({ action: "admin_revoked", target_type: "user", target_id: userId });
      await fetchAdmins();
    },
    [fetchAdmins],
  );

  const exportUserData = useCallback(async (email: string) => {
    const { data, error } = await supabase.functions.invoke("export-my-data", { body: { target_email: email } });
    if (error) throw error;
    await logAdminAudit({ action: "user_data_exported", target_type: "user", target_id: email, details: { email } });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
    return blob;
  }, []);

  const deleteUserData = useCallback(async (email: string) => {
    const { error } = await supabase.functions.invoke("delete-my-data", { body: { target_email: email } });
    if (error) throw error;
    await logAdminAudit({ action: "user_deleted", target_type: "user", target_id: email, details: { email } });
  }, []);

  const saveLgpdSettings = useCallback(
    async (data: { data_retention_days: number }) => {
      await saveSystem({ data_retention_days: data.data_retention_days });
      await fetchLgpdStatus();
    },
    [fetchLgpdStatus, saveSystem],
  );

  useEffect(() => {
    loadSettingsByCategories();
    fetchAdmins();
  }, [fetchAdmins, loadSettingsByCategories]);

  useEffect(() => {
    fetchLgpdStatus();
  }, [fetchLgpdStatus]);

  return {
    branding,
    systemConfig,
    integrations,
    admins,
    lgpdStatus,
    loading,
    saveBranding,
    saveSystem,
    saveIntegrations,
    toggleMaintenance,
    testDiscord,
    testN8n,
    fetchAdmins,
    promoteToAdmin,
    revokeAdmin,
    exportUserData,
    deleteUserData,
    saveLgpdSettings,
    refreshAll: async () => {
      await Promise.all([loadSettingsByCategories(), fetchAdmins(), fetchLgpdStatus()]);
    },
  };
};

