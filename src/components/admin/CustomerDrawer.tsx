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
  active: { label: "Activo", className: "bg-green-100 text-green-700" },
  expiring: { label: "Por expirar", className: "bg-yellow-100 text-yellow-700" },
  expired: { label: "Expirado", className: "bg-red-100 text-red-700" },
  trial: { label: "Trial", className: "bg-blue-100 text-blue-700" },
  no_access: { label: "Sin acceso", className: "bg-gray-100 text-gray-700" },
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
          title: "Error al cargar el perfil del cliente",
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [customer, fetchAccessHistory, fetchEmailHistory, fetchFinance, open, toast]);

  const expiryText = useMemo(() => {
    if (!customer?.current_period_end) return "Sin fecha de expiración";
    const end = new Date(customer.current_period_end);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 0) return `Expira en ${days} día(s)`;
    return `Expirado hace ${Math.abs(days)} día(s)`;
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
    try {
      const { link } = await resetPassword(customer.email);
      if (link) {
        await navigator.clipboard.writeText(link);
        toast({ title: "Enlace copiado", description: "Enlace de recuperación copiado al portapapeles." });
      }
    } catch (error) {
      toast({
        title: "Error al generar enlace",
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleImpersonate = async () => {
    if (!customer) return;
    try {
      const { link } = await generateMagicLink(customer.email);
      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
        toast({ title: "Modo impersonación activo", description: "El acceso se abrió en una nueva pestaña." });
      }
    } catch (error) {
      toast({
        title: "Error al impersonar",
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const saveData = async () => {
    if (!customer) return;
    await editUser(customer.id, form);
    await onReload();
    setEditMode(false);
    toast({ title: "Datos actualizados" });
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
                <div>{customer?.name || "Sin nombre"}</div>
                <div className="text-sm font-normal text-muted-foreground">{customer?.email}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                <Badge variant="outline">{customer?.plan_type || "sin plan"}</Badge>
              </div>
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="access" className="mt-4">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="access">Acceso</TabsTrigger>
              <TabsTrigger value="data">Datos</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="finance">Finanzas</TabsTrigger>
              <TabsTrigger value="emails">Correos</TabsTrigger>
            </TabsList>

            <TabsContent value="access" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado actual</span>
                  <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                </div>
                <p className="mt-2 text-sm">{expiryText}</p>
                <p className="text-sm text-muted-foreground">Plan: {customer?.plan_type || "sin plan"}</p>
                <p className="text-sm text-muted-foreground">Origen: {customer?.source || "manual"}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Health score</span>
                    <span>{health.score} ({health.category})</span>
                  </div>
                  <Progress className="mt-2" value={health.score} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setGrantOpen(true)}>Activar acceso</Button>
                <Button variant="destructive" onClick={() => setRevokeOpen(true)}>
                  Revocar acceso
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
                    <Button variant="ghost" className="px-0">Avanzado</Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={handleResetPassword}>Restablecer contraseña</Button>
                      <Button variant="outline" onClick={handleImpersonate}>Impersonar</Button>
                      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar cuenta</Button>
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
                      <Button size="sm" onClick={saveData}>Guardar</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>✏️ Editar</Button>
                  )}
                </div>
                <p><strong>Nombre:</strong> {editMode ? <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /> : customer?.name || "-"}</p>
                <p><strong>Email:</strong> {editMode ? <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /> : customer?.email}</p>
                <p><strong>Teléfono:</strong> {editMode ? <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /> : customer?.phone || "-"}</p>
                <p><strong>Registrado:</strong> {customer?.created_at ? new Date(customer.created_at).toLocaleString("es-419") : "-"}</p>
                <p><strong>Último acceso:</strong> {customer?.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleString("es-419") : "—"}</p>
                <p><strong>Idioma:</strong> es</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground">Transacciones</p>
                  <p className="text-xl font-semibold">{finance.transactions?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground">Metas / Categorías</p>
                  <p className="text-xl font-semibold">{finance.counters?.goals ?? 0} / {finance.counters?.categories ?? 0}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando historial...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay activaciones manuales registradas.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">
                        {item.action === "activated" ? "✅" : item.action === "revoked" ? "❌" : item.action === "extended" ? "🔵" : item.action === "expired" ? "🟡" : "⚪"} {item.action} - {item.plan_type || "n/a"}
                      </p>
                      <p className="text-muted-foreground">
                        {item.source || "manual"} • {item.created_at ? new Date(item.created_at).toLocaleString("es-419") : "-"}
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
                  <p className="text-muted-foreground">Ingresos</p>
                  <p className="text-lg font-semibold">R$ {Number(finance.totals?.income ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Gastos</p>
                  <p className="text-lg font-semibold">R$ {Number(finance.totals?.expense ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Saldo</p>
                  <p className="text-lg font-semibold">R$ {Number(finance.totals?.balance ?? 0).toFixed(2)}</p>
                </div>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Valor</TableHead><TableHead>Categoría</TableHead><TableHead>Tipo</TableHead></TableRow></TableHeader>
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
                  <Button>Enviar correo</Button>
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
                        toast({ title: "Correo enviado", description: `Plantilla ${tpl}` });
                      }}
                    >
                      {tpl}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
              <Table>
                <TableHeader><TableRow><TableHead>Plantilla</TableHead><TableHead>Asunto</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
                <TableBody>
                  {emailHistory.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.template}</TableCell>
                      <TableCell>{e.subject || "-"}</TableCell>
                      <TableCell>{e.status === "sent" ? "✅" : "❌"}</TableCell>
                      <TableCell>{new Date(e.created_at).toLocaleString("es-419")}</TableCell>
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
          <AlertDialogHeader><AlertDialogTitle>¿Revocar acceso?</AlertDialogTitle><AlertDialogDescription>Esta acción cancela el acceso del usuario.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!customer) return; await revokeAccess(customer.id); await onReload(); }}>Revocar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle><AlertDialogDescription>Confirma para eliminar permanentemente los datos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!customer) return; await deleteUser(customer.id); await onReload(); }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

