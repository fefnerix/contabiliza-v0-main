import { useState } from "react";
import { Plus, ScrollText } from "lucide-react";
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

const providerBadge = (provider: string) =>
  provider === "stripe" ? "bg-emerald-500/20 text-emerald-300" :
  provider === "hotmart" ? "bg-orange-500/20 text-orange-300" :
  "bg-purple-500/20 text-purple-300";

const severityBadge = (severity: string) =>
  severity === "critical" ? "bg-red-500/20 text-red-300 animate-pulse" :
  severity === "high" ? "bg-orange-500/20 text-orange-300" :
  severity === "medium" ? "bg-yellow-500/20 text-yellow-300" :
  "bg-zinc-500/20 text-zinc-300";

const AdminLogsPage = () => {
  const {
    functionOptions,
    edgeLogs,
    edgeMetrics,
    edgeFilter,
    setEdgeFilter,
    webhookEvents,
    eventsFilter,
    setEventsFilter,
    reprocessEvent,
    ignoreEvent,
    incidents,
    incidentFilter,
    setIncidentFilter,
    createIncident,
    updateIncidentStatus,
    resolveIncident,
  } = useAdminLogs();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedPayload, setSelectedPayload] = useState<any>(null);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: "", severity: "medium", description: "" });

  const exportEdgeCsv = () => {
    const header = "timestamp,status,duration,error,function";
    const body = edgeLogs.map((row: any) => `"${row.timestamp}","${row.status}","${row.duration_ms}","${row.error ?? ""}","${row.function_name}"`);
    const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edge-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Logs & Diagnóstico</h2>
      <Tabs defaultValue="edge">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="edge">EDGE FUNCTIONS</TabsTrigger>
          <TabsTrigger value="webhooks">WEBHOOKS</TabsTrigger>
          <TabsTrigger value="incidents">INCIDENTES</TabsTrigger>
        </TabsList>

        <TabsContent value="edge" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Select value={edgeFilter.fn} onValueChange={(value) => setEdgeFilter((f) => ({ ...f, fn: value }))}>
              <SelectTrigger><SelectValue placeholder="Função" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {functionOptions.map((fn) => <SelectItem key={fn} value={fn}>{fn}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={edgeFilter.period} onValueChange={(value) => setEdgeFilter((f) => ({ ...f, period: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="6h">6h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportEdgeCsv}>Exportar CSV</Button>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-6"><p className="text-sm text-zinc-400">Total chamadas</p><p className="text-2xl font-semibold">{edgeMetrics.total}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-zinc-400">✅ Sucesso</p><p className="text-2xl font-semibold">{edgeMetrics.success}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-zinc-400">❌ Erros</p><p className="text-2xl font-semibold">{edgeMetrics.errors}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-zinc-400">Tempo médio</p><p className="text-2xl font-semibold">{edgeMetrics.avgDuration}ms</p></CardContent></Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Status</TableHead><TableHead>Duração</TableHead><TableHead>Erro</TableHead></TableRow></TableHeader>
                <TableBody>
                  {edgeLogs.map((row: any) => (
                    <TableRow key={row.id} className={`cursor-pointer ${row.status >= 500 ? "bg-red-500/10" : ""}`} onClick={() => setSelectedLog(row)}>
                      <TableCell>{new Date(row.timestamp).toLocaleString("pt-BR")}</TableCell>
                      <TableCell><Badge className={row.status >= 500 ? "bg-red-500/20 text-red-300" : row.status >= 400 ? "bg-yellow-500/20 text-yellow-300" : "bg-emerald-500/20 text-emerald-300"}>{row.status}</Badge></TableCell>
                      <TableCell>{row.duration_ms}ms</TableCell>
                      <TableCell>{row.error ? String(row.error).slice(0, 60) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Select value={eventsFilter.provider} onValueChange={(value) => setEventsFilter((f) => ({ ...f, provider: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos provedores</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="generic">Genérico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventsFilter.status} onValueChange={(value) => setEventsFilter((f) => ({ ...f, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="errors">Com erro</SelectItem>
                <SelectItem value="processed">Processado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>Provedor</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Erro</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {webhookEvents.map((event: any) => (
                    <TableRow key={event.id} className="cursor-pointer" onClick={() => setSelectedPayload(event)}>
                      <TableCell><Badge className={providerBadge(event.provider)}>{event.provider}</Badge></TableCell>
                      <TableCell>{event.event_type}</TableCell>
                      <TableCell>{event.error ? "❌" : "✅"}</TableCell>
                      <TableCell>{event.error ? String(event.error).slice(0, 50) : "—"}</TableCell>
                      <TableCell>{new Date(event.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="space-x-2" onClick={(e) => e.stopPropagation()}>
                        {!!event.error && <Button size="sm" variant="outline" onClick={() => reprocessEvent(event.id)}>🔄 Reprocessar</Button>}
                        <Button size="sm" variant="ghost" onClick={() => ignoreEvent(event.id)}>✓ Ignorar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Incidentes do Sistema</h3>
            <Button onClick={() => setIncidentOpen(true)}><Plus className="h-4 w-4 mr-1" />Registrar Incidente</Button>
          </div>
          <Select value={incidentFilter} onValueChange={setIncidentFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="investigating">Em investigação</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-3">
            {incidents.map((incident: any) => (
              <Card key={incident.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{incident.title}</span>
                    <Badge className={severityBadge(incident.severity)}>{incident.severity}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-zinc-400">{incident.status} • {new Date(incident.created_at).toLocaleString("pt-BR")}</p>
                  <p className="text-sm">{String(incident.description || "").slice(0, 200)}{String(incident.description || "").length > 200 ? "..." : ""}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateIncidentStatus(incident.id, "investigating")}>Atualizar status</Button>
                    <Button size="sm" variant="outline" onClick={() => updateIncidentStatus(incident.id, "open")}>+ Adicionar update</Button>
                    <Button size="sm" onClick={() => resolveIncident(incident.id)}>Marcar resolvido</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Log completo</SheetTitle></SheetHeader>
          <pre className="mt-4 text-xs whitespace-pre-wrap rounded border p-3">{selectedLog ? JSON.stringify(selectedLog, null, 2) : ""}</pre>
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedPayload} onOpenChange={(open) => !open && setSelectedPayload(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Payload JSON</SheetTitle></SheetHeader>
          <pre className="mt-4 text-xs whitespace-pre-wrap rounded border p-3">{selectedPayload ? JSON.stringify(selectedPayload.payload ?? selectedPayload, null, 2) : ""}</pre>
        </SheetContent>
      </Sheet>

      <Dialog open={incidentOpen} onOpenChange={setIncidentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar incidente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Título</Label>
            <Input value={incidentForm.title} onChange={(e) => setIncidentForm((f) => ({ ...f, title: e.target.value }))} />
            <Label>Severidade</Label>
            <Select value={incidentForm.severity} onValueChange={(value) => setIncidentForm((f) => ({ ...f, severity: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">low</SelectItem>
                <SelectItem value="medium">medium</SelectItem>
                <SelectItem value="high">high</SelectItem>
                <SelectItem value="critical">critical</SelectItem>
              </SelectContent>
            </Select>
            <Label>Descrição</Label>
            <Textarea value={incidentForm.description} onChange={(e) => setIncidentForm((f) => ({ ...f, description: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIncidentOpen(false)}>Cancelar</Button>
              <Button onClick={async () => { await createIncident(incidentForm); setIncidentOpen(false); }}>Registrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogsPage;

