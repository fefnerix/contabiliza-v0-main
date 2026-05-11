import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as ReTooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { CustomerDrawer } from "@/components/admin/CustomerDrawer";
import { AdminCustomer } from "@/hooks/useAdminCustomers";
import { adminPlanChartColors, chartStroke } from "@/lib/chart-theme";

const money = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const pct = (v: number) => `${v.toFixed(2)}%`;

const planColor = (planType: string) =>
  adminPlanChartColors[planType] ?? "hsl(var(--muted-foreground))";

const kpiFormula: Record<string, string> = {
  MRR: "Soma da receita mensal recorrente dos planos ativos.",
  ARR: "MRR x 12.",
  "Churn Rate": "(Cancelados no mês / ativos no início) x 100.",
  NRR: "(MRR fim + expansões - contrações - cancelamentos) / MRR início x 100.",
  ARPU: "MRR / assinantes pagantes.",
  "LTV Estimado": "ARPU / churn mensal.",
};

const AdminAnalyticsPage = () => {
  const { kpis, counts, planDistribution, mrrHistory, engagement, healthScores, healthLoading, loading, refresh } = useAdminAnalytics();
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const ratio = engagement.ratio || (engagement.mau ? (engagement.dau / engagement.mau) * 100 : 0);
  const ratioBadge = ratio > 20 ? "🟢 Excelente" : ratio > 10 ? "🟡 Bom" : "🔴 Atenção";
  const trialRate = counts.trialsTotal > 0 ? (counts.converted / counts.trialsTotal) * 100 : 0;

  const pieData = useMemo(
    () => planDistribution.map((p) => ({ ...p, color: planColor(p.plan_type) })),
    [planDistribution],
  );

  const openCustomer = async (row: any) => {
    const adminDb = supabase as any;
    const { data: user } = await adminDb
      .from("poupeja_users")
      .select("id,name,email,phone,created_at,poupeja_subscriptions(status,plan_type,current_period_end,source,activated_by)")
      .eq("id", row.user_id)
      .maybeSingle();
    if (!user) return;
    const sub = user.poupeja_subscriptions?.[0];
    setSelectedCustomer({
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
      last_sign_in_at: null,
    });
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Analytics SaaS</h2>
        <Button variant="outline" onClick={refresh}>Atualizar</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "MRR", value: money(kpis.mrr), trend: "—", key: "MRR" },
          { label: "ARR", value: money(kpis.arr), trend: "—", key: "ARR" },
          { label: "Churn Rate", value: pct(kpis.churnRate), trend: "—", key: "Churn Rate", tone: kpis.churnRate > 5 ? "text-destructive" : "" },
          { label: "NRR", value: pct(kpis.nrr), trend: "—", key: "NRR", tone: kpis.nrr > 100 ? "text-primary" : "" },
          { label: "ARPU", value: money(kpis.arpu), trend: "—", key: "ARPU" },
          { label: "LTV Estimado", value: money(kpis.ltv), trend: "—", key: "LTV Estimado" },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {k.label}
                <Tooltip>
                  <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent>{kpiFormula[k.key]}</TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${k.tone ?? ""}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>MRR 12 meses</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mrrHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartStroke.grid} opacity={0.55} />
              <XAxis dataKey="month" />
              <YAxis />
              <ReTooltip formatter={(v: number) => money(Number(v))} />
              <Line type="monotone" dataKey="mrr" stroke={chartStroke.mrr} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Distribuição de planos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="plan_type" outerRadius={90}>
                  {pieData.map((entry) => (
                    <Cell key={entry.plan_type} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Planos (tabela)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Plano</TableHead><TableHead>Clientes</TableHead><TableHead>MRR</TableHead><TableHead>%</TableHead></TableRow></TableHeader>
              <TableBody>
                {pieData.map((p) => {
                  const total = pieData.reduce((s, x) => s + x.count, 0);
                  return (
                    <TableRow key={p.plan_type}>
                      <TableCell><Badge style={{ background: p.color }}>{p.plan_type}</Badge></TableCell>
                      <TableCell>{p.count}</TableCell>
                      <TableCell>{money(p.mrr)}</TableCell>
                      <TableCell>{total ? ((p.count / total) * 100).toFixed(1) : 0}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>DAU</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{engagement.dau}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>MAU</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{engagement.mau}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Ratio DAU/MAU</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{ratio.toFixed(1)}%</p><p className="text-xs text-muted-foreground mt-1">{ratioBadge}</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Para histórico completo de logins, configure evento de tracking.</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={[{ d: "Hoje", v: engagement.dau }, { d: "30d", v: engagement.mau }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartStroke.grid} opacity={0.45} />
              <XAxis dataKey="d" />
              <YAxis />
              <Line type="monotone" dataKey="v" stroke={chartStroke.mrr} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Clientes em risco</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Estes clientes têm maior probabilidade de churn nos próximos 30 dias.</p>
          <Table>
            <TableHeader><TableRow><TableHead></TableHead><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Score</TableHead><TableHead>Último login</TableHead><TableHead>Expira em</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {healthLoading ? (
                <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>
              ) : (
                healthScores.map((h: any) => (
                  <TableRow key={h.user_id}>
                    <TableCell><span className={`inline-block h-2.5 w-2.5 rounded-full ${h.score >= 70 ? "bg-emerald-500" : h.score >= 40 ? "bg-amber-500" : "bg-red-500"}`} /></TableCell>
                    <TableCell>{h.name || "-"}</TableCell>
                    <TableCell>{h.email}</TableCell>
                    <TableCell>{h.score}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => openCustomer(h)}>Ver →</Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Trial conversion</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div><p className="text-xs text-zinc-400">Trials totais</p><p className="text-2xl font-bold">{counts.trialsTotal}</p></div>
            <div><p className="text-xs text-zinc-400">Convertidos</p><p className="text-2xl font-bold">{counts.converted}</p></div>
            <div><p className="text-xs text-zinc-400">Taxa</p><p className="text-2xl font-bold">{trialRate.toFixed(1)}%</p></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-zinc-800"><div className="h-4 rounded bg-emerald-500" style={{ width: "100%" }} /></div>
            <div className="h-4 rounded bg-zinc-800"><div className="h-4 rounded bg-blue-500" style={{ width: `${counts.trialsTotal ? (counts.trialsTotal / Math.max(counts.activeSubscribers, counts.trialsTotal)) * 100 : 0}%` }} /></div>
            <div className="h-4 rounded bg-zinc-800"><div className="h-4 rounded bg-amber-500" style={{ width: `${counts.trialsTotal ? (counts.converted / counts.trialsTotal) * 100 : 0}%` }} /></div>
          </div>
          <p className="text-xs text-zinc-400">Cadastros → Trials → Pagantes</p>
        </CardContent>
      </Card>

      <CustomerDrawer open={drawerOpen} onOpenChange={setDrawerOpen} customer={selectedCustomer} onReload={refresh} />
    </div>
  );
};

export default AdminAnalyticsPage;

