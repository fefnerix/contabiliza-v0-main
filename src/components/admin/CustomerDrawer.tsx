import React, { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { GrantAccessModal } from "@/components/admin/GrantAccessModal";
import { AccessLogItem, AdminCustomer, useAdminCustomers } from "@/hooks/useAdminCustomers";

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
  const { getCustomerStatus, grantAccess, fetchAccessHistory, fetchCustomerFinance, resetPassword, impersonateUser } =
    useAdminCustomers();
  const [history, setHistory] = useState<AccessLogItem[]>([]);
  const [finance, setFinance] = useState<any>({ transactions: [], activeGoals: 0, income: 0, expenses: 0, balance: 0 });
  const [grantOpen, setGrantOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const status = customer ? getCustomerStatus(customer) : "no_access";
  const statusInfo = statusMeta[status] ?? statusMeta.no_access;

  useEffect(() => {
    const loadData = async () => {
      if (!customer || !open) return;
      setLoading(true);
      try {
        const [historyData, financeData] = await Promise.all([
          fetchAccessHistory(customer.id),
          fetchCustomerFinance(customer.id),
        ]);
        setHistory(historyData);
        setFinance(financeData);
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
  }, [customer, fetchAccessHistory, fetchCustomerFinance, open, toast]);

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
    await grantAccess({
      action: "activate",
      user_id: customer.id,
      plan_type: payload.plan_type,
      days: payload.days,
      notes: payload.notes,
    });
    await onReload();
  };

  const quickExtend = async (days: number) => {
    if (!customer) return;
    await grantAccess({ action: "extend", user_id: customer.id, days, notes: `Extensão rápida +${days}d` });
    await onReload();
  };

  const revoke = async () => {
    if (!customer) return;
    await grantAccess({ action: "revoke", user_id: customer.id, notes: "Revogação manual via admin" });
    await onReload();
  };

  const handleResetPassword = async () => {
    if (!customer) return;
    const link = await resetPassword(customer.email);
    if (link) {
      navigator.clipboard.writeText(link);
      toast({ title: "Link copiado", description: "Link de recovery copiado para área de transferência." });
      return;
    }
    toast({ title: "Email enviado", description: "Instruções de reset enviadas para o usuário." });
  };

  const handleImpersonate = async () => {
    if (!customer) return;
    const link = await impersonateUser(customer.email);
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
      toast({ title: "Magic link gerado", description: "Acesso abriu em nova aba." });
      return;
    }
    toast({ title: "Link enviado", description: "Solicitação de login enviada ao email do usuário." });
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
              <Badge className={`ml-auto ${statusInfo.className}`}>{statusInfo.label}</Badge>
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="access" className="mt-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="access">Acesso</TabsTrigger>
              <TabsTrigger value="data">Dados</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="finance">Financeiro</TabsTrigger>
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
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setGrantOpen(true)}>Ativar acesso</Button>
                <Button variant="destructive" onClick={revoke}>
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
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-2">Acesso de emergência</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handleResetPassword}>
                    Resetar senha
                  </Button>
                  <Button variant="outline" onClick={handleImpersonate}>
                    Impersonar usuário
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-3 mt-4">
              <div className="rounded-lg border p-4 text-sm space-y-1">
                <p>
                  <strong>Email:</strong> {customer?.email}
                </p>
                <p>
                  <strong>Telefone:</strong> {customer?.phone || "-"}
                </p>
                <p>
                  <strong>Cadastrado em:</strong>{" "}
                  {customer?.created_at ? new Date(customer.created_at).toLocaleString("pt-BR") : "-"}
                </p>
                <p>
                  <strong>Último login:</strong> não disponível no schema público
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground">Transações</p>
                  <p className="text-xl font-semibold">{finance.transactions.length}</p>
                </div>
                <div className="rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground">Metas ativas</p>
                  <p className="text-xl font-semibold">{finance.activeGoals}</p>
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
                        {item.action} - {item.plan_type || "n/a"}
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
                  <p className="text-lg font-semibold">R$ {finance.income.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Despesa</p>
                  <p className="text-lg font-semibold">R$ {finance.expenses.toFixed(2)}</p>
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground">Saldo</p>
                  <p className="text-lg font-semibold">R$ {finance.balance.toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-2">
                {finance.transactions.map((tx: any) => (
                  <div key={tx.id} className="rounded-md border p-2 text-sm flex justify-between">
                    <span>{tx.description || "Sem descrição"}</span>
                    <span>R$ {Number(tx.amount ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <GrantAccessModal open={grantOpen} onOpenChange={setGrantOpen} onConfirm={handleGrant} />
    </>
  );
};

