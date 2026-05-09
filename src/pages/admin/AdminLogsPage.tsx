import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { InfraStatusPanel } from "@/components/admin/InfraStatusPanel";
import { TransactionsMonitor } from "@/components/admin/TransactionsMonitor";
import { AgentMonitor } from "@/components/admin/AgentMonitor";
import { AdminAuditTab } from "@/components/admin/AdminAuditTab";

const providerBadge = (provider: string) =>
  provider === "stripe"
    ? "bg-emerald-500/20 text-emerald-300"
    : provider === "hotmart"
      ? "bg-orange-500/20 text-orange-300"
      : "bg-purple-500/20 text-purple-300";

const severityBadge = (severity: string) =>
  severity === "critical"
    ? "bg-red-500/20 text-red-300 animate-pulse"
    : severity === "high"
      ? "bg-orange-500/20 text-orange-300"
      : severity === "medium"
        ? "bg-yellow-500/20 text-yellow-300"
        : "bg-zinc-500/20 text-zinc-300";

const AdminLogsPage = () => {
  const {
    functionOptions,
    edgeLogs,
    edgeMetrics,
    edgeFilter,
    setEdgeFilter,
    webhookEvents,
    eventsLoading,
    eventsFilter,
    setEventsFilter,
    reprocessEvent,
    reprocessAllFailedEvents,
    ignoreEvent,
    webhookTodayStats,
    incidents,
    incidentFilter,
    setIncidentFilter,
    createIncident,
    updateIncidentStatus,
    resolveIncident,
    auditLogs,
    auditFilters,
    setAuditFilters,
    exportAuditCSV,
  } = useAdminLogs();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: "", severity: "medium", description: "" });
  const [reprocessingBatch, setReprocessingBatch] = useState(false);

  const exportEdgeCsv = () => {
    const header = "timestamp,status,duration,error,function";
    const body = edgeLogs.map(
      (row: any) =>
        `"${row.timestamp}","${row.status}","${row.duration_ms}","${row.error ?? ""}","${row.function_name}"`,
    );
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edge-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReprocessAllErrors = async () => {
    setReprocessingBatch(true);
    try {
      await reprocessAllFailedEvents();
    } finally {
      setReprocessingBatch(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Infraestrutura & Operações</h2>
      <Tabs defaultValue="infra">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-zinc-900/80 p-1 border border-zinc-800">
          <TabsTrigger value="infra">INFRAESTRUTURA</TabsTrigger>
          <TabsTrigger value="transactions">TRANSAÇÕES</TabsTrigger>
          <TabsTrigger value="webhooks">WEBHOOKS</TabsTrigger>
          <TabsTrigger value="agent">AGENTE IA</TabsTrigger>
          <TabsTrigger value="incidents">INCIDENTES</TabsTrigger>
          <TabsTrigger value="audit">AUDITORIA</TabsTrigger>
        </TabsList>

        <TabsContent value="infra" className="space-y-4 mt-4">
          <InfraStatusPanel
            edgeLogs={edgeLogs}
            edgeFilter={edgeFilter}
            setEdgeFilter={setEdgeFilter}
            functionOptions={functionOptions}
            exportEdgeCsv={exportEdgeCsv}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 mt-4">
          <TransactionsMonitor />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Card className="border-[#1f1f1f] bg-[#111111]">
              <CardContent className="pt-6">
                <p className="text-sm text-zinc-400">Total hoje</p>
                <p className="text-2xl font-semibold">{webhookTodayStats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-[#1f1f1f] bg-[#111111]">
              <CardContent className="pt-6">
                <p className="text-sm text-zinc-400">Processados ✅</p>
                <p className="text-2xl font-semibold text-emerald-400">{webhookTodayStats.processedOk}</p>
              </CardContent>
            </Card>
            <Card className="border-[#1f1f1f] bg-[#111111]">
              <CardContent className="pt-6">
                <p className="text-sm text-zinc-400">Com erro ❌</p>
                <p className="text-2xl font-semibold text-red-400">{webhookTodayStats.withError}</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" disabled={reprocessingBatch || webhookTodayStats.withError === 0} onClick={handleReprocessAllErrors}>
              {reprocessingBatch ? "Reprocessando…" : "Reprocessar todos com erro"}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={eventsFilter.provider} onValueChange={(value) => setEventsFilter((f) => ({ ...f, provider: value }))}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos provedores</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="generic">Genérico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventsFilter.status} onValueChange={(value) => setEventsFilter((f) => ({ ...f, status: value }))}>
              <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="errors">Com erro</SelectItem>
                <SelectItem value="processed">Processado</SelectItem>
              </SelectContent>
            </Select>
            {eventsLoading ? <span className="text-xs text-zinc-500 self-center">Carregando…</span> : null}
          </div>
          <Card className="border-[#1f1f1f] bg-[#111111]">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookEvents.map((event: any) => (
                    <TableRow key={event.id} className="cursor-pointer" onClick={() => setSelectedPayload(event)}>
                      <TableCell>
                        <Badge className={providerBadge(event.provider)}>{event.provider}</Badge>
                      </TableCell>
                      <TableCell>{event.event_type}</TableCell>
                      <TableCell>{event.error ? "❌" : "✅"}</TableCell>
                      <TableCell>{event.error ? String(event.error).slice(0, 50) : "—"}</TableCell>
                      <TableCell>{new Date(event.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="space-x-2" onClick={(e) => e.stopPropagation()}>
                        {!!event.error ? (
                          <Button size="sm" variant="outline" onClick={() => reprocessEvent(event.id)}>
                            🔄 Reprocessar
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => ignoreEvent(event.id)}>
                          ✓ Ignorar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent" className="space-y-4 mt-4">
          <AgentMonitor webhookTodayStats={webhookTodayStats} />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Incidentes do Sistema</h3>
            <Button onClick={() => setIncidentOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Registrar Incidente
            </Button>
          </div>
          <Select value={incidentFilter} onValueChange={setIncidentFilter}>
            <SelectTrigger className="max-w-xs bg-zinc-900 border-zinc-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="investigating">Em investigação</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-3">
            {incidents.map((incident: any) => (
              <Card key={incident.id} className="border-[#1f1f1f] bg-[#111111]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{incident.title}</span>
                    <Badge className={severityBadge(incident.severity)}>{incident.severity}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-zinc-400">
                    {incident.status} • {new Date(incident.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm">
                    {String(incident.description || "").slice(0, 200)}
                    {String(incident.description || "").length > 200 ? "..." : ""}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => updateIncidentStatus(incident.id, "investigating")}>
                      Atualizar status
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateIncidentStatus(incident.id, "open")}>
                      + Adicionar update
                    </Button>
                    <Button size="sm" onClick={() => resolveIncident(incident.id)}>
                      Marcar resolvido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 mt-4">
          <AdminAuditTab
            auditLogs={auditLogs}
            auditFilters={auditFilters}
            setAuditFilters={setAuditFilters}
            exportAuditCSV={exportAuditCSV}
          />
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#111111] border-zinc-800">
          <SheetHeader>
            <SheetTitle>Log completo</SheetTitle>
          </SheetHeader>
          <pre className="mt-4 text-xs whitespace-pre-wrap rounded border border-zinc-800 p-3">{selectedLog ? JSON.stringify(selectedLog, null, 2) : ""}</pre>
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedPayload} onOpenChange={(open) => !open && setSelectedPayload(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#111111] border-zinc-800">
          <SheetHeader>
            <SheetTitle>Payload JSON</SheetTitle>
          </SheetHeader>
          <pre className="mt-4 text-xs whitespace-pre-wrap rounded border border-zinc-800 p-3">
            {selectedPayload ? JSON.stringify(selectedPayload.payload ?? selectedPayload, null, 2) : ""}
          </pre>
        </SheetContent>
      </Sheet>

      <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
        <DialogContent className="bg-[#111111] border-zinc-800">
          <DialogHeader>
            <DialogTitle>Registrar incidente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Título</Label>
            <Input
              value={incidentForm.title}
              onChange={(e) => setIncidentForm((f) => ({ ...f, title: e.target.value }))}
              className="bg-zinc-900 border-zinc-700"
            />
            <Label>Severidade</Label>
            <Select value={incidentForm.severity} onValueChange={(value) => setIncidentForm((f) => ({ ...f, severity: value }))}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="critical">critical</SelectItem>
              </SelectContent>
            </Select>
            <Label>Descrição</Label>
            <Textarea
              value={incidentForm.description}
              onChange={(e) => setIncidentForm((f) => ({ ...f, description: e.target.value }))}
              className="bg-zinc-900 border-zinc-700"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIncidentOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await createIncident(incidentForm);
                  setIncidentOpen(false);
                }}
              >
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogsPage;
