import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ProviderKey = "stripe" | "hotmart" | "manual" | "generic";
type ErrorFilter = "all" | "with_error" | "without_error";

interface ProviderState {
  enabled: boolean;
  configured: boolean;
  lastEvent: string | null;
}

interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  processed: boolean;
  error: string | null;
  payload: any;
  created_at: string;
}

export const useAdminCheckouts = () => {
  const [providers, setProviders] = useState<Record<ProviderKey, ProviderState>>({
    stripe: { enabled: false, configured: false, lastEvent: null },
    hotmart: { enabled: false, configured: false, lastEvent: null },
    manual: { enabled: true, configured: true, lastEvent: null },
    generic: { enabled: false, configured: false, lastEvent: null },
  });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsFilter, setEventsFilter] = useState<{ provider: "all" | "stripe" | "hotmart" | "generic"; error: ErrorFilter }>({
    provider: "all",
    error: "all",
  });

  const buildProviders = useCallback((nextSettings: Record<string, string>, events: WebhookEvent[]) => {
    const findLast = (provider: string) => events.find((e) => e.provider === provider)?.created_at ?? null;
    return {
      stripe: {
        enabled: nextSettings["checkout.stripe_enabled"] === "true",
        configured: Boolean(nextSettings["stripe.stripe_secret_key"]),
        lastEvent: findLast("stripe"),
      },
      hotmart: {
        enabled: nextSettings["checkout.hotmart_enabled"] === "true",
        configured: Boolean(nextSettings["hotmart.hotmart_client_id"]),
        lastEvent: findLast("hotmart"),
      },
      manual: {
        enabled: true,
        configured: true,
        lastEvent: null,
      },
      generic: {
        enabled: nextSettings["checkout.generic_enabled"] === "true",
        configured: Boolean(nextSettings["checkout.generic_webhook_token"]),
        lastEvent: findLast("generic"),
      },
    } satisfies Record<ProviderKey, ProviderState>;
  }, []);

  const load = useCallback(async () => {
    setEventsLoading(true);
    try {
      const adminDb = supabase as any;
      const [{ data: settingsRows }, { data: eventRows }] = await Promise.all([
        adminDb.from("poupeja_settings").select("category,key,value").in("category", ["checkout", "stripe", "hotmart"]),
        adminDb.from("poupeja_webhook_events").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      const nextSettings = Object.fromEntries((settingsRows ?? []).map((row: any) => [`${row.category}.${row.key}`, row.value ?? ""]));
      const nextEvents = (eventRows ?? []) as WebhookEvent[];
      setSettings(nextSettings);
      setWebhookEvents(nextEvents);
      setProviders(buildProviders(nextSettings, nextEvents));
    } finally {
      setEventsLoading(false);
    }
  }, [buildProviders]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleProvider = useCallback(
    async (provider: ProviderKey, enabled: boolean) => {
      if (provider === "manual") return;
      const key = `${provider}_enabled`;
      await (supabase as any).from("poupeja_settings").upsert({ category: "checkout", key, value: enabled ? "true" : "false" }, { onConflict: "category,key" });
      await load();
    },
    [load],
  );

  const saveConfig = useCallback(
    async (provider: ProviderKey, fields: Record<string, string>) => {
      const adminDb = supabase as any;
      for (const [fieldKey, value] of Object.entries(fields)) {
        const category = provider === "generic" ? "checkout" : provider;
        await adminDb.from("poupeja_settings").upsert({ category, key: fieldKey, value }, { onConflict: "category,key" });
      }
      await load();
    },
    [load],
  );

  const generateToken = useCallback(() => crypto.randomUUID(), []);

  const reprocessEvent = useCallback(
    async (id: string) => {
      await (supabase as any).from("poupeja_webhook_events").update({ processed: false, error: null }).eq("id", id);
      await load();
    },
    [load],
  );

  const ignoreEvent = useCallback(
    async (id: string) => {
      await (supabase as any).from("poupeja_webhook_events").update({ processed: true }).eq("id", id);
      await load();
    },
    [load],
  );

  const filteredEvents = useMemo(() => {
    return webhookEvents.filter((e) => {
      if (eventsFilter.provider !== "all" && e.provider !== eventsFilter.provider) return false;
      if (eventsFilter.error === "with_error" && !e.error) return false;
      if (eventsFilter.error === "without_error" && !!e.error) return false;
      return true;
    });
  }, [eventsFilter, webhookEvents]);

  return {
    providers,
    settings,
    toggleProvider,
    saveConfig,
    generateToken,
    webhookEvents: filteredEvents,
    eventsLoading,
    eventsFilter,
    setEventsFilter,
    reprocessEvent,
    ignoreEvent,
    refresh: load,
  };
};

