import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileNavBar from "@/components/layout/MobileNavBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppContext } from "@/contexts/AppContext";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const formatMoney = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const formatDelta = (value: number) => (value >= 0 ? `↑ ${value}` : `↓ ${Math.abs(value)}`);

const statusColor = {
  online: "bg-green-100 text-green-700",
  offline: "bg-red-100 text-red-700",
  degraded: "bg-yellow-100 text-yellow-700",
};

const AdminDashboardPage: React.FC = () => {
  const { hideValues, toggleHideValues } = useAppContext();
  const isMobile = useIsMobile();
  const { loading, kpis, mrr, services, recentActivity, checkoutToggles, refresh, updateCheckoutToggle } = useAdminDashboard();

  const content = (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Operacional</h1>
          <p className="text-sm text-muted-foreground">Visão em tempo real do sistema</p>
        </div>
        <Button variant="outline" onClick={refresh}>
          Verificar agora
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Novos cadastros hoje</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{kpis.newUsersToday}</p><p className="text-xs text-muted-foreground">{formatDelta(kpis.deltas.newUsersToday)} vs ontem</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Acessos ativados hoje</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{kpis.activatedToday}</p><p className="text-xs text-muted-foreground">{formatDelta(kpis.deltas.activatedToday)} vs ontem</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Erros webhook hoje</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{kpis.webhookErrorsToday}</p><p className="text-xs text-muted-foreground">{formatDelta(kpis.deltas.webhookErrorsToday)} vs ontem</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Expirando em 7 dias</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{kpis.expiringIn7Days}</p><p className="text-xs text-muted-foreground">{formatDelta(kpis.deltas.expiringIn7Days)} vs ontem</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">MRR atual</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatMoney(mrr.mrr)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">ARR estimado</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatMoney(mrr.arr)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Assinantes ativos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{mrr.activeSubscribers}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Status dos serviços</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.name} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{service.name}</p>
                <Badge className={statusColor[service.status]}>{service.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Verificado em {new Date(service.checkedAt).toLocaleTimeString("pt-BR")}
              </p>
              {service.details && <p className="text-xs mt-1">{service.details}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Checkouts ativos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">Stripe <Switch checked={checkoutToggles.stripe_enabled} onCheckedChange={(v) => updateCheckoutToggle("stripe_enabled", v)} /></div>
          <div className="flex items-center gap-2">Hotmart <Switch checked={checkoutToggles.hotmart_enabled} onCheckedChange={(v) => updateCheckoutToggle("hotmart_enabled", v)} /></div>
          <div className="flex items-center gap-2">Genérico <Switch checked={checkoutToggles.generic_enabled} onCheckedChange={(v) => updateCheckoutToggle("generic_enabled", v)} /></div>
          <div className="flex items-center gap-2">Manual <Switch checked disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Atividade recente</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && recentActivity.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos recentes.</p>}
          {recentActivity.map((event, idx) => (
            <div key={`${event.type}-${idx}`} className="rounded border p-2 text-sm">
              {event.type === "access" && (
                <span>✅ Acesso {event.data.action} ({event.data.plan_type || "n/a"}) via {event.data.source || "manual"}</span>
              )}
              {event.type === "webhook" && (
                <span>{event.data.error ? "❌" : "🟢"} Webhook {event.data.provider}: {event.data.event_type}</span>
              )}
              {event.type === "user" && <span>👤 {event.data.email} se cadastrou</span>}
              <div className="text-xs text-muted-foreground mt-1">{new Date(event.created_at).toLocaleString("pt-BR")}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader hideValues={hideValues} toggleHideValues={toggleHideValues} />
        <main className="flex-1 overflow-auto p-4 pb-20">{content}</main>
        <MobileNavBar />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{content}</main>
    </div>
  );
};

export default AdminDashboardPage;

