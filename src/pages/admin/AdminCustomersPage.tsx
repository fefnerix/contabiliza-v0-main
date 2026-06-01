import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerDrawer } from "@/components/admin/CustomerDrawer";
import { HealthFilter, PlanFilter, getCustomerStatus, getHealthScore, useAdminCustomers } from "@/hooks/useAdminCustomers";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300",
  expiring: "bg-amber-500/20 text-amber-300",
  expired: "bg-red-500/20 text-red-300",
  trial: "bg-blue-500/20 text-blue-300",
  no_access: "bg-zinc-500/20 text-zinc-300",
};
const healthDot: Record<string, string> = {
  healthy: "bg-emerald-500",
  at_risk: "bg-amber-500",
  critical: "bg-red-500",
};

const AdminCustomersPage = () => {
  const [params, setParams] = useSearchParams();
  const {
    customers,
    totalCount,
    loading,
    page,
    filters,
    setFilters,
    setPage,
    fetchCustomers,
    selectedUser,
    openDrawer,
    closeDrawer,
    exportCSV,
    totalPages,
  } = useAdminCustomers();
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const urlSearch = params.get("search") ?? "";
    const urlFilter = params.get("filter");
    const health = urlFilter === "critical" ? "critical" : ("all" as HealthFilter);
    setFilters((prev) => ({ ...prev, search: urlSearch, health }));
    setSearchInput(urlSearch);
    fetchCustomers({ search: urlSearch, health }, 0);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setFilters((prev) => ({ ...prev, search: searchInput }));
      fetchCustomers({ search: searchInput }, 0);
      const next = new URLSearchParams(params);
      if (searchInput) next.set("search", searchInput);
      else next.delete("search");
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const handler = () => exportCSV();
    window.addEventListener("admin:export-customers", handler as EventListener);
    window.addEventListener("admin:focus-customer-search", () => {
      const el = document.getElementById("admin-customers-search");
      (el as HTMLInputElement | null)?.focus();
    });
    return () => {
      window.removeEventListener("admin:export-customers", handler as EventListener);
      window.removeEventListener("admin:focus-customer-search", () => null);
    };
  }, [exportCSV]);

  const statusFilterChip = (value: "all" | any, label: string) => (
    <Button
      size="sm"
      variant={filters.status === value ? "default" : "outline"}
      onClick={() => {
        setPage(0);
        setFilters((prev) => ({ ...prev, status: value }));
        fetchCustomers({ status: value }, 0);
      }}
    >
      {label}
    </Button>
  );

  const healthFilterChip = (value: HealthFilter, label: string) => (
    <Button
      size="sm"
      variant={filters.health === value ? "default" : "outline"}
      onClick={() => {
        setPage(0);
        setFilters((prev) => ({ ...prev, health: value }));
        fetchCustomers({ health: value }, 0);
      }}
    >
      {label}
    </Button>
  );

  const planFilterButtons: Array<{ value: PlanFilter; label: string }> = [
    { value: "all", label: "Todos los planes" },
    { value: "monthly", label: "Mensal" },
    { value: "annual", label: "Anual" },
    { value: "lifetime", label: "Lifetime" },
    { value: "trial", label: "Trial" },
  ];

  const rangeLabel = useMemo(() => {
    const from = totalCount === 0 ? 0 : page * 20 + 1;
    const to = Math.min(totalCount, page * 20 + 20);
    return `${from}-${to} de ${totalCount} clientes`;
  }, [page, totalCount]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-emerald-500" />
          <h2 className="text-2xl font-semibold">Clientes</h2>
          <Badge variant="secondary">{totalCount} clientes</Badge>
        </div>
        <Button variant="outline" onClick={() => exportCSV()}>Exportar CSV</Button>
      </div>

      <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
        <Input
          id="admin-customers-search"
          placeholder="Buscar por correo, nombre o teléfono"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {statusFilterChip("all", "Todos")}
          {statusFilterChip("active", "Activo")}
          {statusFilterChip("expiring", "Por expirar (<7d)")}
          {statusFilterChip("expired", "Expirado")}
          {statusFilterChip("trial", "Trial")}
          {statusFilterChip("no_access", "Sin acceso")}
        </div>
        <div className="flex flex-wrap gap-2">
          {healthFilterChip("all", "Salud: Todos")}
          {healthFilterChip("healthy", "Saludable")}
          {healthFilterChip("at_risk", "En riesgo")}
          {healthFilterChip("critical", "Crítico")}
        </div>
        <div className="flex flex-wrap gap-2">
          {planFilterButtons.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={filters.plan === p.value ? "default" : "outline"}
              onClick={() => {
                setPage(0);
                setFilters((prev) => ({ ...prev, plan: p.value }));
                fetchCustomers({ plan: p.value }, 0);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="rounded-md border border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Health</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && customers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-zinc-400">No se encontraron clientes.</TableCell></TableRow>
              ) : null}
              {customers.map((customer) => {
                const status = getCustomerStatus(customer);
                const health = getHealthScore(customer);
                return (
                  <TableRow key={customer.id} className="cursor-pointer" onClick={() => openDrawer(customer.id)}>
                    <TableCell><span className={`inline-block h-2.5 w-2.5 rounded-full ${healthDot[health.category]}`} /></TableCell>
                    <TableCell>{customer.name || "-"}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.plan_type || "—"}</TableCell>
                    <TableCell><Badge className={statusStyles[status]}>{status}</Badge></TableCell>
                    <TableCell>{customer.current_period_end ? new Date(customer.current_period_end).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>{customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>{customer.created_at ? new Date(customer.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">{rangeLabel}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => { const p = page - 1; setPage(p); fetchCustomers(undefined, p); }}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => { const p = page + 1; setPage(p); fetchCustomers(undefined, p); }}>Siguiente</Button>
          </div>
        </div>
      </div>

      <CustomerDrawer
        open={!!selectedUser}
        onOpenChange={(v) => !v && closeDrawer()}
        customer={selectedUser}
        onReload={() => fetchCustomers()}
      />
    </div>
  );
};

export default AdminCustomersPage;

