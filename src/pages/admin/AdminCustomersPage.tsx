import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerDrawer } from "@/components/admin/CustomerDrawer";
import { AdminCustomer, CustomerStatus, useAdminCustomers } from "@/hooks/useAdminCustomers";
import { Users } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileNavBar from "@/components/layout/MobileNavBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppContext } from "@/contexts/AppContext";

const statusLabel: Record<CustomerStatus, { text: string; className: string }> = {
  active: { text: "Ativo", className: "bg-green-100 text-green-700" },
  expiring: { text: "Expirando <7d", className: "bg-yellow-100 text-yellow-700" },
  expired: { text: "Expirado", className: "bg-red-100 text-red-700" },
  trial: { text: "Trial", className: "bg-blue-100 text-blue-700" },
  no_access: { text: "Sem acesso", className: "bg-gray-100 text-gray-700" },
};

const AdminCustomersPage: React.FC = () => {
  const { hideValues, toggleHideValues } = useAppContext();
  const isMobile = useIsMobile();
  const { loading, customers, totalCount, totalPages, getCustomerStatus, fetchCustomers, exportCSV } = useAdminCustomers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>("all");
  const [page, setPage] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search, statusFilter, page);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers, page, search, statusFilter]);

  const pageRangeText = useMemo(() => {
    const start = totalCount === 0 ? 0 : page * 20 + 1;
    const end = Math.min((page + 1) * 20, totalCount);
    return `${start}-${end} de ${totalCount} clientes`;
  }, [page, totalCount]);

  const openCustomer = (customer: AdminCustomer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const content = (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{pageRangeText}</p>
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            placeholder="Buscar por email, nome ou telefone"
          />
          <Button variant="outline" onClick={() => exportCSV(search, statusFilter)}>
            Exportar CSV
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "Todos" },
            { value: "active", label: "Ativo" },
            { value: "expiring", label: "Expirando" },
            { value: "expired", label: "Expirado" },
            { value: "trial", label: "Trial" },
            { value: "no_access", label: "Sem acesso" },
          ].map((chip) => (
            <Button
              key={chip.value}
              size="sm"
              variant={statusFilter === (chip.value as "all" | CustomerStatus) ? "default" : "outline"}
              onClick={() => {
                setPage(0);
                setStatusFilter(chip.value as "all" | CustomerStatus);
              }}
            >
              {chip.label}
            </Button>
          ))}
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Último login</TableHead>
                <TableHead>Cadastrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
              {customers.map((customer) => {
                const status = getCustomerStatus(customer);
                const style = statusLabel[status];
                return (
                  <TableRow key={customer.id} className="cursor-pointer" onClick={() => openCustomer(customer)}>
                    <TableCell>{customer.name || "-"}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.plan_type || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={style.className}>{style.text}</Badge>
                    </TableCell>
                    <TableCell>
                      {customer.current_period_end ? new Date(customer.current_period_end).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      {customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>{customer.created_at ? new Date(customer.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{pageRangeText}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <CustomerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        customer={selectedCustomer}
        onReload={async () => fetchCustomers(search, statusFilter, page)}
      />
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
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{content}</main>
    </div>
  );
};

export default AdminCustomersPage;

