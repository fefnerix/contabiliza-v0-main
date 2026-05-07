import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContentPageItem {
  id: string;
  title: string;
  slug: string;
  body: string;
  is_published: boolean;
  updated_at: string;
}

export interface AnnouncementItem {
  id: string;
  message: string;
  type: "info" | "warning" | "critical" | "success";
  audience: "all" | "active" | "expiring" | "trial" | "expired";
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DefaultCategoryItem {
  id: string;
  name: string;
  type: "income" | "expense";
  is_default: boolean;
}

export const useAdminContent = () => {
  const [pages, setPages] = useState<ContentPageItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<DefaultCategoryItem[]>([]);
  const [globalAnnouncement, setGlobalAnnouncement] = useState({ message: "", type: "info", enabled: false });
  const [loading, setLoading] = useState(false);

  const fetchPages = useCallback(async () => {
    const { data, error } = await (supabase as any).from("poupeja_content").select("*").order("slug");
    if (error) throw error;
    setPages(data ?? []);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    const { data, error } = await (supabase as any).from("poupeja_announcements").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    setAnnouncements(data ?? []);
  }, []);

  const fetchDefaultCategories = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("poupeja_categories")
      .select("id,name,type,is_default")
      .is("user_id", null)
      .order("name");
    if (error) throw error;
    setDefaultCategories(data ?? []);
  }, []);

  const fetchGlobalAnnouncement = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("poupeja_settings")
      .select("key,value")
      .eq("category", "system")
      .in("key", ["global_announcement", "global_announcement_type", "global_announcement_enabled"]);
    if (error) throw error;
    const map = new Map((data ?? []).map((row: any) => [row.key, row.value]));
    setGlobalAnnouncement({
      message: map.get("global_announcement") ?? "",
      type: map.get("global_announcement_type") ?? "info",
      enabled: String(map.get("global_announcement_enabled") ?? "false") === "true",
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPages(), fetchAnnouncements(), fetchDefaultCategories(), fetchGlobalAnnouncement()]);
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements, fetchDefaultCategories, fetchGlobalAnnouncement, fetchPages]);

  const savePage = useCallback(
    async (
      slug: string,
      data: {
        title: string;
        body: string;
        is_published?: boolean;
      },
    ) => {
      const adminDb = supabase as any;
      const existing = pages.find((p) => p.slug === slug);
      const payload = {
        slug,
        title: data.title,
        body: data.body,
        is_published: !!data.is_published,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await adminDb.from("poupeja_content").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await adminDb.from("poupeja_content").insert(payload);
        if (error) throw error;
      }
      await fetchPages();
    },
    [fetchPages, pages],
  );

  const publishPage = useCallback(
    async (slug: string) => {
      const page = pages.find((p) => p.slug === slug);
      if (!page) return;
      const { error } = await (supabase as any)
        .from("poupeja_content")
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .eq("id", page.id);
      if (error) throw error;
      await fetchPages();
    },
    [fetchPages, pages],
  );

  const unpublishPage = useCallback(
    async (slug: string) => {
      const page = pages.find((p) => p.slug === slug);
      if (!page) return;
      const { error } = await (supabase as any)
        .from("poupeja_content")
        .update({ is_published: false, updated_at: new Date().toISOString() })
        .eq("id", page.id);
      if (error) throw error;
      await fetchPages();
    },
    [fetchPages, pages],
  );

  const createAnnouncement = useCallback(
    async (data: Omit<AnnouncementItem, "id" | "created_at">) => {
      const { error } = await (supabase as any).from("poupeja_announcements").insert(data);
      if (error) throw error;
      await fetchAnnouncements();
    },
    [fetchAnnouncements],
  );

  const updateAnnouncement = useCallback(
    async (id: string, data: Partial<AnnouncementItem>) => {
      const { error } = await (supabase as any).from("poupeja_announcements").update(data).eq("id", id);
      if (error) throw error;
      await fetchAnnouncements();
    },
    [fetchAnnouncements],
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from("poupeja_announcements").delete().eq("id", id);
      if (error) throw error;
      await fetchAnnouncements();
    },
    [fetchAnnouncements],
  );

  const toggleAnnouncement = useCallback(
    async (id: string) => {
      const item = announcements.find((a) => a.id === id);
      if (!item) return;
      await updateAnnouncement(id, { is_active: !item.is_active });
    },
    [announcements, updateAnnouncement],
  );

  const updateGlobalAnnouncement = useCallback(
    async (data: { message: string; type: string; enabled: boolean }) => {
      const rows = [
        { category: "system", key: "global_announcement", value: data.message },
        { category: "system", key: "global_announcement_type", value: data.type },
        { category: "system", key: "global_announcement_enabled", value: String(data.enabled) },
      ];
      const { error } = await (supabase as any).from("poupeja_settings").upsert(rows, { onConflict: "category,key" });
      if (error) throw error;
      await fetchGlobalAnnouncement();
    },
    [fetchGlobalAnnouncement],
  );

  const createCategory = useCallback(
    async (data: { name: string; type: "income" | "expense"; is_default: boolean }) => {
      const { error } = await (supabase as any).from("poupeja_categories").insert({ ...data, user_id: null });
      if (error) throw error;
      await fetchDefaultCategories();
    },
    [fetchDefaultCategories],
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<DefaultCategoryItem>) => {
      const { error } = await (supabase as any).from("poupeja_categories").update(data).eq("id", id);
      if (error) throw error;
      await fetchDefaultCategories();
    },
    [fetchDefaultCategories],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const { error } = await (supabase as any).from("poupeja_categories").delete().eq("id", id);
      if (error) throw error;
      await fetchDefaultCategories();
    },
    [fetchDefaultCategories],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    pages,
    announcements,
    defaultCategories,
    globalAnnouncement,
    loading,
    savePage,
    publishPage,
    unpublishPage,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement,
    updateGlobalAnnouncement,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
  };
};

