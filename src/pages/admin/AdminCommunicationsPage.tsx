import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAdminCommunications } from "@/hooks/useAdminCommunications";

const templateSlugs = [
  "welcome",
  "access_activated",
  "expiring_7d",
  "expiring_1d",
  "expired",
  "payment_failed",
  "payment_retry",
  "winback",
  "trial_started",
];

const vars = ["{{nome}}", "{{email}}", "{{app_name}}", "{{app_url}}", "{{plan_type}}", "{{expiry_date}}", "{{days_remaining}}"];

const AdminCommunicationsPage = () => {
  const { toast } = useToast();
  const {
    emailConfig,
    saveEmailConfig,
    testEmail,
    templates,
    saveTemplate,
    sendTestTemplate,
    resetTemplate,
    estimateAudience,
    sendBroadcast,
    emailHistory,
    historyLoading,
    historyFilters,
    setHistoryFilters,
  } = useAdminCommunications();
  const [showKey, setShowKey] = useState(false);
  const [configForm, setConfigForm] = useState({ from: emailConfig.from, fromName: emailConfig.fromName, resendKey: emailConfig.resendKey });
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [broadcast, setBroadcast] = useState({ target: "all", subject: "", body: "" });
  const [audience, setAudience] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    setConfigForm({ from: emailConfig.from, fromName: emailConfig.fromName, resendKey: emailConfig.resendKey });
  }, [emailConfig]);

  useEffect(() => {
    setTemplateDrafts(templates);
  }, [templates]);

  const filteredHistory = emailHistory.filter((item: any) => {
    if (historyFilters.search && !String(item.to_email ?? "").toLowerCase().includes(historyFilters.search.toLowerCase())) return false;
    if (historyFilters.template !== "all" && item.template !== historyFilters.template) return false;
    if (historyFilters.status !== "all" && item.status !== historyFilters.status) return false;
    return true;
  });
  const today = filteredHistory.filter((item: any) => new Date(item.created_at).toDateString() === new Date().toDateString());
  const weekAgo = Date.now() - 7 * 86400000;
  const week = filteredHistory.filter((item: any) => new Date(item.created_at).getTime() >= weekAgo);

  const availableTemplates = useMemo(
    () => ["all", ...Array.from(new Set(emailHistory.map((item: any) => item.template).filter(Boolean)))],
    [emailHistory],
  );

  const onEstimateAudience = async (target: string) => {
    const count = await estimateAudience(target);
    setAudience(count);
  };

  useEffect(() => {
    onEstimateAudience("all");
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Comunicações</h2>

      <Tabs defaultValue="config">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="config">CONFIGURAÇÃO</TabsTrigger>
          <TabsTrigger value="templates">TEMPLATES</TabsTrigger>
          <TabsTrigger value="broadcast">BROADCAST</TabsTrigger>
          <TabsTrigger value="history">HISTÓRICO</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Configuração de email</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Email remetente</Label>
              <Input value={configForm.from} onChange={(e) => setConfigForm((f) => ({ ...f, from: e.target.value }))} />
              <Label>Nome remetente</Label>
              <Input value={configForm.fromName} onChange={(e) => setConfigForm((f) => ({ ...f, fromName: e.target.value }))} />
              <Label>Resend API Key</Label>
              <div className="flex gap-2">
                <Input type={showKey ? "text" : "password"} value={configForm.resendKey} onChange={(e) => setConfigForm((f) => ({ ...f, resendKey: e.target.value }))} />
                <Button variant="outline" size="icon" onClick={() => setShowKey((v) => !v)}>{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
              <Badge className={emailConfig.configured ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}>
                {emailConfig.configured ? "✅ Resend configurado" : "⚠️ Configure a API key para enviar emails"}
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await testEmail();
                      toast({ title: "Email de teste enviado" });
                    } catch (e) {
                      toast({ title: "Falha no teste", description: e instanceof Error ? e.message : "Erro", variant: "destructive" });
                    }
                  }}
                >
                  Enviar email de teste
                </Button>
                <Button onClick={() => saveEmailConfig(configForm)}>Salvar configuração</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Accordion type="single" collapsible className="space-y-2">
            {templateSlugs.map((slug) => {
              const current = templateDrafts[slug] || { subject: "", body: "" };
              return (
                <AccordionItem key={slug} value={slug} className="border rounded-lg px-3">
                  <AccordionTrigger>{slug}</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <Label>Assunto</Label>
                    <Input
                      value={current.subject}
                      onChange={(e) => {
                        setTemplateDrafts((prev) => ({ ...prev, [slug]: { ...current, subject: e.target.value } }));
                      }}
                    />
                    <Label>Corpo</Label>
                    <Textarea
                      rows={6}
                      value={current.body}
                      onChange={(e) => {
                        setTemplateDrafts((prev) => ({ ...prev, [slug]: { ...current, body: e.target.value } }));
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {vars.map((token) => (
                        <Button
                          key={token}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTemplateDrafts((prev) => ({ ...prev, [slug]: { ...current, body: `${current.body}${token}` } }));
                          }}
                        >
                          {token}
                        </Button>
                      ))}
                    </div>
                    <div className="rounded border p-3">
                      <p className="text-xs text-zinc-400 mb-1">Preview HTML</p>
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: current.body
                            .replaceAll("{{nome}}", "João")
                            .replaceAll("{{email}}", "joao@email.com")
                            .replaceAll("{{app_name}}", "Contabiliza")
                            .replaceAll("{{app_url}}", window.location.origin)
                            .replaceAll("{{plan_type}}", "monthly")
                            .replaceAll("{{expiry_date}}", "31/12/2026")
                            .replaceAll("{{days_remaining}}", "7"),
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveTemplate(slug, templateDrafts[slug])}>💾 Salvar template</Button>
                      <Button variant="outline" onClick={() => sendTestTemplate(slug)}>📧 Enviar teste</Button>
                      <Button variant="ghost" onClick={() => resetTemplate(slug)}>↺ Restaurar padrão</Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        <TabsContent value="broadcast" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Enviar comunicado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={broadcast.target}
                onValueChange={(value) => {
                  setBroadcast((b) => ({ ...b, target: value }));
                  onEstimateAudience(value);
                }}
              >
                {[
                  { value: "all", label: "Todos os usuários cadastrados" },
                  { value: "active", label: "Assinantes ativos" },
                  { value: "expiring", label: "Expirando em 7 dias" },
                  { value: "trial", label: "Trial ativo" },
                  { value: "expired", label: "Planos expirados (últimos 30 dias)" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`target-${opt.value}`} />
                    <Label htmlFor={`target-${opt.value}`}>{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-zinc-400">→ Aproximadamente {audience} usuários receberão este email</p>
              <Label>Assunto</Label>
              <Input value={broadcast.subject} onChange={(e) => setBroadcast((b) => ({ ...b, subject: e.target.value }))} />
              <Label>Mensagem</Label>
              <Textarea rows={8} value={broadcast.body} onChange={(e) => setBroadcast((b) => ({ ...b, body: e.target.value }))} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewOpen(true)}>Pré-visualizar</Button>
                <Button onClick={() => setConfirmOpen(true)}>Enviar Broadcast</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Card><CardContent className="pt-6"><p className="text-sm text-zinc-400">Hoje</p><p>{today.filter((e: any) => e.status === "sent").length} enviados | {today.filter((e: any) => e.status !== "sent").length} falhas</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-sm text-zinc-400">Esta semana</p><p>{week.filter((e: any) => e.status === "sent").length} enviados</p></CardContent></Card>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Buscar email..." value={historyFilters.search} onChange={(e) => setHistoryFilters((f) => ({ ...f, search: e.target.value }))} />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={historyFilters.template}
              onChange={(e) => setHistoryFilters((f) => ({ ...f, template: e.target.value }))}
            >
              {availableTemplates.map((template) => (
                <option key={template} value={template}>{template === "all" ? "Todos templates" : template}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={historyFilters.status}
              onChange={(e) => setHistoryFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="all">Todos status</option>
              <option value="sent">Enviados</option>
              <option value="failed">Falhas</option>
            </select>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader><TableRow><TableHead>Para</TableHead><TableHead>Template</TableHead><TableHead>Assunto</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow><TableCell colSpan={5}>Carregando...</TableCell></TableRow>
                  ) : filteredHistory.map((item: any) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelectedLog(item)}>
                      <TableCell>{item.to_email}</TableCell>
                      <TableCell>{item.template}</TableCell>
                      <TableCell>{item.subject || "-"}</TableCell>
                      <TableCell>{item.status === "sent" ? "✅" : "❌"}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pré-visualização</DialogTitle></DialogHeader>
          <h4 className="font-semibold">{broadcast.subject}</h4>
          <div dangerouslySetInnerHTML={{ __html: broadcast.body.replaceAll("{{nome}}", "João") }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Enviar para {audience} usuários?</AlertDialogTitle><AlertDialogDescription>Confirme o disparo do broadcast.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                toast({ title: "Enviando..." });
                const result = await sendBroadcast({ target: broadcast.target, subject: broadcast.subject, body: broadcast.body });
                toast({ title: "Broadcast concluído", description: `${result.sent} enviados, ${result.failed} falharam` });
              }}
            >
              Enviar Broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!selectedLog} onOpenChange={(v) => !v && setSelectedLog(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>Detalhes do envio</SheetTitle></SheetHeader>
          <div className="space-y-2 text-sm mt-4">
            <p><strong>Para:</strong> {selectedLog?.to_email}</p>
            <p><strong>Template:</strong> {selectedLog?.template}</p>
            <p><strong>Status:</strong> {selectedLog?.status}</p>
            <p><strong>Resend ID:</strong> {selectedLog?.resend_id || "-"}</p>
            <p><strong>Erro:</strong> {selectedLog?.error || "-"}</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminCommunicationsPage;

