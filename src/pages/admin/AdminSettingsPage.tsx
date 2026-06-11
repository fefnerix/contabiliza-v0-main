import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminSettings } from "@/hooks/useAdminSettings";

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();
  const {
    branding,
    systemConfig,
    integrations,
    admins,
    lgpdStatus,
    saveBranding,
    saveSystem,
    saveIntegrations,
    toggleMaintenance,
    testDiscord,
    testN8n,
    promoteToAdmin,
    revokeAdmin,
    exportUserData,
    deleteUserData,
    saveLgpdSettings,
  } = useAdminSettings();

  const [brandingForm, setBrandingForm] = useState(branding);
  const [systemForm, setSystemForm] = useState(systemConfig);
  const [integrationsForm, setIntegrationsForm] = useState(integrations);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [lgpdEmail, setLgpdEmail] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => setBrandingForm(branding), [branding]);
  useEffect(() => setSystemForm(systemConfig), [systemConfig]);
  useEffect(() => setIntegrationsForm(integrations), [integrations]);

  const currentUserEmail = adminUser?.email ?? "";
  const lgpdItems = useMemo(
    () => [
      { ok: lgpdStatus.privacyPublished, label: "Política de privacidade publicada" },
      { ok: lgpdStatus.termsPublished, label: "Termos de uso publicados" },
      { ok: lgpdStatus.emailConfigured, label: "Email remetente configurado" },
      { ok: lgpdStatus.resendConfigured, label: "Resend API key configurada" },
    ],
    [lgpdStatus],
  );

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Configurações</h2>

      <Tabs defaultValue="branding">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="branding">BRANDING</TabsTrigger>
          <TabsTrigger value="system">SISTEMA</TabsTrigger>
          <TabsTrigger value="integrations">INTEGRAÇÕES</TabsTrigger>
          <TabsTrigger value="admins">ADMINS</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Branding do aplicativo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Nome do app</Label>
              <Input value={brandingForm.company_name} onChange={(e) => setBrandingForm((b) => ({ ...b, company_name: e.target.value }))} />
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <Label>Logo URL</Label>
                  <Input value={brandingForm.logo_url} onChange={(e) => setBrandingForm((b) => ({ ...b, logo_url: e.target.value }))} />
                  <Label>Cor tema</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandingForm.theme_color || "#16a34a"} onChange={(e) => setBrandingForm((b) => ({ ...b, theme_color: e.target.value }))} className="w-16 p-1" />
                    <Input value={brandingForm.theme_color} onChange={(e) => setBrandingForm((b) => ({ ...b, theme_color: e.target.value }))} />
                  </div>
                  <Label>Favicon URL</Label>
                  <Input value={brandingForm.favicon_url} onChange={(e) => setBrandingForm((b) => ({ ...b, favicon_url: e.target.value }))} />
                  <Label>Texto alt da logo</Label>
                  <Input value={brandingForm.logo_alt_text} onChange={(e) => setBrandingForm((b) => ({ ...b, logo_alt_text: e.target.value }))} />
                  <Label>Mensagem de suporte</Label>
                  <Input value={brandingForm.support_message} onChange={(e) => setBrandingForm((b) => ({ ...b, support_message: e.target.value }))} />
                  <Label>URL dos termos</Label>
                  <Input value={brandingForm.terms_url} onChange={(e) => setBrandingForm((b) => ({ ...b, terms_url: e.target.value }))} />
                </div>
                <div className="space-y-3">
                  <Label>Preview da logo</Label>
                  <div className="h-20 w-20 rounded-md border overflow-hidden flex items-center justify-center bg-zinc-900">
                    {brandingForm.logo_url ? (
                      <img src={brandingForm.logo_url} alt={brandingForm.logo_alt_text || "Logo"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold">{(brandingForm.company_name || "A").slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <Label>Preview header</Label>
                  <div className="rounded-md border overflow-hidden">
                    <div className="h-12 px-3 flex items-center gap-2 text-white" style={{ backgroundColor: brandingForm.theme_color || "#16a34a" }}>
                      <div className="h-6 w-6 rounded bg-white/20" />
                      <span className="font-medium">{brandingForm.company_name || "Seu app"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={() => saveBranding(brandingForm)}>Salvar Branding</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-4">
          <Card className={systemForm.maintenance_mode ? "border-red-500/50 bg-red-950/20" : ""}>
            <CardHeader><CardTitle>Modo manutenção</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="font-medium">{systemForm.maintenance_mode ? "Ativado" : "Desativado"}</span>
                <Switch checked={systemForm.maintenance_mode} onCheckedChange={(v) => setSystemForm((s) => ({ ...s, maintenance_mode: v }))} />
              </div>
              {systemForm.maintenance_mode && (
                <Badge className="bg-red-500/20 text-red-300 animate-pulse">⚠️ MODO MANUTENÇÃO ATIVO</Badge>
              )}
              <Label>Mensagem de manutenção</Label>
              <Textarea value={systemForm.maintenance_message} onChange={(e) => setSystemForm((s) => ({ ...s, maintenance_message: e.target.value }))} />
              <div className="rounded-md border p-3 bg-zinc-900">
                <p className="text-sm text-zinc-400">Preview da tela</p>
                <p className="mt-2 font-medium">{systemForm.maintenance_message || "Estamos em manutenção. Voltamos em breve."}</p>
              </div>
              <Button onClick={() => toggleMaintenance(systemForm.maintenance_mode, systemForm.maintenance_message)}>Salvar configuração de manutenção</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Configurações gerais</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <div><Label>Trial padrão (dias)</Label><Input type="number" value={systemForm.trial_days} onChange={(e) => setSystemForm((s) => ({ ...s, trial_days: Number(e.target.value) }))} /></div>
              <div><Label>Período de graça (dias)</Label><Input type="number" value={systemForm.grace_period_days} onChange={(e) => setSystemForm((s) => ({ ...s, grace_period_days: Number(e.target.value) }))} /></div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Modo debug</span>
                <Switch checked={systemForm.debug_mode} onCheckedChange={(v) => setSystemForm((s) => ({ ...s, debug_mode: v }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Observabilidade</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Discord Webhook URL</Label>
              <Input value={systemForm.discord_webhook_url} onChange={(e) => setSystemForm((s) => ({ ...s, discord_webhook_url: e.target.value }))} />
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await testDiscord();
                  toast({
                    title: result.ok ? "Discord OK" : "Falha no Discord",
                    description: `HTTP ${result.status || "sem resposta"}`,
                    variant: result.ok ? "default" : "destructive",
                  });
                }}
              >
                📣 Testar Discord
              </Button>
              <Button onClick={() => saveSystem(systemForm)}>Salvar configurações do sistema</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Facebook Pixel</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Pixel ID</Label>
              <Input value={integrationsForm.facebook_pixel_id} onChange={(e) => setIntegrationsForm((i) => ({ ...i, facebook_pixel_id: e.target.value }))} />
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Status</span>
                <Switch checked={integrationsForm.facebook_pixel_enabled} onCheckedChange={(v) => setIntegrationsForm((i) => ({ ...i, facebook_pixel_enabled: v }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contato e suporte</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              <div><Label>WhatsApp soporte</Label><Input value={integrationsForm.contact_whatsapp} onChange={(e) => setIntegrationsForm((i) => ({ ...i, contact_whatsapp: e.target.value }))} placeholder="5524981537082" /></div>
              <div><Label>Email soporte</Label><Input value={integrationsForm.contact_email} onChange={(e) => setIntegrationsForm((i) => ({ ...i, contact_email: e.target.value }))} /></div>
              <div><Label>WhatsApp bot (transacciones)</Label><Input value={integrationsForm.contact_phone} onChange={(e) => setIntegrationsForm((i) => ({ ...i, contact_phone: e.target.value }))} placeholder="5511936235098" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Agente WhatsApp (n8n)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>URL de saúde do n8n</Label>
              <Input value={integrationsForm.n8n_health_url} onChange={(e) => setIntegrationsForm((i) => ({ ...i, n8n_health_url: e.target.value }))} />
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await testN8n();
                  toast({
                    title: result.ok ? "Conexão OK" : "Falha na conexão",
                    description: `HTTP ${result.status || "sem resposta"}`,
                    variant: result.ok ? "default" : "destructive",
                  });
                }}
              >
                Testar conexão
              </Button>
              <Button onClick={() => saveIntegrations(integrationsForm)}>Salvar integrações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Usuários com acesso admin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Email para promover..." value={promoteEmail} onChange={(e) => setPromoteEmail(e.target.value)} />
                <Button
                  onClick={async () => {
                    try {
                      await promoteToAdmin(promoteEmail);
                      setPromoteEmail("");
                      toast({ title: "Usuário promovido a admin" });
                    } catch (error) {
                      toast({
                        title: "Falha ao promover",
                        description: error instanceof Error ? error.message : "Erro inesperado",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Promover a admin
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Admin desde</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => {
                    const isCurrent = admin.email.toLowerCase() === currentUserEmail.toLowerCase();
                    return (
                      <TableRow key={admin.user_id} className={isCurrent ? "bg-emerald-500/5" : ""}>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={admin.profile_image ?? ""} />
                            <AvatarFallback>{admin.name?.slice(0, 1)?.toUpperCase() ?? "A"}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>{admin.name}</TableCell>
                        <TableCell>{admin.email} {isCurrent && <Badge className="ml-2" variant="secondary">(você)</Badge>}</TableCell>
                        <TableCell>{admin.created_at ? new Date(admin.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="destructive" disabled={isCurrent} onClick={() => setRevokeId(admin.user_id)}>
                            Revogar acesso
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lgpd" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Status de conformidade</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {lgpdItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-red-400" />}
                  <span>{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ferramentas LGPD</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Label>Email do usuário</Label>
              <Input value={lgpdEmail} onChange={(e) => setLgpdEmail(e.target.value)} placeholder="usuario@email.com" />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const blob = await exportUserData(lgpdEmail);
                    triggerDownload(blob, `export-${lgpdEmail || "usuario"}.json`);
                    toast({ title: "Exportação concluída" });
                  }}
                >
                  Exportar dados
                </Button>
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>Excluir dados</Button>
              </div>
              <div>
                <Label>Retenção (dias)</Label>
                <Input
                  type="number"
                  value={systemForm.data_retention_days}
                  onChange={(e) => setSystemForm((s) => ({ ...s, data_retention_days: Number(e.target.value) }))}
                />
              </div>
              <Button onClick={() => saveLgpdSettings({ data_retention_days: systemForm.data_retention_days })}>Salvar política de retenção</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!revokeId} onOpenChange={(v) => !v && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar admin?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação remove o acesso ao painel admin.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!revokeId) return;
                await revokeAdmin(revokeId);
                setRevokeId(null);
              }}
            >
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dados do usuário?</AlertDialogTitle>
            <AlertDialogDescription>Confirme para remover os dados do email informado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteUserData(lgpdEmail);
                setDeleteConfirmOpen(false);
                toast({ title: "Dados excluídos com sucesso" });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSettingsPage;

