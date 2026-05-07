import { useEffect, useMemo, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { GrantAccessModal } from "@/components/admin/GrantAccessModal";
import { AccessLogItem, AdminCustomer, getCustomerStatus, getHealthScore, useAdminCustomers } from "@/hooks/useAdminCustomers";

interface CustomerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: AdminCustomer | null;
  onReload: () => Promise<void>;
}

const statusMeta: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-green-100 text-green-700" },
  expiring: { label: "Expirando", className: "bg-yellow-100 text-yellow-700" },
  expired: { label: "Expirado", className: "bg-red-100 text-red-700" },
  trial: { label: "Trial", className: "bg-blue-100 text-blue-700" },
  no_access: { label: "Sem acesso", className: "bg-gray-100 text-gray-700" },
};

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({ open, onOpenChange, customer, onReload }) => {
  const { toast } = useToast();
  const {
    grantAccess,
    revokeAccess,
    extendAccess,
    fetchAccessHistory,
    fetchFinance,
    fetchEmailHistory,
    resetPassword,
    generateMagicLink,
    editUser,
    deleteUser,
    sendEmail,
  } =
    useAdminCustomers();
  const [history, setHistory] = useState<AccessLogItem[]>([]);
  const [finance, setFinance] = useState<any>({ transactions: [], totals: { income: 0, expense: 0, balance: 0 }, counters: { goals: 0, categories: 0 } });
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [grantOpen, setGrantOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customDays, setCustomDays] = useState(14);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const status = customer ? getCustomerStatus(customer) : "no_access";
  const health = customer ? getHealthScore(customer) : { score: 0, category: "critical" as const };
  const statusInfo = statusMeta[status] ?? statusMeta.no_access;

  useEffect(() => {
    const loadData = async () => {
      if (!customer || !open) return;
      setLoading(true);
      try {
        const [historyData, financeData, emailData] = await Promise.all([
          fetchAccessHistory(customer.id),
          fetchFinance(customer.id),
          fetchEmailHistory(customer.id),
        ]);
        setHistory(historyData);
        setFinance(financeData);
        setEmailHistory(emailData);
        setForm({
          name: customer.name ?? "",
          email: customer.email,
          phone: customer.phone ?? "",
        });
      } catch (error) {
        toast({
          title: "Erro ao carregar perfil do cliente",
          description: error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [customer, fetchAccessHistory, fetchEmailHistory, fetchFinance, open, toast]);

  const expiryText = useMemo(() => {
    if (!customer?.current_period_end) return "Sem data de expiração";
    const end = new Date(customer.current_period_end);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 0) return `Expira em ${days} dia(s)`;
    return `Expirado há ${Math.abs(days)} dia(s)`;
  }, [customer?.current_period_end]);

  const handleGrant = async (payload: { plan_type: string; days?: number; notes?: string }) => {
    if (!customer) return;
    await grantAccess(customer.id, payload);
    await onReload();
  };

  const quickExtend = async (days: number) => {
    if (!customer) return;
    await extendAccess(customer.id, days);
    await onReload();
  };

  const handleResetPassword = async () => {
    if (!customer) return;
    const { link } = await resetPassword(customer.email);
    if (link) {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copiado", description: "Link de recovery copiado para área de transferência." });
    }
  };

  const handleImpersonate = async () => {
    if (!customer) return;
    const { link } = await generateMagicLink(customer.email);
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
      toast({ title: "Modo impersonação ativo", description: "Acesso abriu em nova aba." });
    }
  };

  const saveData = async () => {
    if (!customer) return;
    await editUser(customer.id, form);
    await onReload();
    setEditMode(false);
    toast({ title: "Dados atualizados" });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {(customer?.name?.[0] || customer?.email?.[0] || "U").toUpperCase()}
              </div>
              <div>
                <div>{customer?.name || "Sem nome"}</div>
                <div className="text-sm font-normal text-muted-foreground">{customer?.email}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                <Badge variant="outline">{customer?.plan_type || "sem plano"}</Badge>
              </div>
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="access" className="mt-4">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="access">Acesso</TabsTrigger>
              <TabsTrigger value="data">Dados</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="finance">Financeiro</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
            </TabsList>

            <TabsContent value="access" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status atual</span>
                  <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                </div>
                <p className="mt-2 text-sm">{expiryText}</p>
                <p className="text-sm text-muted-foreground">Plano: {customer?.plan_type || "sem plano"}</p>
                <p className="text-sm text-muted-foreground">Fonte: {customer?.source || "manual"}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Health score</span>
                    <span>{health.score} ({health.category})</span>
                  </div>
                  <Progress className="mt-2" value={health.score} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setGrantOpen(true)}>Ativar acesso</Button>
                <Button variant="destructive" onClick={() => setRevokeOpen(true)}>
                  Revogar acesso
                </Button>
                <Button variant="outline" onClick={() => quickExtend(7)}>
                  +7d
                </Button>
                <Button variant="outline" onClick={() => quickExtend(30)}>
                  +30d
                </Button>
                <Button variant="outline" onClick={() => quickExtend(365)}>
                  +365d
                </Button>
                <div className="flex items-center gap-2">
                  <Input className="w-24" type="number" value={customDays} onChange={(e) => setCustomDays(Number(e.target.value || 1))} />
                  <Button variant="outline" onClick={() => quickExtend(customDays)}>+ custom</Button>
                </div>
              </div>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <div className="rounded-lg border p-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="px-0">Avançado</Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={handleResetPassword}>Resetar Senha</Button>
                      <Button variant="outline" onClick={handleImpersonate}>Impersonar</Button>
                      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Excluir Conta</Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </TabsContent>

            <TabsContent value="data" className="space-y-3 mt-4">
              <div className="rounded-lg border p-4 text-sm space-y-1">
                <div className="flex justify-end">
                  {editMode ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                      <Button size="sm" onClick={saveData}>Salvar</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>✏️ Editar</Button>
                  )}
                </div>
                <p><strong>Nome:</strong> {editMode ? <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /> : customer?.name || "-"}</p>
                <p><strong>Email:</strong> {editMode ? <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /> : customer?.email}</p>
                <p><strong>Telefone:</strong> {editMode ? <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /> : customer?.phone || "-"}</p>
                <p><strong>Cadastrado em:</strong> {customer?.created_at ? new Date(customer.created_at).toLocaleString("pt-BR") : "-"}</p>
                <p><strong>Último login:</strong> {customer?.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleString("pt-BR") : "—"}</p>
                <p><strong>Idioma:</strong> pt-BR</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground">Transações</p>
                  <p className="text-xl font-semibold">{finance.transactions?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground">Metas / Categorias</p>
                  <p className="text-xl font-semibold">{finance.counters?.goals ?? 0} / {finance.counters?.categories ?? 0}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando histórico...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ativação manual registrada.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">
                        {item.action === "activated" ? "✅" : item.action === "revoked" ? "❌" : item.action === "extended" ? "🔵" : item.action === "expired" ? "🟡" : "⚪"} {item.action} - {item.plan_type || "n/a"}
                      </p>
                      <p className="text-muted-foreground">
                        {item.source || "manual"} • {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}
                      </p>
                      {item.notes && <p className="mt-1">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="finance" className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Receita</p>
                  <p className="text-lg font-semibold">R$ {Number(finance.totals?.income ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Despesa</p>
                  <p className="text-lg font-semibold">R$ {Number(finance.totals?.expense ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Saldo</p>
                  <p className="text-lg font-semibold">R$ {Number(finance.totals?.balance ?? 0).toFixed(2)}</p>
                </div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Categoria</TableHead><TableHead>Tipo</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(finance.transactions ?? []).map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>{tx.description || "-"}</TableCell>
                      <TableCell>R$ {Number(tx.amount ?? 0).toFixed(2)}</TableCell>
                      <TableCell>{tx.poupeja_categories?.name || "-"}</TableCell>
                      <TableCell><Badge variant="outline">{tx.type}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="emails" className="mt-4 space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button>Enviar email</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 space-y-2">
                  {["welcome", "access_activated", "expiring_7d", "expiring_1d", "expired", "payment_failed", "payment_retry", "winback", "trial_started"].map((tpl) => (
                    <Button
                      key={tpl}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={async () => {
                        if (!customer) return;
                        await sendEmail(customer.id, customer.email, tpl);
                        toast({ title: "Email enviado", description: `Template ${tpl}` });
                      }}
                    >
                      {tpl}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
              <Table>
                <TableHeader><TableRow><TableHead>Template</TableHead><TableHead>Assunto</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                <TableBody>
                  {emailHistory.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.template}</TableCell>
                      <TableCell>{e.subject || "-"}</TableCell>
                      <TableCell>{e.status === "sent" ? "✅" : "❌"}</TableCell>
                      <TableCell>{new Date(e.created_at).toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <GrantAccessModal open={grantOpen} onOpenChange={setGrantOpen} onConfirm={handleGrant} />
      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Revogar acesso?</AlertDialogTitle><AlertDialogDescription>Esta ação cancela o acesso do usuário.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!customer) return; await revokeAccess(customer.id); await onReload(); }}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir conta?</AlertDialogTitle><AlertDialogDescription>Confirme para excluir permanentemente os dados.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!customer) return; await deleteUser(customer.id); await onReload(); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

