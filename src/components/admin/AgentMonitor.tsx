import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type WebhookToday = { total: number; processedOk: number; withError: number };

export function AgentMonitor({ webhookTodayStats }: { webhookTodayStats: WebhookToday }) {
  const [feed, setFeed] = useState<any[]>([]);
  const [hourly, setHourly] = useState<{ hour: string; count: number }[]>([]);
  const [txToday, setTxToday] = useState(0);
  const [usersToday, setUsersToday] = useState(0);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const since24h = new Date(Date.now() - 24 * 3600000).toISOString();

    const [{ data: events }, { count: txCount }, { data: txs }] = await Promise.all([
      (supabase as any)
        .from("poupeja_webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      (supabase as any)
        .from("poupeja_transactions")
        .select("id", { count: "exact", head: true })
        .eq("date", today),
      (supabase as any).from("poupeja_transactions").select("user_id").eq("date", today),
    ]);

    setFeed(events ?? []);

    const ids = new Set<string>();
    (txs ?? []).forEach((t: { user_id: string }) => {
      if (t.user_id) ids.add(t.user_id);
    });
    setUsersToday(ids.size);
    setTxToday(txCount ?? 0);

    const { data: last24 } = await (supabase as any)
      .from("poupeja_webhook_events")
      .select("created_at")
      .gte("created_at", since24h);

    const buckets: Record<number, number> = {};
    for (let h = 0; h < 24; h++) buckets[h] = 0;
    (last24 ?? []).forEach((row: { created_at: string }) => {
      const d = new Date(row.created_at);
      const h = d.getHours();
      buckets[h] = (buckets[h] ?? 0) + 1;
    });
    setHourly(
      Object.entries(buckets).map(([k, v]) => ({
        hour: `${String(k).padStart(2, "0")}:00`,
        count: v,
      })),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const successRate = useMemo(() => {
    const t = webhookTodayStats.total;
    if (!t) return 0;
    return Math.round((webhookTodayStats.processedOk / t) * 100);
  }, [webhookTodayStats]);

  const snippet = (payload: unknown) => {
    try {
      const s = JSON.stringify(payload ?? {}).slice(0, 120);
      return s.length >= 120 ? `${s}…` : s;
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Webhooks hoje</p>
            <p className="text-2xl font-semibold">{webhookTodayStats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Transações hoje</p>
            <p className="text-2xl font-semibold">{txToday}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Usuários (tx hoje)</p>
            <p className="text-2xl font-semibold">{usersToday}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Taxa sucesso webhooks</p>
            <p className="text-2xl font-semibold">{successRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#1f1f1f] bg-[#111111]">
        <CardHeader>
          <CardTitle className="text-base">Atividade (últimas 24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
              <Line type="monotone" dataKey="count" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-[#1f1f1f] bg-[#111111]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Feed de eventos (últimos 50)</CardTitle>
          <button type="button" className="text-xs text-emerald-400 hover:underline" onClick={() => load()}>
            Atualizar
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          {feed.map((ev) => (
            <button
              type="button"
              key={ev.id}
              className="w-full text-left rounded border border-zinc-800 p-3 hover:bg-zinc-900/80 flex gap-3 items-start"
              onClick={() => setSelected(ev)}
            >
              <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium shrink-0">
                {(ev.provider ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {ev.provider}
                  </Badge>
                  <span className="text-xs text-zinc-500">{ev.event_type}</span>
                  <span className="text-xs text-zinc-600">{new Date(ev.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm text-zinc-400 truncate mt-1">{snippet(ev.payload)}</p>
              </div>
              <span>{ev.error ? "❌" : "✅"}</span>
            </button>
          ))}
          {feed.length === 0 ? <p className="text-sm text-zinc-500">Nenhum evento.</p> : null}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#111111] border-zinc-800">
          <SheetHeader>
            <SheetTitle>Payload completo</SheetTitle>
          </SheetHeader>
          <pre className="mt-4 text-xs whitespace-pre-wrap rounded border border-zinc-800 p-3">
            {selected ? JSON.stringify(selected, null, 2) : ""}
          </pre>
        </SheetContent>
      </Sheet>
    </div>
  );
}
