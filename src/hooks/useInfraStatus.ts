import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CheckStatus = "ok" | "warn" | "error" | "loading";

export type ServiceCheck = {
  id: string;
  section: "supabase" | "edge" | "n8n" | "whatsapp" | "config";
  label: string;
  status: CheckStatus;
  detail?: string;
  ms?: number;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const EDGE_FN_NAMES = [
  "stripe-webhook",
  "hotmart-webhook",
  "generic-webhook",
  "grant-access",
  "get-analytics",
  "send-email",
  "send-broadcast",
] as const;

const N8N_RECEPTOR =
  "https://n8n-n8n.lzewqc.easypanel.host/webhook/contabiliza-receptor";
const EVOLUTION_DEFAULT =
  "https://evolution-evolution-api.lzewqc.easypanel.host";

function fnHeaders() {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
  };
}

async function measureMs<T>(fn: () => Promise<T>): Promise<{ ms: number; result: T }> {
  const t0 = performance.now();
  const result = await fn();
  return { ms: Math.round(performance.now() - t0), result };
}

export function useInfraStatus(opts?: { refreshMs?: number }) {
  const refreshMs = opts?.refreshMs ?? 120_000;
  const [checks, setChecks] = useState<ServiceCheck[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runChecks = useCallback(async () => {
    setIsChecking(true);
    const next: ServiceCheck[] = [];

    const push = (c: Omit<ServiceCheck, "status"> & { status?: CheckStatus }) => {
      next.push({ status: "ok", ...c });
    };

    /* —— Supabase: REST —— */
    {
      const { ms, result } = await measureMs(async () =>
        supabase.from("poupeja_categories").select("id").limit(1),
      );
      const err = result.error;
      push({
        id: "sb-rest",
        section: "supabase",
        label: "REST API (categorias)",
        status: err ? "error" : "ok",
        detail: err ? err.message : "Consulta OK",
        ms,
      });
    }

    /* —— Edge: get-public-settings —— */
    {
      const { ms, result } = await measureMs(async () => {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/get-public-settings`, {
          method: "GET",
          headers: fnHeaders(),
        });
        return r;
      });
      const ok = result.status === 200;
      push({
        id: "sb-fn-public",
        section: "supabase",
        label: "Edge: get-public-settings",
        status: ok ? "ok" : "error",
        detail: `HTTP ${result.status}`,
        ms,
      });
    }

    /* —— Edge: get-admin-settings — esperado 401 sem sessão admin —— */
    {
      const { ms, result } = await measureMs(async () =>
        fetch(`${SUPABASE_URL}/functions/v1/get-admin-settings`, { method: "GET" }),
      );
      const ok = result.status === 401;
      push({
        id: "sb-fn-admin-auth",
        section: "supabase",
        label: "Edge: get-admin-settings (401 esperado)",
        status: ok ? "ok" : result.status < 500 ? "warn" : "error",
        detail: `HTTP ${result.status}`,
        ms,
      });
    }

    /* —— RPC —— */
    {
      const { ms, result } = await measureMs(async () =>
        supabase.rpc("buscar_cadastro_por_email_phone", { p_phone: "test" }),
      );
      const err = result.error;
      push({
        id: "sb-rpc-phone",
        section: "supabase",
        label: "RPC buscar_cadastro_por_email_phone",
        status: err ? "error" : "ok",
        detail: err ? err.message : "Sem erro (resultado pode ser vazio)",
        ms,
      });
    }

    /* —— Edge functions OPTIONS —— */
    for (const name of EDGE_FN_NAMES) {
      const { ms, result } = await measureMs(async () =>
        fetch(`${SUPABASE_URL}/functions/v1/${name}`, { method: "OPTIONS" }),
      );
      const ok = result.status > 0 && result.status < 500;
      push({
        id: `edge-${name}`,
        section: "edge",
        label: `OPTIONS ${name}`,
        status: ok ? "ok" : "error",
        detail: `HTTP ${result.status}`,
        ms,
      });
    }

    /* —— n8n receptor —— */
    {
      const { ms, result } = await measureMs(async () =>
        fetch(N8N_RECEPTOR, { method: "OPTIONS", mode: "cors" }),
      );
      const status = result.status;
      const ok = status > 0 && status < 500;
      push({
        id: "n8n-receptor",
        section: "n8n",
        label: "n8n webhook contabiliza-receptor",
        status: ok ? "ok" : status === 0 ? "warn" : "error",
        detail:
          status === 0
            ? "CORS / resposta opaca — verifique no servidor"
            : `HTTP ${status}`,
        ms,
      });
    }

    /* —— n8n health URL (settings) —— */
    {
      let healthUrl = "";
      try {
        const { data } = await supabase
          .from("poupeja_settings")
          .select("value")
          .eq("category", "system")
          .eq("key", "n8n_health_url")
          .maybeSingle();
        healthUrl = (data as { value?: string } | null)?.value?.trim() ?? "";
      } catch {
        healthUrl = "";
      }
      if (healthUrl) {
        const { ms, result } = await measureMs(async () =>
          fetch(healthUrl, { method: "GET", mode: "cors" }),
        );
        const ok = result.status > 0 && result.status < 500;
        push({
          id: "n8n-health",
          section: "n8n",
          label: "n8n health URL (settings)",
          status: ok ? "ok" : result.status === 0 ? "warn" : "error",
          detail: `HTTP ${result.status || "?"}`,
          ms,
        });
      } else {
        push({
          id: "n8n-health",
          section: "n8n",
          label: "n8n health URL (settings)",
          status: "warn",
          detail: "system.n8n_health_url não configurado",
        });
      }
    }

    /* —— Evolution API —— */
    {
      const evo =
        (import.meta.env.VITE_EVOLUTION_API_URL as string | undefined)?.replace(/\/$/, "") ||
        EVOLUTION_DEFAULT;
      const { ms, result } = await measureMs(async () =>
        fetch(evo, { method: "GET", mode: "cors" }),
      );
      const st = result.status;
      push({
        id: "evo-root",
        section: "whatsapp",
        label: "Evolution API (raiz)",
        status: st === 0 ? "warn" : st > 0 && st < 500 ? "ok" : "error",
        detail:
          st === 0
            ? "CORS — teste pelo servidor se necessário"
            : `HTTP ${st}`,
        ms,
      });
    }

    /* —— Configurações —— */
    const keys: { cat: string; key: string; label: string }[] = [
      { cat: "system", key: "resend_api_key", label: "Resend API key" },
      { cat: "contact", key: "discord_webhook_url", label: "Discord webhook" },
      { cat: "system", key: "email_from", label: "Email remetente (from)" },
      { cat: "branding", key: "company_name", label: "Nome da empresa" },
      { cat: "checkout", key: "stripe_enabled", label: "Stripe habilitado" },
      { cat: "checkout", key: "hotmart_enabled", label: "Hotmart habilitado" },
    ];

    try {
      const { data: rows } = await supabase.from("poupeja_settings").select("category,key,value");
      const map = new Map<string, string>();
      (rows ?? []).forEach((r: { category: string; key: string; value: string }) => {
        map.set(`${r.category}.${r.key}`, r.value ?? "");
      });

      for (const k of keys) {
        const full = `${k.cat}.${k.key}`;
        const raw = map.get(full) ?? "";
        const forToggle = k.key.endsWith("_enabled");
        const filled = forToggle ? raw === "true" : raw.trim().length > 0;
        push({
          id: `cfg-${full}`,
          section: "config",
          label: k.label,
          status: filled ? "ok" : "warn",
          detail: filled ? "OK" : "Vazio / desativado",
        });
      }
    } catch (e) {
      push({
        id: "cfg-load",
        section: "config",
        label: "Carregar settings",
        status: "error",
        detail: e instanceof Error ? e.message : "Erro",
      });
    }

    setChecks(next);
    setLastChecked(new Date());
    setIsChecking(false);
  }, []);

  useEffect(() => {
    runChecks();
    if (!refreshMs) return;
    const id = window.setInterval(runChecks, refreshMs);
    return () => window.clearInterval(id);
  }, [runChecks, refreshMs]);

  const summary = useMemo(() => {
    let ok = 0;
    let warn = 0;
    let error = 0;
    const msList: number[] = [];
    for (const c of checks) {
      if (c.status === "ok") ok++;
      else if (c.status === "warn") warn++;
      else if (c.status === "error") error++;
      if (typeof c.ms === "number") msList.push(c.ms);
    }
    const avgMs =
      msList.length > 0 ? Math.round(msList.reduce((a, b) => a + b, 0) / msList.length) : 0;
    return { ok, warn, error, avgMs };
  }, [checks]);

  const globalLevel = useMemo(() => {
    if (checks.length === 0) return "loading" as const;
    if (summary.error > 0) return "error" as const;
    if (summary.warn > 0) return "warn" as const;
    return "ok" as const;
  }, [checks.length, summary.error, summary.warn]);

  return {
    checks,
    summary,
    globalLevel,
    lastChecked,
    isChecking,
    runChecks,
  };
}
