import { Link } from "react-router-dom";
import { Activity, CalendarClock, RefreshCw, TriangleAlert, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const money = (n: number) =>
  n.toLocaleString("es-419", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const delta = (n: number) => (n >= 0 ? `↑ ${n}` : `↓ ${Math.abs(n)}`);
const relative = (iso: string) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
};

const serviceClass: Record<string, string> = {
  online: "bg-emerald-500",
  warning: "bg-amber-500",
  offline: "bg-red-500",
  not_configured: "bg-zinc-500",
};

const AdminDashboardPage = () => {
  const { dayStats, revenue, services, healthSummary, activity, checkoutToggles, loading, refresh, toggleCheckout } = useAdminDashboard();
  const totalHealth = healthSummary.healthy + healthSummary.atRisk + healthSummary.critical;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">Panel operativo</h2>
          <p className="text-zinc-400 text-sm">Vista de operación, ingresos y salud de la plataforma.</p>
        </div>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar ahora
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4" />Nuevos registros</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dayStats.newUsers}</p><p className="text-xs text-zinc-400">{delta(dayStats.deltas.newUsers)} vs ayer</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" />Activaciones hoy</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dayStats.activatedToday}</p><p className="text-xs text-zinc-400">{delta(dayStats.deltas.activatedToday)} vs ayer</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><TriangleAlert className="h-4 w-4" />Errores webhook</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dayStats.webhookErrors}</p><p className="text-xs text-zinc-400">{delta(dayStats.deltas.webhookErrors)} vs ayer</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4" />Expiran en 7 días</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dayStats.expiringSoon}</p><p className="text-xs text-zinc-400">{delta(dayStats.deltas.expiringSoon)} vs ayer</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1"><CardHeader><CardTitle>MRR</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{money(revenue.mrr)}</p></CardContent></Card>
        <Card className="md:col-span-1"><CardHeader><CardTitle>ARR</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{money(revenue.arr)}</p></CardContent></Card>
        <Card className="md:col-span-1"><CardHeader><CardTitle>Suscriptores</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{revenue.activeSubscribers}</p><div className="flex gap-2 mt-2"><Badge variant="secondary">mensual {revenue.byPlan.monthly}</Badge><Badge variant="secondary">anual {revenue.byPlan.annual}</Badge><Badge variant="secondary">lifetime {revenue.byPlan.lifetime}</Badge></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Estado de los servicios</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.name} className="rounded-lg border border-zinc-800 p-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${serviceClass[s.status]}`} />
                <span className="font-medium">{s.name}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{relative(s.checkedAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Checkouts</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Badge className="gap-2 bg-zinc-800 text-zinc-200">Stripe <Switch checked={checkoutToggles.stripe} onCheckedChange={(v) => toggleCheckout("stripe", v)} /></Badge>
          <Badge className="gap-2 bg-zinc-800 text-zinc-200">Hotmart <Switch checked={checkoutToggles.hotmart} onCheckedChange={(v) => toggleCheckout("hotmart", v)} /></Badge>
          <Badge className="gap-2 bg-emerald-500/20 text-emerald-300">Manual 🔒 <Switch checked disabled /></Badge>
          <Badge className="gap-2 bg-zinc-800 text-zinc-200">Genérico <Switch checked={checkoutToggles.generic} onCheckedChange={(v) => toggleCheckout("generic", v)} /></Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Health score</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="rounded border border-emerald-700/40 p-3"><p className="text-xs text-zinc-400">🟢 Saudáveis</p><p className="text-2xl font-bold">{healthSummary.healthy}</p></div>
            <div className="rounded border border-amber-700/40 p-3"><p className="text-xs text-zinc-400">🟡 Em risco</p><p className="text-2xl font-bold">{healthSummary.atRisk}</p></div>
            <div className="rounded border border-red-700/40 p-3"><p className="text-xs text-zinc-400">🔴 Críticos</p><p className="text-2xl font-bold">{healthSummary.critical}</p></div>
          </div>
          <div className="h-3 rounded overflow-hidden flex bg-zinc-800">
            <div style={{ width: `${totalHealth ? (healthSummary.healthy / totalHealth) * 100 : 0}%` }} className="bg-emerald-500" />
            <div style={{ width: `${totalHealth ? (healthSummary.atRisk / totalHealth) * 100 : 0}%` }} className="bg-amber-500" />
            <div style={{ width: `${totalHealth ? (healthSummary.critical / totalHealth) * 100 : 0}%` }} className="bg-red-500" />
          </div>
          <Link to="/admin/customers?filter=critical" className="text-sm text-emerald-400 mt-3 inline-block">Ver clientes críticos</Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Feed de atividade</CardTitle></CardHeader>
        <CardContent className="max-h-80 overflow-auto space-y-2">
          {loading.activity ? <p className="text-sm text-zinc-400">Carregando...</p> : null}
          {activity.map((item) => (
            <div key={item.id} className="rounded border border-zinc-800 p-2">
              <p className="text-sm">{item.message}</p>
              <p className="text-xs text-zinc-500">{relative(item.timestamp)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;

