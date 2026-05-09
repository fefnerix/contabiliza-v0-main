import type { Dispatch, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckSquare, Database, Loader2, MessageCircle, RefreshCw, Settings, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ServiceCheck } from "@/hooks/useInfraStatus";
import { useInfraStatusContext } from "@/contexts/InfraStatusContext";

type InfraStatusPanelProps = {
  edgeLogs: any[];
  edgeFilter: { fn: string; period: string };
  setEdgeFilter: Dispatch<SetStateAction<{ fn: string; period: string }>>;
  functionOptions: string[];
  exportEdgeCsv: () => void;
};

const dotClass = (status: ServiceCheck["status"]) =>
  status === "ok"
    ? "bg-emerald-500"
    : status === "warn"
      ? "bg-amber-400"
      : status === "error"
        ? "bg-red-500"
        : "bg-zinc-500 animate-pulse";

export function InfraStatusPanel({
  edgeLogs,
  edgeFilter,
  setEdgeFilter,
  functionOptions,
  exportEdgeCsv,
}: InfraStatusPanelProps) {
  const { checks, summary, globalLevel, lastChecked, isChecking, runChecks } = useInfraStatusContext();

  const bySection = (s: ServiceCheck["section"]) => checks.filter((c) => c.section === s);

  const globalMsg =
    globalLevel === "ok"
      ? "Todos os serviços operacionais"
      : globalLevel === "warn"
        ? `${summary.warn} configuração(ões) pendente(s) — sistema funcionando`
        : globalLevel === "error"
          ? `${summary.error} serviço(s) com erro — ação necessária`
          : "Verificando…";

  const barClass =
    globalLevel === "ok"
      ? "border-emerald-500/40 bg-emerald-500/10"
      : globalLevel === "warn"
        ? "border-amber-500/40 bg-amber-500/10"
        : globalLevel === "error"
          ? "border-red-500/40 bg-red-500/10"
          : "border-zinc-600 bg-zinc-900/50";

  return (
    <div className="space-y-4">
      <div className={cn("rounded-lg border px-4 py-3 flex flex-wrap items-center justify-between gap-2", barClass)}>
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {globalLevel === "ok" ? "🟢" : globalLevel === "warn" ? "🟡" : globalLevel === "error" ? "🔴" : "⏳"}
          </span>
          <span className="font-medium">{globalMsg}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {lastChecked ? <span>Último: {lastChecked.toLocaleString("pt-BR")}</span> : null}
          <Button size="sm" variant="secondary" onClick={() => runChecks()} disabled={isChecking}>
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">Verificar agora</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">OK</p>
            <p className="text-2xl font-semibold text-emerald-400">{summary.ok}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Avisos</p>
            <p className="text-2xl font-semibold text-amber-400">{summary.warn}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Erros</p>
            <p className="text-2xl font-semibold text-red-400">{summary.error}</p>
          </CardContent>
        </Card>
        <Card className="border-[#1f1f1f] bg-[#111111]">
          <CardContent className="pt-4">
            <p className="text-xs text-zinc-500">Latência média</p>
            <p className="text-2xl font-semibold">{summary.avgMs} ms</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Supabase" icon={Database} checks={bySection("supabase")} />
        <SectionCard title="Edge Functions" icon={Zap} checks={bySection("edge")} />
        <SectionCard title="n8n Automações" icon={Settings} checks={bySection("n8n")} />
        <SectionCard title="WhatsApp / Evolution" icon={MessageCircle} checks={bySection("whatsapp")} />
        <SectionCard title="Configurações pendentes" icon={CheckSquare} checks={bySection("config")} className="md:col-span-2" />
      </div>

      <Card className="border-[#1f1f1f] bg-[#111111]">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Histórico operacional (fonte webhook)</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <select
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
              value={edgeFilter.fn}
              onChange={(e) => setEdgeFilter((f) => ({ ...f, fn: e.target.value }))}
            >
              <option value="all">Todas as funções</option>
              {functionOptions.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
            <select
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
              value={edgeFilter.period}
              onChange={(e) => setEdgeFilter((f) => ({ ...f, period: e.target.value }))}
            >
              <option value="1h">1h</option>
              <option value="6h">6h</option>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportEdgeCsv}>
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {edgeLogs.map((row: any) => (
                <TableRow key={row.id} className={row.status >= 500 ? "bg-red-500/10" : ""}>
                  <TableCell>{new Date(row.timestamp).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        row.status >= 500
                          ? "bg-red-500/20 text-red-300"
                          : row.status >= 400
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-emerald-500/20 text-emerald-300"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.duration_ms}ms</TableCell>
                  <TableCell className="max-w-[200px] truncate">{row.error ? String(row.error).slice(0, 60) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  checks,
  className,
}: {
  title: string;
  icon: LucideIcon;
  checks: ServiceCheck[];
  className?: string;
}) {
  return (
    <Card className={cn("border-[#1f1f1f] bg-[#111111]", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="h-4 w-4 text-emerald-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 rounded bg-zinc-800/80 animate-pulse" />
            ))}
          </div>
        ) : (
          checks.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("h-2 w-2 rounded-full shrink-0", dotClass(c.status))} />
                <span className="text-zinc-300 truncate">{c.label}</span>
              </div>
              <span className="text-zinc-500 shrink-0 text-xs">
                {c.detail}
                {typeof c.ms === "number" ? ` · ${c.ms}ms` : ""}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
